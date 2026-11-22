import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  ComplianceDashboardClient,
  type AuditEventRow,
  type ComplianceCategoryRow,
  type PrivacyRequestRow,
  type TrustReportRow,
  type VerificationReviewHistory,
  type WorkerVerificationRow,
} from './compliance-dashboard';

export const metadata: Metadata = { title: 'Compliance Review | Doorstep' };

export default async function ComplianceDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  let supabase;
  let user;
  try {
    supabase = await createClient();
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch {
    redirect('/login');
  }
  if (!user) redirect('/login');
  const access = await supabase.rpc('is_compliance_admin');
  if (access.error || !access.data) redirect('/dashboard');

  const [categoryResult, verificationResult, verificationReviewResult, privacyResult, reportResult, auditResult] =
    await Promise.all([
      supabase
        .from('category_compliance')
        .select('category_id,state,required_verification_kinds,review_reference,categories(name)')
        .order('category_id'),
      supabase
        .from('worker_verifications')
        .select(
          'id,provider_id,kind,issuing_authority,credential_name,credential_number,scope,expires_on,evidence_path,status,created_at',
        )
        .order('created_at'),
      supabase
        .from('worker_verification_reviews')
        .select('verification_id,reviewer_id,decision,internal_note,created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('privacy_requests')
        .select('id,subject_id,request_kind,details,status,created_at')
        .order('created_at'),
      supabase
        .from('trust_reports')
        .select('id,reporter_id,booking_id,report_kind,description,status,created_at')
        .order('created_at'),
      supabase
        .from('compliance_audit_events')
        .select('id,actor_id,event_kind,record_id,from_state,to_state,created_at')
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

  const verificationRows = (verificationResult.data || []) as WorkerVerificationRow[];
  const evidenceLinks: Record<string, string> = {};
  for (const item of verificationRows) {
    if (!item.evidence_path) continue;
    const audit = await supabase.rpc('record_verification_document_access', { p_verification_id: item.id });
    if (audit.error) continue;
    const { data } = await supabase.storage
      .from('doorstep-verification-evidence')
      .createSignedUrl(item.evidence_path, 60);
    if (data?.signedUrl) evidenceLinks[item.id] = data.signedUrl;
  }
  const messages = await searchParams;

  return (
    <ComplianceDashboardClient
      adminEmail={user.email || 'Compliance Staff'}
      hasError={Object.values(messages).includes('error')}
      hasSaved={Object.values(messages).includes('saved')}
      categories={(categoryResult.data || []) as unknown as ComplianceCategoryRow[]}
      categoryError={Boolean(categoryResult.error)}
      verifications={verificationRows}
      reviews={(verificationReviewResult.data || []) as VerificationReviewHistory[]}
      reviewHistoryError={Boolean(verificationReviewResult.error)}
      evidenceLinks={evidenceLinks}
      privacyRequests={(privacyResult.data || []) as PrivacyRequestRow[]}
      trustReports={(reportResult.data || []) as TrustReportRow[]}
      auditEvents={(auditResult.data || []) as AuditEventRow[]}
    />
  );
}
