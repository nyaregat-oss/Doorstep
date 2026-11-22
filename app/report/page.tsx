import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { submitTrustReport } from './actions';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Report a Concern | Doorstep' };

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const params = await searchParams;
  let user: { id: string } | null = null;
  let reports: Array<{ id: string; report_kind: string; status: string; created_at: string }> = [];
  try {
    const supabase = await createClient();
    const auth = await supabase.auth.getUser();
    user = auth.data.user ? { id: auth.data.user.id } : null;
    if (user) {
      const result = await supabase
        .from('trust_reports')
        .select('id, report_kind, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      reports = result.data || [];
    }
  } catch {
    /* Keep reporting instructions visible without database configuration. */
  }

  return (
    <main className="ds-container ds-prose-wrap">
      <Link className="ds-back-link" href="/">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Doorstep
      </Link>

      <section className="ds-card ds-prose-card">
        <span className="ds-eyebrow">
          <ShieldAlert size={14} aria-hidden="true" />
          Safety &amp; service moderation
        </span>
        <h1>Report a safety issue or concern</h1>
        <p className="ds-muted">
          Use this form to report an unsafe job, misconduct, a service complaint, or another marketplace concern.
          Reports remain private between you and Doorstep compliance staff. This form is not an emergency service —
          contact local emergency services first if anyone is in immediate danger.
        </p>

        {params.submitted === '1' && (
          <div className="ds-alert ds-alert-success" role="status">
            <span>Your report was recorded for moderation review.</span>
          </div>
        )}
        {params.error && (
          <div className="ds-alert ds-alert-error" role="alert">
            <span>The report could not be recorded. Sign in and confirm the compliance migration is applied.</span>
          </div>
        )}

        {user ? (
          <form action={submitTrustReport} style={{ display: 'grid', gap: 14 }}>
            <label className="ds-field">
              Concern type
              <select className="ds-select" name="report_kind">
                <option value="safety">Safety or injury</option>
                <option value="harassment">Harassment or misconduct</option>
                <option value="service_complaint">Service complaint</option>
                <option value="payment_concern">Payment concern</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="ds-field">
              Related booking ID (optional)
              <input className="ds-input" name="booking_id" maxLength={36} placeholder="Paste the booking UUID if relevant" />
            </label>
            <label className="ds-field">
              What happened?
              <textarea
                className="ds-textarea"
                name="description"
                minLength={10}
                maxLength={3000}
                rows={5}
                required
                placeholder="Share clear details needed for our compliance team to review..."
              />
            </label>
            <div>
              <button className="ds-btn ds-btn-primary" type="submit">
                Submit report
              </button>
            </div>
          </form>
        ) : (
          <div className="ds-alert ds-alert-info">
            <span>
              <Link href="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                Sign in
              </Link>{' '}
              to submit a report linked to your account.
            </span>
          </div>
        )}

        {reports.length > 0 && (
          <div className="ds-prose-section">
            <h2>Your recent reports</h2>
            <ul className="ds-record-list">
              {reports.map((report) => (
                <li className="ds-record-item" key={report.id}>
                  <div>
                    <strong>{report.report_kind.replaceAll('_', ' ')}</strong>
                    <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                      {new Date(report.created_at).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                  <Badge tone={report.status === 'resolved' || report.status === 'closed' ? 'success' : 'warning'}>
                    {report.status.replaceAll('_', ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
