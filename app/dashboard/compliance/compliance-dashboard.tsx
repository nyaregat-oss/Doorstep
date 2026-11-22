'use client';

import { useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  reviewCategoryAction,
  reviewPrivacyRequestAction,
  reviewTrustReportAction,
  reviewVerificationAction,
} from './actions';
import { formatKenyanDateTime } from '@/lib/kenya';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export type ComplianceCategoryRow = {
  category_id: string;
  state: string;
  required_verification_kinds: string[];
  review_reference: string | null;
  categories: { name: string }[] | { name: string } | null;
};

export type WorkerVerificationRow = {
  id: string;
  provider_id: string;
  kind: string;
  issuing_authority: string;
  credential_name: string;
  credential_number: string | null;
  scope: string;
  expires_on: string | null;
  evidence_path: string | null;
  status: string;
  created_at: string;
};

export type VerificationReviewHistory = {
  verification_id: string;
  reviewer_id: string;
  decision: string;
  internal_note: string | null;
  created_at: string;
};

export type PrivacyRequestRow = {
  id: string;
  subject_id: string;
  request_kind: string;
  details: string;
  status: string;
  created_at: string;
};

export type TrustReportRow = {
  id: string;
  reporter_id: string;
  booking_id: string | null;
  report_kind: string;
  description: string;
  status: string;
  created_at: string;
};

export type AuditEventRow = {
  id: number;
  actor_id: string | null;
  event_kind: string;
  record_id: string;
  from_state: string | null;
  to_state: string | null;
  created_at: string;
};

