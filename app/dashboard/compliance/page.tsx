import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { reviewCategoryAction, reviewPrivacyRequestAction, reviewTrustReportAction, reviewVerificationAction } from './actions';

export const metadata: Metadata = { title: 'Compliance review | Doorstep' };

export default async function ComplianceDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  let supabase;
  let user;
  try {
    supabase = await createClient();
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch { redirect('/login'); }
  if (!user) redirect('/login');
  const access = await supabase.rpc('is_compliance_admin');
  if (access.error || !access.data) redirect('/dashboard');

  const [categoryResult, verificationResult, verificationReviewResult, privacyResult, reportResult] = await Promise.all([
    supabase.from('category_compliance').select('category_id,state,required_verification_kinds,review_reference,categories(name)').order('category_id'),
    supabase.from('worker_verifications').select('id,provider_id,kind,issuing_authority,credential_name,credential_number,scope,expires_on,evidence_path,status,created_at').order('created_at'),
    supabase.from('worker_verification_reviews').select('verification_id,reviewer_id,decision,internal_note,created_at').order('created_at', { ascending: false }),
    supabase.from('privacy_requests').select('id,subject_id,request_kind,details,status,created_at').order('created_at'),
    supabase.from('trust_reports').select('id,reporter_id,booking_id,report_kind,description,status,created_at').order('created_at'),
  ]);

  const verificationRows = verificationResult.data || [];
  const verificationReviews = verificationReviewResult.data || [];
  const evidenceLinks: Record<string, string> = {};
  for (const item of verificationRows) {
    if (!item.evidence_path) continue;
    const audit = await supabase.rpc('record_verification_document_access', { p_verification_id: item.id });
    if (audit.error) continue;
    const { data } = await supabase.storage.from('doorstep-verification-evidence').createSignedUrl(item.evidence_path, 60);
    if (data?.signedUrl) evidenceLinks[item.id] = data.signedUrl;
  }
  const messages = await searchParams;

  return <main className="wrap auth-wrap">
    <a className="logo" href="/"><i/>Doorstep</a>
    <header className="dashboard-heading"><div><p className="eyebrow">Restricted staff area</p><h1>Compliance review</h1><p className="sub">Only use this area for work you are authorised to perform. Review legal scope before approving a service category.</p></div></header>
    {Object.values(messages).includes('error') && <p className="auth-error" role="alert">A change could not be saved. Confirm the compliance migration is applied and your admin role is active.</p>}
    {Object.values(messages).includes('saved') && <p className="auth-message" role="status">Review status saved.</p>}

    <section className="provider-panel"><h2>Service category launch review</h2><p className="muted">All categories begin blocked from live publication. Approve only after documenting advice or confirmation for the exact service scope and county.</p>
      {categoryResult.error && <p className="auth-error">Compliance tables are unavailable. Apply the compliance migration.</p>}
      <div className="request-list">{(categoryResult.data || []).map((row: any) => {
        const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
        return <article className="card request-card" key={row.category_id}>
          <h3>{category?.name || row.category_id}</h3><p>Current state: {row.state} · Required checks: {(row.required_verification_kinds || []).join(', ') || 'none configured'}</p>
          <form action={reviewCategoryAction} className="provider-fields">
            <input type="hidden" name="category_id" value={row.category_id}/>
            <label>Decision<select name="state" defaultValue={row.state}><option value="pending">Pending</option><option value="approved">Approved for pilot</option><option value="blocked">Blocked</option></select></label>
            <label>Required checks (identity, qualification, professional_licence, reference; comma-separated)<input name="required_verification_kinds" defaultValue={(row.required_verification_kinds || []).join(',')}/></label>
            <label className="wide">Counsel/regulator review reference (required to approve or block)<input name="review_reference" maxLength={500} defaultValue={row.review_reference || ''}/></label>
            <button className="btn small">Save review</button>
          </form>
        </article>;
      })}</div>
    </section>

    <section className="provider-panel"><h2>Worker credential reviews</h2>
      {verificationReviewResult.error && <p className="auth-error">Staff review history is unavailable. Apply the compliance security hardening migration before reviewing credentials.</p>}
      <div className="request-list">{verificationRows.map((item: any) => <article className="card request-card" key={item.id}>
        <p className="eyebrow">{item.kind.replaceAll('_', ' ')} · {item.status}</p><p>Provider {item.provider_id} · {item.credential_name || 'Credential'} · {item.issuing_authority || 'Authority not supplied'}</p>
        <p className="muted">Scope: {item.scope || 'Not specified'} · Expiry: {item.expires_on || 'Not supplied'} · Reference ending: {item.credential_number ? item.credential_number.slice(-4) : 'not supplied'}</p>
        {evidenceLinks[item.id] && <p><a href={evidenceLinks[item.id]} target="_blank" rel="noreferrer">Open private evidence (expires in 60 seconds)</a></p>}
        {verificationReviews.filter((review: any) => review.verification_id === item.id).map((review: any) => <p className="muted" key={review.created_at}>Staff review ({review.decision}): {review.internal_note || 'No internal note'}</p>)}
        <form action={reviewVerificationAction} className="provider-fields">
          <input type="hidden" name="verification_id" value={item.id}/>
          <label>Decision<select name="status" defaultValue={item.status === 'pending' ? 'approved' : item.status}><option value="approved">Approve evidence</option><option value="rejected">Reject evidence</option><option value="suspended">Suspend check</option></select></label>
          <label>Internal review note<input name="reviewer_note" maxLength={1000}/></label>
          <label>Message to provider<input name="provider_message" maxLength={1000}/></label><button className="btn small">Record decision</button>
        </form>
      </article>)}</div>
      {!verificationRows.length && <p className="muted">No worker evidence is waiting for review.</p>}
    </section>

    <section className="provider-panel"><h2>Privacy requests</h2><div className="request-list">{(privacyResult.data || []).map((item: any) => <article className="card request-card" key={item.id}>
      <p>{item.request_kind} · {item.status} · Account {item.subject_id}</p><p>{item.details || 'No additional details'}</p>
      <form action={reviewPrivacyRequestAction} className="provider-fields"><input type="hidden" name="request_id" value={item.id}/><label>Status<select name="status"><option value="in_review">In review</option><option value="needs_information">Needs information</option><option value="fulfilled">Fulfilled</option><option value="declined">Declined</option></select></label><label>Response note<input name="response_note" maxLength={1200}/></label><button className="btn small">Update request</button></form>
    </article>)}</div></section>

    <section className="provider-panel"><h2>Safety and service reports</h2><div className="request-list">{(reportResult.data || []).map((item: any) => <article className="card request-card" key={item.id}>
      <p>{item.report_kind.replaceAll('_', ' ')} · {item.status} · Reporter {item.reporter_id}{item.booking_id ? ` · Request ${item.booking_id}` : ''}</p><p>{item.description}</p>
      <form action={reviewTrustReportAction} className="provider-fields"><input type="hidden" name="report_id" value={item.id}/><label>Status<select name="status"><option value="in_review">In review</option><option value="resolved">Resolved</option><option value="referred">Referred</option><option value="closed">Closed</option></select></label><label>Response note<input name="response_note" maxLength={1200}/></label><button className="btn small">Update report</button></form>
    </article>)}</div></section>
  </main>;
}
