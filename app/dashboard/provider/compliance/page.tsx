import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { submitVerificationAction } from '../compliance-actions';
import { isLaunchGateEnabled } from '@/lib/launch-gate';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Credentials & Verification | Doorstep' };

export default async function ProviderCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const params = await searchParams;
  let supabase;
  let user;
  try {
    supabase = await createClient();
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    redirect('/login');
  }
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'provider') redirect('/dashboard');

  const result = await supabase
    .from('worker_verifications')
    .select('id,kind,credential_name,issuing_authority,scope,expires_on,status,provider_message,created_at')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false });
  const launchGateEnabled = isLaunchGateEnabled();

  return (
    <main className="ds-container ds-prose-wrap">
      <Link className="ds-back-link" href="/dashboard/provider">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to provider workspace
      </Link>

      <section className="ds-card ds-prose-card">
        <span className="ds-eyebrow">
          <ShieldCheck size={14} aria-hidden="true" />
          Provider credentials
        </span>
        <h1>Credentials &amp; qualifications</h1>
        <p className="ds-muted">
          Submit professional licence, qualification, or reference information for compliance review. A submitted record
          remains unapproved until reviewed. Identity-document and biometric checks are not collected in this prototype.
        </p>

        {params.submitted === '1' && (
          <div className="ds-alert ds-alert-success" role="status">
            <span>Your credential record was submitted for compliance review.</span>
          </div>
        )}
        {launchGateEnabled && (
          <div className="ds-alert ds-alert-warning" role="status">
            <span>
              Pre-launch is enabled. Credential submissions and document uploads remain disabled pending legal review.
            </span>
          </div>
        )}
        {params.error && params.error !== 'launch_gate' && (
          <div className="ds-alert ds-alert-error" role="alert">
            <span>
              We could not submit the record. Confirm the compliance migration is applied and check file type/size.
            </span>
          </div>
        )}
        {params.error === 'launch_gate' && (
          <div className="ds-alert ds-alert-error" role="alert">
            <span>Credential submissions are disabled during pre-launch.</span>
          </div>
        )}

        <form action={submitVerificationAction} style={{ display: 'grid', gap: 14 }}>
          <fieldset
            disabled={launchGateEnabled}
            style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 14 }}
          >
            <label className="ds-field">
              Check type
              <select className="ds-select" name="kind">
                <option value="professional_licence">Professional licence</option>
                <option value="qualification">Qualification</option>
                <option value="reference">Reference</option>
              </select>
            </label>
            <label className="ds-field">
              Credential or qualification name
              <input className="ds-input" name="credential_name" minLength={2} maxLength={200} required />
            </label>
            <label className="ds-field">
              Issuing authority or referee
              <input className="ds-input" name="issuing_authority" minLength={2} maxLength={200} required />
            </label>
            <label className="ds-field">
              Licence number (required for licences)
              <input className="ds-input" name="credential_number" maxLength={120} autoComplete="off" />
            </label>
            <label className="ds-field">
              Work scope or class
              <input
                className="ds-input"
                name="scope"
                maxLength={500}
                placeholder="Enter the scope shown on the document"
              />
            </label>
            <label className="ds-field">
              Expiry date, if any
              <input className="ds-input" name="expires_on" type="date" />
            </label>
            <label className="ds-field">
              Supporting professional file (optional)
              <input
                className="ds-input"
                name="evidence"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              />
              <span className="ds-field-hint">
                Upload only the relevant professional document. Never upload national IDs, passports, or biometrics.
              </span>
            </label>
            <div>
              <button className="ds-btn ds-btn-primary" type="submit">
                Submit for review
              </button>
            </div>
          </fieldset>
        </form>

        <div className="ds-prose-section">
          <h2>Your submissions</h2>
          {result.error && (
            <div className="ds-alert ds-alert-error">
              <span>Compliance records are unavailable. Apply the newest database migration.</span>
            </div>
          )}
          {result.data?.length ? (
            <ul className="ds-record-list">
              {result.data.map((item) => (
                <li className="ds-record-item" key={item.id}>
                  <div>
                    <strong>{item.credential_name}</strong>
                    <p className="ds-muted" style={{ fontSize: '0.86rem' }}>
                      {item.kind.replaceAll('_', ' ')} · {item.issuing_authority}
                      {item.expires_on ? ` · Expires ${item.expires_on}` : ''}
                    </p>
                    {item.provider_message && (
                      <p style={{ fontSize: '0.86rem', marginTop: 4 }}>Reviewer note: {item.provider_message}</p>
                    )}
                  </div>
                  <Badge tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}>
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ds-muted">No credential submissions yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