export function ComplianceDashboardClient({
  adminEmail,
  hasError,
  hasSaved,
  categories,
  categoryError,
  verifications,
  reviews,
  reviewHistoryError,
  evidenceLinks,
  privacyRequests,
  trustReports,
  auditEvents,
}: {
  adminEmail: string;
  hasError: boolean;
  hasSaved: boolean;
  categories: ComplianceCategoryRow[];
  categoryError: boolean;
  verifications: WorkerVerificationRow[];
  reviews: VerificationReviewHistory[];
  reviewHistoryError: boolean;
  evidenceLinks: Record<string, string>;
  privacyRequests: PrivacyRequestRow[];
  trustReports: TrustReportRow[];
  auditEvents: AuditEventRow[];
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const approvedCategoriesCount = categories.filter((c) => c.state === 'approved').length;
  const pendingVerifications = verifications.filter((v) => v.status === 'pending').length;
  const openPrivacy = privacyRequests.filter((p) => ['received', 'in_review', 'needs_information'].includes(p.status)).length;
  const openReports = trustReports.filter((r) => ['received', 'in_review'].includes(r.status)).length;

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview & Audit', icon: 'overview' },
    { id: 'categories', label: 'Category Gates', icon: 'shield', badge: approvedCategoriesCount },
    { id: 'verifications', label: 'Credential Queue', icon: 'verifications', badge: pendingVerifications },
    { id: 'privacy', label: 'Privacy Requests', icon: 'privacy', badge: openPrivacy },
    { id: 'reports', label: 'Safety Reports', icon: 'reports', badge: openReports },
  ];

  const filteredCategories = categories.filter(
    (c) => categoryFilter === 'all' || c.state === categoryFilter,
  );

  return (
    <DashboardShell
      roleLabel="Restricted Staff Console"
      userTitle="Compliance & Moderation"
      userSubtitle={adminEmail}
      items={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      headerActions={
        <header className="ds-dash-header">
          <div>
            <span className="ds-eyebrow">
              <ShieldCheck size={14} aria-hidden="true" />
              Authorised Compliance Staff Only
            </span>
            <h1>Compliance &amp; trust review</h1>
            <p className="ds-muted" style={{ marginTop: 6 }}>
              Category launch controls, credential verification reviews, privacy subject requests, and safety incident
              triage.
            </p>
          </div>
        </header>
      }
    >
      {hasError && (
        <div className="ds-alert ds-alert-error" role="alert">
          <span>
            A change could not be saved. Confirm the compliance migration is applied, required fields are filled, and
            your compliance admin role is active.
          </span>
        </div>
      )}
      {hasSaved && (
        <div className="ds-alert ds-alert-success" role="status">
          <span>Compliance status saved and logged in the audit trail.</span>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          <section className="ds-kpi-grid" aria-label="Compliance summary">
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Approved Categories</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">
                {approvedCategoriesCount}/{categories.length}
              </strong>
              <span className="ds-kpi-sub">Pilot launch enabled</span>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Pending Credentials</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{pendingVerifications}</strong>
              <span className="ds-kpi-sub">{verifications.length} total submissions</span>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Open Privacy Requests</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{openPrivacy}</strong>
              <span className="ds-kpi-sub">{privacyRequests.length} total requests</span>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Open Safety Reports</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{openReports}</strong>
              <span className="ds-kpi-sub">{trustReports.length} total reports</span>
            </div>
          </section>

          <section className="ds-card ds-panel">
            <div>
              <h2>Recent compliance audit trail</h2>
              <p className="ds-muted" style={{ fontSize: '0.88rem', marginTop: 4 }}>
                Immutable state transitions and private evidence views recorded by Postgres triggers and RPCs.
              </p>
            </div>
            {auditEvents.length > 0 ? (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Transition</th>
                      <th>Record ID</th>
                      <th>Timestamp (EAT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEvents.map((ev) => (
                      <tr key={ev.id}>
                        <td>{ev.event_kind.replaceAll('_', ' ')}</td>
                        <td>
                          {ev.from_state ? `${ev.from_state} → ` : ''}
                          <strong>{ev.to_state || 'logged'}</strong>
                        </td>
                        <td className="tabular-nums">{ev.record_id.slice(0, 8)}…</td>
                        <td>{formatKenyanDateTime(ev.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ds-muted">No compliance audit events logged yet.</p>
            )}
          </section>
        </>
      )}

      {activeTab === 'categories' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div className="ds-panel-head">
            <div>
              <h2>Service category launch gates</h2>
              <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
                All categories start pending. Record a counsel or regulator reference before approving or blocking.
              </p>
            </div>
            <div className="ds-tabs" role="tablist" aria-label="Filter categories by state">
              {[
                ['all', 'All'],
                ['pending', 'Pending'],
                ['approved', 'Approved'],
                ['blocked', 'Blocked'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === key}
                  className="ds-tab-btn"
                  onClick={() => setCategoryFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {categoryError && (
            <div className="ds-alert ds-alert-error">
              <span>Compliance tables are unavailable. Apply the compliance migration.</span>
            </div>
          )}

          <div className="ds-request-list">
            {filteredCategories.map((row) => {
              const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
              return (
                <article className="ds-card ds-request-card" key={row.category_id}>
                  <div className="ds-request-top">
                    <div>
                      <h3>{cat?.name || row.category_id}</h3>
                      <p className="ds-muted" style={{ fontSize: '0.86rem', marginTop: 4 }}>
                        Required checks: {(row.required_verification_kinds || []).join(', ') || 'none configured'}
                      </p>
                    </div>
                    <Badge
                      tone={
                        row.state === 'approved' ? 'success' : row.state === 'blocked' ? 'danger' : 'warning'
                      }
                    >
                      {row.state}
                    </Badge>
                  </div>

                  <form action={reviewCategoryAction} className="ds-form-grid">
                    <input type="hidden" name="category_id" value={row.category_id} />
                    <label className="ds-field">
                      Decision
                      <select className="ds-select" name="state" defaultValue={row.state}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved for pilot</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </label>
                    <label className="ds-field">
                      Required checks (comma-separated)
                      <input
                        className="ds-input"
                        name="required_verification_kinds"
                        defaultValue={(row.required_verification_kinds || []).join(',')}
                        placeholder="qualification, professional_licence, reference"
                      />
                    </label>
                    <label className="ds-field ds-span-2">
                      Counsel / regulator review reference (required to approve or block)
                      <input
                        className="ds-input"
                        name="review_reference"
                        maxLength={500}
                        defaultValue={row.review_reference || ''}
                      />
                    </label>
                    <div>
                      <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                        Save review
                      </button>
                    </div>
                  </form>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'verifications' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2>Worker credential reviews</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
              Evidence files use audited 60-second signed links. Internal notes stay staff-only.
            </p>
          </div>
          {reviewHistoryError && (
            <div className="ds-alert ds-alert-error">
              <span>Staff review history is unavailable. Apply the compliance security hardening migration.</span>
            </div>
          )}

          {verifications.length > 0 ? (
            <div className="ds-request-list">
              {verifications.map((item) => (
                <article className="ds-card ds-request-card" key={item.id}>
                  <div className="ds-request-top">
                    <div>
                      <Badge tone="navy">{item.kind.replaceAll('_', ' ')}</Badge>
                      <h3 style={{ marginTop: 8 }}>{item.credential_name || 'Credential'}</h3>
                      <p className="ds-muted" style={{ fontSize: '0.86rem' }}>
                        Provider {item.provider_id} · Authority: {item.issuing_authority || 'Not supplied'}
                      </p>
                    </div>
                    <Badge
                      tone={
                        item.status === 'approved'
                          ? 'success'
                          : item.status === 'rejected' || item.status === 'suspended'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <p className="ds-muted" style={{ fontSize: '0.88rem' }}>
                    Scope: {item.scope || 'Not specified'} · Expiry: {item.expires_on || 'Not supplied'} · Ref ending:{' '}
                    {item.credential_number ? item.credential_number.slice(-4) : 'none'}
                  </p>

                  {evidenceLinks[item.id] && (
                    <div>
                      <a
                        className="ds-btn ds-btn-secondary ds-btn-sm"
                        href={evidenceLinks[item.id]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open private evidence (60s signed URL)
                      </a>
                    </div>
                  )}

                  {reviews
                    .filter((review) => review.verification_id === item.id)
                    .map((review) => (
                      <p className="ds-muted" key={review.created_at} style={{ fontSize: '0.84rem' }}>
                        Prior staff review ({review.decision}): {review.internal_note || 'No internal note'}
                      </p>
                    ))}

                  <form action={reviewVerificationAction} className="ds-form-grid">
                    <input type="hidden" name="verification_id" value={item.id} />
                    <label className="ds-field">
                      Decision
                      <select
                        className="ds-select"
                        name="status"
                        defaultValue={item.status === 'pending' ? 'approved' : item.status}
                      >
                        <option value="approved">Approve evidence</option>
                        <option value="rejected">Reject evidence</option>
                        <option value="suspended">Suspend check</option>
                      </select>
                    </label>
                    <label className="ds-field">
                      Internal staff note
                      <input className="ds-input" name="reviewer_note" maxLength={1000} />
                    </label>
                    <label className="ds-field ds-span-2">
                      Message to provider
                      <input className="ds-input" name="provider_message" maxLength={1000} />
                    </label>
                    <div>
                      <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                        Record decision
                      </button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No credential submissions waiting"
              description="Submitted provider qualifications, licences, and references appear here for staff review."
            />
          )}
        </section>
      )}

      {activeTab === 'privacy' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2>Privacy subject requests</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
              Verify identity proportionately and fulfill or decline requests under Kenya Data Protection Act procedures.
            </p>
          </div>
          {privacyRequests.length > 0 ? (
            <div className="ds-request-list">
              {privacyRequests.map((item) => (
                <article className="ds-card ds-request-card" key={item.id}>
                  <div className="ds-request-top">
                    <div>
                      <strong>{item.request_kind.replaceAll('_', ' ')}</strong>
                      <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                        Account {item.subject_id} · {formatKenyanDateTime(item.created_at)}
                      </p>
                    </div>
                    <Badge tone={item.status === 'fulfilled' ? 'success' : 'warning'}>{item.status}</Badge>
                  </div>
                  <p>{item.details || 'No additional details provided.'}</p>
                  <form action={reviewPrivacyRequestAction} className="ds-form-grid">
                    <input type="hidden" name="request_id" value={item.id} />
                    <label className="ds-field">
                      Status
                      <select className="ds-select" name="status" defaultValue={item.status}>
                        <option value="in_review">In review</option>
                        <option value="needs_information">Needs information</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="declined">Declined</option>
                      </select>
                    </label>
                    <label className="ds-field">
                      Response note
                      <input className="ds-input" name="response_note" maxLength={1200} />
                    </label>
                    <div>
                      <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                        Update request
                      </button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No privacy requests" description="User data-subject requests will appear here." />
          )}
        </section>
      )}

      {activeTab === 'reports' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2>Safety &amp; service reports</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
              Investigate reported safety, harassment, or service concerns promptly.
            </p>
          </div>
          {trustReports.length > 0 ? (
            <div className="ds-request-list">
              {trustReports.map((item) => (
                <article className="ds-card ds-request-card" key={item.id}>
                  <div className="ds-request-top">
                    <div>
                      <strong>{item.report_kind.replaceAll('_', ' ')}</strong>
                      <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                        Reporter {item.reporter_id}
                        {item.booking_id ? ` · Request ${item.booking_id}` : ''} · {formatKenyanDateTime(item.created_at)}
                      </p>
                    </div>
                    <Badge tone={item.status === 'resolved' || item.status === 'closed' ? 'success' : 'danger'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p>{item.description}</p>
                  <form action={reviewTrustReportAction} className="ds-form-grid">
                    <input type="hidden" name="report_id" value={item.id} />
                    <label className="ds-field">
                      Status
                      <select className="ds-select" name="status" defaultValue={item.status}>
                        <option value="in_review">In review</option>
                        <option value="resolved">Resolved</option>
                        <option value="referred">Referred</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                    <label className="ds-field">
                      Response note
                      <input className="ds-input" name="response_note" maxLength={1200} />
                    </label>
                    <div>
                      <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                        Update report
                      </button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ShieldAlert size={22} />}
              title="No open safety reports"
              description="Submitted trust and safety reports will appear here."
            />
          )}
        </section>
      )}
    </DashboardShell>
  );
}
