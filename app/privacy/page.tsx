import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { submitPrivacyRequest } from './actions';

export const metadata: Metadata = { title: 'Privacy | Doorstep' };

const requestOptions = [
  ['access', 'Access my information'],
  ['correction', 'Correct my information'],
  ['objection', 'Object to a use of my information'],
  ['restriction', 'Restrict a use of my information'],
  ['portability', 'Request a copy in a portable format'],
  ['erasure', 'Request erasure'],
  ['other', 'Other privacy request'],
];

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const params = await searchParams;
  let user: { id: string } | null = null;
  let requests: Array<{ id: string; request_kind: string; status: string; created_at: string }> = [];
  try {
    const supabase = await createClient();
    const auth = await supabase.auth.getUser();
    user = auth.data.user ? { id: auth.data.user.id } : null;
    if (user) {
      const result = await supabase.from('privacy_requests').select('id, request_kind, status, created_at').order('created_at', { ascending: false }).limit(20);
      requests = result.data || [];
    }
  } catch { /* A static notice remains available before Supabase is configured. */ }

  return <main className="wrap auth-wrap">
    <a className="logo" href="/"><i/>Doorstep</a>
    <section className="card auth-card">
      <p className="eyebrow">Privacy information · pre-launch draft</p>
      <h1>Your information</h1>
      <p>This notice describes the prototype as it exists today. It is not a statement that Doorstep is legally compliant. The final controller, processor, lawful-basis, retention, vendor-transfer, and ODPC registration details are still under review; the live service must not launch until those details are settled.</p>
      <h2>Information used by the prototype</h2>
      <p>When account features are configured, Doorstep processes account email and the profile details you provide. Provider profiles may include a business name, service area, description, service prices, and availability. A service request can include a preferred time, an area/address, a work description, quotes, and messages between the two participants.</p>
      <p>These details are used to create accounts, show provider listings, and let the participants manage a service request. The current prototype does not collect payment details or identity-document images. Do not put identity numbers, passwords, health information, or sensitive access details in a public profile or message. Share a precise job address only when it is necessary for the agreed service.</p>
      <h2>Where information is stored and how long it is kept</h2>
      <p>Account and marketplace data use the configured Supabase project. Doorstep has not yet recorded the production hosting region, sub-processors, cross-border transfer safeguards, or a final retention schedule. Those must be documented before real customer or worker data is used.</p>
      <h2>Your requests</h2>
      <p>Subject to applicable law, you may ask about access, correction, objection, restriction, portability, or erasure. Submit a request below while signed in. A request is not automatically fulfilled: a reviewer must check identity, applicable legal duties, and any record-retention requirements, then record the outcome.</p>
      {params.submitted === '1' && <p className="auth-message" role="status">Your request was recorded for review.</p>}
      {params.error && <p className="auth-error" role="alert">The request could not be recorded. Confirm the compliance migration is applied and try again.</p>}
      {user ? <form action={submitPrivacyRequest} className="auth-fields">
        <label>Request type<select name="request_kind" required>{requestOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Details (do not include identity numbers or passwords)<textarea name="details" maxLength={1200} rows={4} placeholder="Describe the information or processing you are asking about."/></label>
        <button className="btn" type="submit">Submit privacy request</button>
      </form> : <p className="note"><a href="/login">Sign in</a> to submit a request. If you cannot access your account, contact Doorstep through the support channel provided to you.</p>}
      {requests.length > 0 && <section className="provider-panel"><h2>Your recent requests</h2><ul>{requests.map((request) => <li key={request.id}>{request.request_kind.replaceAll('_', ' ')} · {request.status.replaceAll('_', ' ')} · {new Date(request.created_at).toLocaleDateString('en-KE')}</li>)}</ul></section>}
      <p className="note">This draft needs a Kenyan privacy review before it is used as Doorstep’s final statutory privacy notice.</p>
      <a className="auth-link" href="/report">Report a safety issue or complaint</a>
    </section>
  </main>;
}
