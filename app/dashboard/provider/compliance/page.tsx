import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { submitVerificationAction } from '../compliance-actions';
import { isLaunchGateEnabled } from '@/lib/launch-gate';

export const metadata: Metadata = { title: 'Provider checks | Doorstep' };

export default async function ProviderCompliancePage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const params = await searchParams;
  let supabase;
  let user;
  try {
    supabase = await createClient();
    user = (await supabase.auth.getUser()).data.user;
  } catch { redirect('/login'); }
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'provider') redirect('/dashboard');
  const result = await supabase.from('worker_verifications')
    .select('id,kind,credential_name,issuing_authority,scope,expires_on,status,provider_message,created_at')
    .eq('provider_id', user.id).order('created_at', { ascending: false });
  const launchGateEnabled = isLaunchGateEnabled();

  return <main className="wrap auth-wrap">
    <a className="logo" href="/"><i/>Doorstep</a>
    <section className="card auth-card">
      <p className="eyebrow">Provider checks</p><h1>Credentials and qualifications</h1>
      <p>Submit professional licence, qualification, or reference information for staff review. A submitted record is not approved until reviewed. Identity-document and biometric checks are not collected in this prototype; those require a separate privacy and legal review. A Doorstep document review does not replace a regulator’s licence or establish general professional competence.</p>
      {params.submitted === '1' && <p className="auth-message" role="status">Your information was submitted for review.</p>}
      {launchGateEnabled && <p className="banner" role="status">Pre-launch is enabled. Credential submissions and document uploads are temporarily unavailable pending legal review.</p>}
      {params.error && params.error !== 'launch_gate' && <p className="auth-error" role="alert">We could not submit the record. Confirm the compliance migration is applied and check the file type/size.</p>}
      {params.error === 'launch_gate' && <p className="auth-error" role="alert">Credential submissions are disabled during pre-launch.</p>}
      <form action={submitVerificationAction} className="auth-fields">
        <fieldset disabled={launchGateEnabled}>
        <label>Check type<select name="kind"><option value="professional_licence">Professional licence</option><option value="qualification">Qualification</option><option value="reference">Reference</option></select></label>
        <label>Credential or qualification name<input name="credential_name" minLength={2} maxLength={200} required/></label>
        <label>Issuing authority or referee<input name="issuing_authority" minLength={2} maxLength={200} required/></label>
        <label>Licence number (required for licences)<input name="credential_number" maxLength={120} autoComplete="off"/></label>
        <label>Work scope or class<input name="scope" maxLength={500} placeholder="Enter the scope shown on the document"/></label>
        <label>Expiry date, if any<input name="expires_on" type="date"/></label>
        <label>Supporting licence/qualification/reference file (optional)<input name="evidence" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"/></label>
        <p className="note">Upload only the relevant professional document. Do not upload a national ID, passport, biometric data, or health document.</p>
        <button className="btn" type="submit">Submit for review</button>
        </fieldset>
      </form>
      <h2>Your submissions</h2>{result.error && <p className="auth-error">Compliance records are unavailable. Apply the newest database migration.</p>}
      {result.data?.length ? <ul>{result.data.map((item: any) => <li key={item.id}>{item.kind.replaceAll('_', ' ')} · {item.credential_name} · {item.status}{item.expires_on ? ` · expires ${item.expires_on}` : ''}{item.provider_message ? ` · reviewer message: ${item.provider_message}` : ''}</li>)}</ul> : <p className="muted">No submissions yet.</p>}
      <a className="auth-link" href="/dashboard/provider">Back to provider workspace</a>
    </section>
  </main>;
}
