import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { submitTrustReport } from './actions';

export const metadata: Metadata = { title: 'Report a concern | Doorstep' };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const params = await searchParams;
  let user: { id: string } | null = null;
  let reports: Array<{ id: string; report_kind: string; status: string; created_at: string }> = [];
  try {
    const supabase = await createClient();
    const auth = await supabase.auth.getUser();
    user = auth.data.user ? { id: auth.data.user.id } : null;
    if (user) {
      const result = await supabase.from('trust_reports').select('id, report_kind, status, created_at').order('created_at', { ascending: false }).limit(20);
      reports = result.data || [];
    }
  } catch { /* Keep the reporting instructions visible without database configuration. */ }

  return <main className="wrap auth-wrap">
    <a className="logo" href="/"><i/>Doorstep</a>
    <section className="card auth-card">
      <p className="eyebrow">Safety and service support</p>
      <h1>Report a concern</h1>
      <p>Use this form for an unsafe job, harassment, a service complaint, or another concern. Reports are private to you and Doorstep compliance staff in the database policies. Do not use this form for an emergency; contact local emergency services first.</p>
      <p>Doorstep has not launched a payment service, so this form cannot issue a refund or payment reversal. No payment is collected by the current prototype.</p>
      {params.submitted === '1' && <p className="auth-message" role="status">Your report was recorded for review.</p>}
      {params.error && <p className="auth-error" role="alert">The report could not be recorded. Sign in and confirm the compliance migration is applied.</p>}
      {user ? <form action={submitTrustReport} className="auth-fields">
        <label>Concern type<select name="report_kind"><option value="safety">Safety or injury</option><option value="harassment">Harassment or misconduct</option><option value="service_complaint">Service complaint</option><option value="payment_concern">Payment concern</option><option value="other">Other</option></select></label>
        <label>Booking ID (optional)<input name="booking_id" maxLength={36} placeholder="Paste the request ID if relevant"/></label>
        <label>What happened?<textarea name="description" minLength={10} maxLength={3000} rows={5} required placeholder="Share only details needed to review this concern."/></label>
        <button className="btn" type="submit">Submit report</button>
      </form> : <p className="note"><a href="/login">Sign in</a> to report a concern. If you cannot access your account, use the support channel provided to you.</p>}
      {reports.length > 0 && <section className="provider-panel"><h2>Your recent reports</h2><ul>{reports.map((report) => <li key={report.id}>{report.report_kind.replaceAll('_', ' ')} · {report.status.replaceAll('_', ' ')} · {new Date(report.created_at).toLocaleDateString('en-KE')}</li>)}</ul></section>}
      <a className="auth-link" href="/privacy">Read privacy information</a>
    </section>
  </main>;
}
