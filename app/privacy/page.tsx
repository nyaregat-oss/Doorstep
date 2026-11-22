import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { submitPrivacyRequest } from './actions';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Privacy Information | Doorstep' };

const requestOptions = [
  ['access', 'Access my information'],
  ['correction', 'Correct my information'],
  ['objection', 'Object to a use of my information'],
  ['restriction', 'Restrict a use of my information'],
  ['portability', 'Request a copy in a portable format'],
  ['erasure', 'Request erasure'],
  ['other', 'Other privacy request'],
];

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const params = await searchParams;
  let user: { id: string } | null = null;
  let requests: Array<{ id: string; request_kind: string; status: string; created_at: string }> = [];
  try {
    const supabase = await createClient();
    const auth = await supabase.auth.getUser();
    user = auth.data.user ? { id: auth.data.user.id } : null;
    if (user) {
      const result = await supabase
        .from('privacy_requests')
        .select('id, request_kind, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      requests = result.data || [];
    }
  } catch {
    /* Static notice stays available before Supabase is configured. */
  }

  return (
    <main className="ds-container ds-prose-wrap">
      <Link className="ds-back-link" href="/">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Doorstep
      </Link>

      <section className="ds-card ds-prose-card">
        <span className="ds-eyebrow">
          <Lock size={14} aria-hidden="true" />
          Privacy information · pre-launch draft
        </span>
        <h1>Your information &amp; privacy rights</h1>
        <p className="ds-muted">
          This notice describes the Doorstep prototype as it operates today. It is not a final statutory compliance
          statement; controller, processor, lawful-basis, retention, vendor-transfer, and ODPC registration details remain
          under Kenyan legal review prior to public launch.
        </p>

        <div className="ds-prose-section">
          <h2>Information used by Doorstep</h2>
          <p>
            When Supabase is configured, Doorstep processes account email and the profile details you submit. Provider
            profiles include a business name, service area, description, starting prices, portfolio images, and weekly
            hours. Service requests include preferred timing, neighbourhood/area, job description, quotes, and
            participant messages.
          </p>
          <p>
            Doorstep does not collect online payments or identity-document images in this release. Do not include
            national ID numbers, passwords, or sensitive health information in profiles or message threads.
          </p>
        </div>

        <div className="ds-prose-section">
          <h2>Optional nearby location search</h2>
          <p>
            When you click &ldquo;Use my location&rdquo; on Explore Services, browser coordinates are rounded to two
            decimal places before querying nearby services and are never stored in Doorstep marketplace tables.
            Provider service-area centers are stored privately and search results show approximate distance only.
          </p>
        </div>

        <div className="ds-prose-section">
          <h2>Storage &amp; retention review</h2>
          <p>
            Account and marketplace records are stored in the configured Supabase project. Final hosting region,
            sub-processor disclosures, cross-border safeguards, and retention schedules must be approved before live
            commercial operations begin.
          </p>
        </div>

        <div className="ds-prose-section">
          <h2>Submit a privacy request</h2>
          <p>
            Subject to applicable Kenyan law, signed-in users may submit access, correction, objection, restriction,
            portability, or erasure requests below for compliance staff review.
          </p>

          {params.submitted === '1' && (
            <div className="ds-alert ds-alert-success" role="status">
              <span>Your privacy request was recorded for compliance review.</span>
            </div>
          )}
          {params.error && (
            <div className="ds-alert ds-alert-error" role="alert">
              <span>The request could not be recorded. Confirm the compliance migration is applied and try again.</span>
            </div>
          )}

          {user ? (
            <form action={submitPrivacyRequest} style={{ display: 'grid', gap: 14, marginTop: 8 }}>
              <label className="ds-field">
                Request type
                <select className="ds-select" name="request_kind" required>
                  {requestOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ds-field">
                Details (avoid ID numbers or passwords)
                <textarea
                  className="ds-textarea"
                  name="details"
                  maxLength={1200}
                  rows={4}
                  placeholder="Describe the information or processing you are asking about..."
                />
              </label>
              <div>
                <button className="ds-btn ds-btn-primary" type="submit">
                  Submit privacy request
                </button>
              </div>
            </form>
          ) : (
            <p className="ds-alert ds-alert-info">
              <span>
                <Link href="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                  Sign in
                </Link>{' '}
                to submit a privacy request.
              </span>
            </p>
          )}

          {requests.length > 0 && (
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <h3 style={{ fontSize: '1.05rem' }}>Your recent privacy requests</h3>
              <ul className="ds-record-list">
                {requests.map((request) => (
                  <li className="ds-record-item" key={request.id}>
                    <div>
                      <strong>{request.request_kind.replaceAll('_', ' ')}</strong>
                      <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                        {new Date(request.created_at).toLocaleDateString('en-KE')}
                      </p>
                    </div>
                    <Badge tone={request.status === 'fulfilled' ? 'success' : 'warning'}>
                      {request.status.replaceAll('_', ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="ds-actions-row" style={{ paddingTop: 8 }}>
          <Link className="ds-btn ds-btn-secondary ds-btn-sm" href="/terms">
            Read marketplace terms
          </Link>
          <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/report">
            Report a safety issue or complaint
          </Link>
        </div>
      </section>
    </main>
  );
}
