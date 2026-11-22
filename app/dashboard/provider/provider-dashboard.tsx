'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { ActionForm } from '@/app/action-form';
import {
  markAllNotificationsReadAction,
  markMessagesReadAction,
  markNotificationReadAction,
  respondToBookingAction,
  sendMessageAction,
  sendQuotationAction,
} from '@/app/booking-actions';
import { deleteServiceAction, saveProviderProfileAction, saveServiceAction, setServiceActiveAction } from './actions';
import { AvailabilityManager } from './availability-manager';
import { PortfolioManager } from './portfolio-manager';
import { roundToApproximate } from '@/lib/location';
import { KENYAN_LOCATIONS, formatCurrency, formatKenyanDateTime } from '@/lib/kenya';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { AnalyticsChart } from '@/components/dashboard/analytics-chart';
import { Badge, VerifiedBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { RatingStars } from '@/components/ui/rating-stars';
import { useToast } from '@/components/ui/toast';

type Category = { id: string; name: string };
type Service = { id: string; name: string; description: string; starting_price: number; currency: string; active: boolean };
type ProviderProfile = {
  profile_id: string;
  business_name: string;
  category_id: string | null;
  location: string;
  bio: string;
  years_experience: number;
  verified: boolean;
  paused: boolean;
  headline: string;
  skills: string[];
};

export type ProviderMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type ProviderQuotation = {
  id: string;
  amount: number | string;
  currency: string;
  message: string;
  status: string;
};

export type ProviderBooking = {
  id: string;
  customer_id: string;
  customer_display_name: string;
  request_kind: 'booking' | 'quotation';
  description: string;
  location: string;
  preferred_at: string;
  proposed_at: string | null;
  status: string;
  created_at: string;
  services: { name: string }[] | { name: string } | null;
  messages: ProviderMessage[];
  quotations: ProviderQuotation[];
};

export type ProviderNotification = {
  id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type ProviderReview = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
};

function statusTone(status: string): 'warning' | 'success' | 'danger' | 'navy' | 'neutral' {
  if (status === 'completed' || status === 'accepted') return 'success';
  if (status === 'declined' || status === 'cancelled') return 'danger';
  if (status === 'in_progress') return 'navy';
  if (status === 'proposed' || status === 'pending') return 'warning';
  return 'neutral';
}

function BookingStepper({ status }: { status: string }) {
  const stages = [
    { label: 'Requested', done: true },
    { label: 'Confirmed', done: ['accepted', 'in_progress', 'completed'].includes(status) },
    { label: 'In Progress', done: ['in_progress', 'completed'].includes(status) },
    { label: 'Completed', done: status === 'completed' },
  ];
  return (
    <div className="ds-stepper" aria-label={`Request status: ${status.replaceAll('_', ' ')}`}>
      {stages.map((stage) => (
        <div className={`ds-step-dot ${stage.done ? 'is-done' : ''}`} key={stage.label}>
          <div className="ds-step-bar" />
          <span>{stage.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProviderDashboard({
  accountName,
  profile,
  serviceCenter,
  categories,
  services,
  categoryError,
  categoryReviewState,
  requiredVerificationKinds,
  databaseError,
  portfolio,
  portfolioError,
  availability,
  availabilityError,
  bookings = [],
  bookingsError = false,
  notifications = [],
  reviews = [],
}: {
  accountName: string;
  profile: ProviderProfile;
  serviceCenter: { latitude: number; longitude: number } | null;
  categories: Category[];
  services: Service[];
  categoryError: boolean;
  categoryReviewState: string;
  requiredVerificationKinds: string[];
  databaseError: boolean;
  portfolio: Array<{ id: string; storage_path: string; caption: string }>;
  portfolioError: boolean;
  availability: Array<{ weekday: number; is_open: boolean; start_time: string | null; end_time: string | null }>;
  availabilityError: boolean;
  bookings?: ProviderBooking[];
  bookingsError?: boolean;
  notifications?: ProviderNotification[];
  reviews?: ProviderReview[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [busy, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('overview');
  const [requestFilter, setRequestFilter] = useState('all');
  const [editingService, setEditingService] = useState<string | null>(null);
  const [pendingDeleteService, setPendingDeleteService] = useState<Service | null>(null);
  const [locationSetupFeedback, setLocationSetupFeedback] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string>(bookings[0]?.id || '');

  const activeCount = services.filter((service) => service.active).length;
  const pendingCount = bookings.filter((b) => b.status === 'pending' || b.status === 'proposed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const unreadNotifCount = notifications.filter((n) => !n.read_at).length;
  const unreadMessageCount = bookings.reduce(
    (sum, b) => sum + (b.messages || []).filter((m) => m.recipient_id === profile.profile_id && !m.read_at).length,
    0,
  );
  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length : null;

  // Profile completion calculation strictly from real fields.
  const completionChecks = [
    Boolean(profile.business_name.trim()),
    Boolean(profile.category_id),
    Boolean(profile.location.trim()),
    Boolean(profile.bio.trim()),
    services.length > 0,
    availability.some((day) => day.is_open),
    portfolio.length > 0,
  ];
  const completionPercent = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
  );

  // Real analytics derived strictly from backend booking/quotation data.
  const monthlyChartData = useMemo(() => {
    const counts = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-KE', { month: 'short' });
      counts.set(label, 0);
    }
    for (const booking of bookings) {
      const d = new Date(booking.created_at);
      const label = d.toLocaleDateString('en-KE', { month: 'short' });
      if (counts.has(label)) {
        counts.set(label, (counts.get(label) || 0) + 1);
      }
    }
    return [...counts.entries()].map(([label, value]) => ({ label, value }));
  }, [bookings]);

  const statusBreakdownData = useMemo(
    () => [
      { label: 'Pending', value: bookings.filter((b) => b.status === 'pending' || b.status === 'proposed').length },
      { label: 'Accepted', value: bookings.filter((b) => b.status === 'accepted').length },
      { label: 'Active', value: bookings.filter((b) => b.status === 'in_progress').length },
      { label: 'Done', value: bookings.filter((b) => b.status === 'completed').length },
      { label: 'Declined', value: bookings.filter((b) => b.status === 'declined' || b.status === 'cancelled').length },
    ],
    [bookings],
  );

  const quotedBookings = bookings.filter((b) => Array.isArray(b.quotations) && b.quotations.length > 0);
  const acceptedQuotes = quotedBookings.filter((b) => b.quotations[0]?.status === 'accepted').length;
  const quoteConversion =
    quotedBookings.length > 0 ? `${Math.round((acceptedQuotes / quotedBookings.length) * 100)}%` : '—';

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'overview', badge: unreadNotifCount },
    { id: 'requests', label: 'Customer Requests', icon: 'requests', badge: pendingCount },
    { id: 'messages', label: 'Messages', icon: 'messages', badge: unreadMessageCount },
    { id: 'services', label: 'My Services', icon: 'services' },
    { id: 'portfolio', label: 'Portfolio', icon: 'portfolio' },
    { id: 'availability', label: 'Availability', icon: 'availability' },
    { id: 'reviews', label: 'Reviews', icon: 'reviews' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    { id: 'settings', label: 'Profile Settings', icon: 'settings' },
  ];

  function runAction(
    form: HTMLFormElement,
    action: (data: FormData) => Promise<{ error?: string; message?: string }>,
    reset = false,
  ) {
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      const msg = result.error || result.message || '';
      if (msg) notify(msg, result.error ? 'error' : 'success');
      if (!result.error) {
        if (reset) form.reset();
        setEditingService(null);
        router.refresh();
      }
    });
  }

  function submit(action: (data: FormData) => Promise<{ error?: string; message?: string }>, reset = false) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      runAction(event.currentTarget, action, reset);
    };
  }

  function confirmDeleteService() {
    if (!pendingDeleteService) return;
    const target = pendingDeleteService;
    setPendingDeleteService(null);
    const data = new FormData();
    data.set('id', target.id);
    startTransition(async () => {
      const result = await deleteServiceAction(data);
      notify(result.error || result.message || '', result.error ? 'error' : 'success');
      if (!result.error) router.refresh();
    });
  }

  const filteredBookings = bookings.filter((b) => {
    if (requestFilter === 'all') return true;
    if (requestFilter === 'pending') return b.status === 'pending' || b.status === 'proposed';
    if (requestFilter === 'active') return b.status === 'accepted' || b.status === 'in_progress';
    return b.status === requestFilter;
  });

  const activeThread = bookings.find((b) => b.id === selectedThreadId) || bookings[0] || null;

  function renderRequestCard(booking: ProviderBooking) {
    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    const quote = Array.isArray(booking.quotations) ? booking.quotations[0] : null;
    const messages = booking.messages || [];
    const unread = messages.filter((m) => m.recipient_id === profile.profile_id && !m.read_at).length;

    return (
      <article className="ds-card ds-request-card" key={booking.id}>
        <div className="ds-request-top">
          <div>
            <div className="ds-actions-row">
              <Badge tone="navy">{booking.request_kind === 'quotation' ? 'Quote request' : 'Booking request'}</Badge>
              <Badge tone={statusTone(booking.status)}>{booking.status.replaceAll('_', ' ')}</Badge>
              {unread > 0 && <Badge tone="amber">{unread} unread</Badge>}
            </div>
            <h3 style={{ marginTop: 8 }}>
              {service?.name || 'Service request'} · {booking.customer_display_name || 'Customer'}
            </h3>
          </div>
          <span className="ds-muted" style={{ fontSize: '0.84rem' }}>
            Received {formatKenyanDateTime(booking.created_at)}
          </span>
        </div>

        <BookingStepper status={booking.status} />

        <p>{booking.description}</p>
        <p className="ds-muted" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <MapPin size={14} aria-hidden="true" />
          <span>
            {booking.location} · Preferred: {formatKenyanDateTime(booking.preferred_at)}
            {booking.proposed_at ? ` · You proposed: ${formatKenyanDateTime(booking.proposed_at)}` : ''}
          </span>
        </p>

        {booking.status === 'pending' && booking.request_kind === 'booking' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="ds-actions-row">
              <ActionForm action={respondToBookingAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <input type="hidden" name="status" value="accepted" />
                <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                  Accept request
                </button>
              </ActionForm>
              <ActionForm action={respondToBookingAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <input type="hidden" name="status" value="declined" />
                <button className="ds-btn ds-btn-danger ds-btn-sm" type="submit">
                  Decline
                </button>
              </ActionForm>
            </div>

            <ActionForm action={respondToBookingAction} className="ds-actions-row">
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="status" value="proposed" />
              <label className="ds-field" style={{ fontSize: '0.82rem', minWidth: 220 }}>
                Suggest another time (EAT)
                <input className="ds-input" name="proposed_at" type="datetime-local" required />
              </label>
              <button className="ds-btn ds-btn-secondary ds-btn-sm" type="submit" style={{ alignSelf: 'end' }}>
                Propose time
              </button>
            </ActionForm>
          </div>
        )}

        {booking.status === 'accepted' && (
          <ActionForm action={respondToBookingAction}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <input type="hidden" name="status" value="in_progress" />
            <button className="ds-btn ds-btn-amber ds-btn-sm" type="submit">
              Mark work started
            </button>
          </ActionForm>
        )}

        {booking.status === 'in_progress' && (
          <ActionForm action={respondToBookingAction}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <input type="hidden" name="status" value="completed" />
            <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
              Mark job complete
            </button>
          </ActionForm>
        )}

        {booking.status === 'pending' && booking.request_kind === 'quotation' && !quote && (
          <ActionForm action={sendQuotationAction} className="ds-quote-box">
            <strong>Send written quote (KES)</strong>
            <input type="hidden" name="booking_id" value={booking.id} />
            <div className="ds-form-grid">
              <label className="ds-field">
                Amount
                <input className="ds-input" name="amount" type="number" min="0" step="0.01" required />
              </label>
              <label className="ds-field">
                Currency
                <input className="ds-input" name="currency" defaultValue="KES" minLength={3} maxLength={3} required />
              </label>
              <label className="ds-field ds-span-2">
                Quote breakdown / note
                <textarea
                  className="ds-textarea"
                  name="message"
                  minLength={5}
                  maxLength={2000}
                  rows={2}
                  placeholder="Include labour, call-out, and whether materials are included..."
                  required
                />
              </label>
            </div>
            <div>
              <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                Send quote
              </button>
            </div>
          </ActionForm>
        )}

        {quote && (
          <div className="ds-quote-box">
            <strong>
              Quote sent: {formatCurrency(quote.amount, quote.currency)} · {quote.status}
            </strong>
            <p className="ds-muted" style={{ fontSize: '0.88rem' }}>
              {quote.message}
            </p>
          </div>
        )}

        <details style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem' }}>
            Messages ({messages.length})
          </summary>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ds-chat-bubble ${message.sender_id === profile.profile_id ? 'is-mine' : ''}`}
              >
                <span>{message.body}</span>
                <small>{formatKenyanDateTime(message.created_at)}</small>
              </div>
            ))}
            <ActionForm action={sendMessageAction} className="ds-actions-row">
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="recipient_id" value={booking.customer_id} />
              <textarea
                className="ds-textarea"
                name="body"
                maxLength={2000}
                rows={2}
                placeholder="Write a message. Avoid ID numbers or passwords."
                required
                style={{ minHeight: 68 }}
              />
              <button className="ds-btn ds-btn-secondary ds-btn-sm" type="submit">
                <Send size={14} aria-hidden="true" />
                Send
              </button>
            </ActionForm>
          </div>
        </details>
      </article>
    );
  }

  return (
    <DashboardShell
      roleLabel="Provider workspace"
      userTitle={profile.business_name || accountName}
      userSubtitle={profile.location || 'Kenya'}
      items={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      headerActions={
        <header className="ds-dash-header">
          <div>
            <div className="ds-actions-row" style={{ marginBottom: 6 }}>
              <span className="ds-eyebrow" style={{ marginBottom: 0 }}>
                Provider Business Hub
              </span>
              {profile.verified && <VerifiedBadge />}
              <Badge tone={profile.paused ? 'warning' : 'success'}>
                {profile.paused ? 'Profile paused' : 'Profile active'}
              </Badge>
            </div>
            <h1>Grow your business</h1>
          </div>
          <div className="ds-actions-row">
            <Link className="ds-btn ds-btn-secondary ds-btn-sm" href={`/providers/${profile.profile_id}`}>
              <ExternalLink size={14} aria-hidden="true" />
              Public profile
            </Link>
            <Link className="ds-btn ds-btn-amber ds-btn-sm" href="/dashboard/provider/compliance">
              <ShieldCheck size={14} aria-hidden="true" />
              Credentials
            </Link>
          </div>
        </header>
      }
      sidebarFooter={
        <Link className="ds-btn ds-btn-ghost ds-btn-sm ds-btn-full" href="/dashboard/provider/compliance">
          <ShieldCheck size={15} aria-hidden="true" />
          Compliance &amp; Credentials
        </Link>
      }
    >
      {categoryReviewState !== 'approved' ? (
        <div className="ds-alert ds-alert-warning">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            Live profiles and services in your selected category are hidden from public search until compliance review is
            recorded (current status: <strong>{categoryReviewState}</strong>).
          </span>
        </div>
      ) : (
        requiredVerificationKinds.length > 0 && (
          <div className="ds-alert ds-alert-info">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>
              This category requires approved checks: <strong>{requiredVerificationKinds.join(', ')}</strong>. Submit
              records in <Link href="/dashboard/provider/compliance">Credentials</Link>.
            </span>
          </div>
        )
      )}

      {activeTab === 'overview' && (
        <>
          <section className="ds-kpi-grid" aria-label="Business overview">
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Total Services</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{databaseError ? '—' : services.length}</strong>
              <span className="ds-kpi-sub">{activeCount} currently published</span>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Incoming Requests</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{bookingsError ? '—' : bookings.length}</strong>
              <span className="ds-kpi-sub">{pendingCount} awaiting response</span>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Completed Jobs</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{bookingsError ? '—' : completedCount}</strong>
              <span className="ds-kpi-sub">Tracked through completion</span>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Customer Rating</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">
                {avgRating !== null ? avgRating.toFixed(1) : '—'}
              </strong>
              <span className="ds-kpi-sub">
                {reviews.length > 0 ? `${reviews.length} verified reviews` : 'No reviews yet'}
              </span>
            </div>
          </section>

          {/* Profile Completion */}
          <section className="ds-card ds-panel">
            <div className="ds-panel-head">
              <div>
                <h3>Profile readiness</h3>
                <p className="ds-muted" style={{ fontSize: '0.88rem' }}>
                  Complete your profile details, services, weekly schedule, and portfolio so customers trust your work.
                </p>
              </div>
              <strong className="tabular-nums">{completionPercent}%</strong>
            </div>
            <div className="ds-progress-track">
              <div className="ds-progress-fill" style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="ds-actions-row">
              <button
                type="button"
                className="ds-btn ds-btn-secondary ds-btn-sm"
                onClick={() => setActiveTab('services')}
              >
                Manage services
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-secondary ds-btn-sm"
                onClick={() => setActiveTab('portfolio')}
              >
                Upload portfolio
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-secondary ds-btn-sm"
                onClick={() => setActiveTab('availability')}
              >
                Set weekly hours
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section className="ds-card ds-panel">
            <div className="ds-panel-head">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={20} aria-hidden="true" />
                Notifications
              </h2>
              {unreadNotifCount > 0 && (
                <ActionForm action={markAllNotificationsReadAction}>
                  <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit">
                    Mark all read
                  </button>
                </ActionForm>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="ds-request-list">
                {notifications.map((item) => (
                  <article className="ds-record-item" key={item.id}>
                    <div>
                      <p style={{ fontWeight: item.read_at ? 400 : 600 }}>{item.body}</p>
                      <small className="ds-muted">{formatKenyanDateTime(item.created_at)}</small>
                    </div>
                    {!item.read_at && (
                      <ActionForm action={markNotificationReadAction}>
                        <input type="hidden" name="notification_id" value={item.id} />
                        <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit">
                          Mark read
                        </button>
                      </ActionForm>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="ds-muted">No notifications yet.</p>
            )}
          </section>
        </>
      )}

      {activeTab === 'requests' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div className="ds-panel-head">
            <div>
              <h2>Customer requests</h2>
              <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
                Accept or propose times for bookings, send formal KES quotes, and update job progress.
              </p>
            </div>
            <div className="ds-tabs" role="tablist" aria-label="Filter requests">
              {[
                ['all', 'All'],
                ['pending', 'Pending'],
                ['active', 'Active'],
                ['completed', 'Completed'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={requestFilter === key}
                  className="ds-tab-btn"
                  onClick={() => setRequestFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {bookingsError ? (
            <div className="ds-alert ds-alert-error">
              <span>Requests could not be loaded. Apply the bookings migration.</span>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="ds-request-list">{filteredBookings.map(renderRequestCard)}</div>
          ) : (
            <EmptyState
              title="No requests in this view"
              description="Customer booking and quotation requests appear here as soon as customers reach out."
            />
          )}
        </section>
      )}

      {activeTab === 'messages' && (
        <section className="ds-card ds-panel">
          <div>
            <h2>Customer conversations</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              All conversations stay linked to their service request so scope and pricing details remain clear.
            </p>
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={22} />}
              title="No conversations yet"
              description="Once a customer sends a booking or quote request, your message threads appear here."
            />
          ) : (
            <div className="ds-inbox-grid">
              <div className="ds-inbox-threads">
                {bookings.map((b) => {
                  const service = Array.isArray(b.services) ? b.services[0] : b.services;
                  const unread = (b.messages || []).filter(
                    (m) => m.recipient_id === profile.profile_id && !m.read_at,
                  ).length;
                  const isCurrent = activeThread?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`ds-thread-btn ${isCurrent ? 'is-active' : ''}`}
                      onClick={() => setSelectedThreadId(b.id)}
                    >
                      <div className="ds-actions-row" style={{ justifyContent: 'space-between' }}>
                        <strong>{b.customer_display_name || 'Customer'}</strong>
                        {unread > 0 && <Badge tone="amber">{unread}</Badge>}
                      </div>
                      <span className="ds-muted" style={{ fontSize: '0.82rem' }}>
                        {service?.name || 'Service request'} · {b.status.replaceAll('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeThread && (
                <div className="ds-card ds-chat-pane">
                  <div className="ds-panel-head" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                    <div>
                      <strong>{activeThread.customer_display_name || 'Customer'}</strong>
                      <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                        {activeThread.location} · {formatKenyanDateTime(activeThread.preferred_at)}
                      </p>
                    </div>
                    {(activeThread.messages || []).some(
                      (m) => m.recipient_id === profile.profile_id && !m.read_at,
                    ) && (
                      <ActionForm action={markMessagesReadAction}>
                        <input type="hidden" name="booking_id" value={activeThread.id} />
                        <button type="submit" className="ds-btn ds-btn-ghost ds-btn-sm">
                          Mark read
                        </button>
                      </ActionForm>
                    )}
                  </div>

                  <div className="ds-chat-messages">
                    {(activeThread.messages || []).length === 0 ? (
                      <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
                        No messages yet in this thread. Send a message below to confirm details.
                      </p>
                    ) : (
                      activeThread.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`ds-chat-bubble ${msg.sender_id === profile.profile_id ? 'is-mine' : ''}`}
                        >
                          <span>{msg.body}</span>
                          <small>{formatKenyanDateTime(msg.created_at)}</small>
                        </div>
                      ))
                    )}
                  </div>

                  <ActionForm action={sendMessageAction} className="ds-actions-row">
                    <input type="hidden" name="booking_id" value={activeThread.id} />
                    <input type="hidden" name="recipient_id" value={activeThread.customer_id} />
                    <textarea
                      className="ds-textarea"
                      name="body"
                      maxLength={2000}
                      rows={2}
                      placeholder="Reply to customer..."
                      required
                      style={{ minHeight: 68 }}
                    />
                    <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">
                      <Send size={14} aria-hidden="true" />
                      Send
                    </button>
                  </ActionForm>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'services' && (
        <section style={{ display: 'grid', gap: 18 }}>
          <div className="ds-card ds-panel">
            <div className="ds-panel-head">
              <div>
                <h2>Add a new service</h2>
                <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
                  Set transparent starting prices in Kenyan shillings (KES) so customers know what to expect.
                </p>
              </div>
            </div>

            <form className="ds-form-grid" onSubmit={submit(saveServiceAction, true)}>
              <label className="ds-field">
                Service name
                <input
                  className="ds-input"
                  name="name"
                  minLength={3}
                  maxLength={100}
                  placeholder="e.g. Emergency pipe leak repair"
                  required
                />
              </label>
              <div className="ds-form-grid">
                <label className="ds-field">
                  Starting price
                  <input
                    className="ds-input"
                    name="starting_price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    required
                  />
                </label>
                <label className="ds-field">
                  Currency
                  <input
                    className="ds-input"
                    name="currency"
                    minLength={3}
                    maxLength={3}
                    defaultValue="KES"
                    required
                  />
                </label>
              </div>
              <label className="ds-field ds-span-2">
                Service description
                <textarea
                  className="ds-textarea"
                  name="description"
                  maxLength={2000}
                  rows={3}
                  placeholder="Describe what is included in the starting price and what affects final pricing..."
                />
              </label>
              <div>
                <button className="ds-btn ds-btn-amber" type="submit" disabled={busy}>
                  <Plus size={16} aria-hidden="true" />
                  {busy ? 'Saving…' : 'Add service'}
                </button>
              </div>
            </form>
          </div>

          <div className="ds-card ds-panel">
            <h2>Your service listings</h2>
            {databaseError && (
              <div className="ds-alert ds-alert-error" role="alert">
                <span>Services could not load. Apply `202611170002_provider_services.sql` in Supabase.</span>
              </div>
            )}

            {!databaseError && services.length === 0 ? (
              <EmptyState
                title="No services listed yet"
                description="Add your first service above so customers can discover your pricing and send requests."
              />
            ) : (
              <div className="ds-request-list">
                {services.map((service) => (
                  <article className="ds-card ds-request-card" key={service.id}>
                    {editingService === service.id ? (
                      <form className="ds-form-grid" onSubmit={submit(saveServiceAction)}>
                        <input type="hidden" name="id" value={service.id} />
                        <label className="ds-field">
                          Service name
                          <input
                            className="ds-input"
                            name="name"
                            minLength={3}
                            maxLength={100}
                            defaultValue={service.name}
                            required
                          />
                        </label>
                        <div className="ds-form-grid">
                          <label className="ds-field">
                            Starting price
                            <input
                              className="ds-input"
                              name="starting_price"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={service.starting_price}
                              required
                            />
                          </label>
                          <label className="ds-field">
                            Currency
                            <input
                              className="ds-input"
                              name="currency"
                              minLength={3}
                              maxLength={3}
                              defaultValue={service.currency.trim()}
                              required
                            />
                          </label>
                        </div>
                        <label className="ds-field ds-span-2">
                          Description
                          <textarea
                            className="ds-textarea"
                            name="description"
                            maxLength={2000}
                            rows={3}
                            defaultValue={service.description}
                          />
                        </label>
                        <div className="ds-actions-row">
                          <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit" disabled={busy}>
                            Save changes
                          </button>
                          <button
                            className="ds-btn ds-btn-ghost ds-btn-sm"
                            type="button"
                            onClick={() => setEditingService(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="ds-request-top">
                          <div>
                            <h3>{service.name}</h3>
                            <p className="ds-muted tabular-nums" style={{ marginTop: 4 }}>
                              From {formatCurrency(service.starting_price, service.currency)}
                            </p>
                          </div>
                          <Badge tone={service.active ? 'success' : 'neutral'}>
                            {service.active ? 'Published' : 'Paused'}
                          </Badge>
                        </div>
                        {service.description && <p className="ds-muted">{service.description}</p>}
                        <div className="ds-actions-row">
                          <button
                            className="ds-btn ds-btn-secondary ds-btn-sm"
                            type="button"
                            onClick={() => setEditingService(service.id)}
                          >
                            Edit
                          </button>
                          <form onSubmit={submit(setServiceActiveAction)}>
                            <input type="hidden" name="id" value={service.id} />
                            <input type="hidden" name="active" value={String(!service.active)} />
                            <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit" disabled={busy}>
                              {service.active ? 'Pause' : 'Publish'}
                            </button>
                          </form>
                          <button
                            className="ds-btn ds-btn-danger ds-btn-sm"
                            type="button"
                            disabled={busy}
                            onClick={() => setPendingDeleteService(service)}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'portfolio' && <PortfolioManager items={portfolio} loadError={portfolioError} />}

      {activeTab === 'availability' && <AvailabilityManager items={availability} loadError={availabilityError} />}

      {activeTab === 'reviews' && (
        <section className="ds-card ds-panel">
          <div className="ds-panel-head">
            <div>
              <h2>Customer reviews</h2>
              <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
                Verified ratings submitted by customers after completed jobs.
              </p>
            </div>
            {avgRating !== null && <RatingStars rating={avgRating} count={reviews.length} />}
          </div>

          {reviews.length > 0 ? (
            <div>
              {reviews.map((review) => (
                <article className="ds-review-item" key={review.id}>
                  <div className="ds-actions-row" style={{ justifyContent: 'space-between' }}>
                    <RatingStars rating={review.rating} showCount={false} />
                    <span className="ds-muted" style={{ fontSize: '0.84rem' }}>
                      {formatKenyanDateTime(review.created_at)}
                    </span>
                  </div>
                  <p>{review.comment || 'No written comment provided.'}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No customer reviews yet"
              description="Customer ratings and reviews appear here once completed Doorstep bookings are reviewed."
            />
          )}
        </section>
      )}

      {activeTab === 'analytics' && (
        <section style={{ display: 'grid', gap: 18 }}>
          <div className="ds-kpi-grid">
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Total Enquiries</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{bookings.length}</strong>
              <span className="ds-kpi-sub">All bookings &amp; quote requests</span>
            </div>
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Quote Acceptance</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{quoteConversion}</strong>
              <span className="ds-kpi-sub">{quotedBookings.length} quotes sent</span>
            </div>
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Completed Jobs</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{completedCount}</strong>
              <span className="ds-kpi-sub">Verified request completions</span>
            </div>
          </div>

          <AnalyticsChart
            title="Monthly incoming requests"
            subtitle="Real booking and quotation volume across the last 6 months."
            data={monthlyChartData}
            emptyLabel="No incoming customer requests recorded over the last 6 months."
          />

          <AnalyticsChart
            title="Request status breakdown"
            subtitle="Distribution of your bookings and quotation requests."
            data={statusBreakdownData}
          />
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="ds-card ds-panel">
          <div>
            <h2>Business profile settings</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              Keep your Kenyan service area, category, bio, and visibility settings accurate.
            </p>
          </div>

          {categoryError && (
            <div className="ds-alert ds-alert-error" role="alert">
              <span>Service categories could not load. Apply the database migration and try again.</span>
            </div>
          )}

          <form className="ds-form-grid" onSubmit={submit(saveProviderProfileAction)}>
            <input type="hidden" name="service_center_exists" value={serviceCenter ? 'true' : 'false'} />

            <label className="ds-field">
              Business name
              <input
                className="ds-input"
                name="business_name"
                minLength={2}
                maxLength={120}
                defaultValue={profile.business_name}
                required
              />
            </label>

            <label className="ds-field">
              Main service category
              <select className="ds-select" name="category_id" defaultValue={profile.category_id || ''}>
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="ds-field ds-span-2">
              Professional headline (optional)
              <input
                className="ds-input"
                name="headline"
                maxLength={140}
                defaultValue={profile.headline}
                placeholder="e.g. Licensed residential plumber serving Westlands & Kilimani"
              />
            </label>

            <label className="ds-field">
              County, town, or area
              <input
                className="ds-input"
                name="location"
                list="ds-provider-areas"
                minLength={2}
                maxLength={160}
                defaultValue={profile.location}
                placeholder="e.g. Westlands, Nairobi"
                required
              />
              <datalist id="ds-provider-areas">
                {KENYAN_LOCATIONS.map((area) => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </label>

            <label className="ds-field">
              Years of experience
              <input
                className="ds-input"
                name="years_experience"
                type="number"
                min="0"
                max="80"
                step="1"
                defaultValue={profile.years_experience}
                required
              />
            </label>

            <label className="ds-field ds-span-2">
              Skills &amp; specialities (comma-separated)
              <input
                className="ds-input"
                name="skills"
                defaultValue={profile.skills.join(', ')}
                placeholder="e.g. Leak detection, Solar water heaters, Drainage, Bathroom installs"
              />
            </label>

            <label className="ds-field">
              Public visibility
              <select className="ds-select" name="paused" defaultValue={profile.paused ? 'true' : 'false'}>
                <option value="false">Active — visible when category is approved</option>
                <option value="true">Paused — hidden from discovery</option>
              </select>
            </label>

            <div className="ds-form-grid ds-span-2">
              <label className="ds-field">
                Approximate service-area latitude
                <input
                  className="ds-input"
                  name="service_latitude"
                  type="number"
                  min="-90"
                  max="90"
                  step="0.01"
                  defaultValue={serviceCenter?.latitude ?? ''}
                  placeholder="Optional"
                />
              </label>
              <label className="ds-field">
                Approximate service-area longitude
                <input
                  className="ds-input"
                  name="service_longitude"
                  type="number"
                  min="-180"
                  max="180"
                  step="0.01"
                  defaultValue={serviceCenter?.longitude ?? ''}
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="ds-span-2 ds-actions-row">
              <button
                className="ds-btn ds-btn-secondary ds-btn-sm"
                type="button"
                onClick={(event) => {
                  const form = event.currentTarget.form;
                  if (!navigator.geolocation || !form) {
                    setLocationSetupFeedback('Location access is unavailable. Enter approximate coordinates manually.');
                    return;
                  }
                  setLocationSetupFeedback('Waiting for location permission…');
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const latitude = roundToApproximate(position.coords.latitude, -90, 90);
                      const longitude = roundToApproximate(position.coords.longitude, -180, 180);
                      if (latitude === null || longitude === null) {
                        setLocationSetupFeedback('Could not read a valid location.');
                        return;
                      }
                      (form.elements.namedItem('service_latitude') as HTMLInputElement).value = String(latitude);
                      (form.elements.namedItem('service_longitude') as HTMLInputElement).value = String(longitude);
                      setLocationSetupFeedback('Approximate ~1 km coordinates populated. Save profile to apply.');
                    },
                    () => setLocationSetupFeedback('Location was not shared. Enter approximate coordinates manually.'),
                    { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
                  );
                }}
              >
                Set approximate center from my location
              </button>
              {locationSetupFeedback && (
                <span className="ds-muted" role="status" style={{ fontSize: '0.86rem' }}>
                  {locationSetupFeedback}
                </span>
              )}
            </div>

            <label className="ds-field ds-span-2">
              About your business
              <textarea
                className="ds-textarea"
                name="bio"
                maxLength={2000}
                rows={4}
                defaultValue={profile.bio}
                placeholder="Describe your experience, what customers can expect, and areas you cover..."
              />
            </label>

            <div className="ds-span-2">
              <button className="ds-btn ds-btn-primary" type="submit" disabled={busy}>
                <CheckCircle2 size={16} aria-hidden="true" />
                {busy ? 'Saving…' : 'Save business profile'}
              </button>
            </div>
          </form>
        </section>
      )}

      <Modal
        open={Boolean(pendingDeleteService)}
        onClose={() => setPendingDeleteService(null)}
        title={`Delete “${pendingDeleteService?.name || ''}”?`}
        description="This permanently removes the service listing from Doorstep."
        footer={
          <>
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setPendingDeleteService(null)}>
              Cancel
            </button>
            <button type="button" className="ds-btn ds-btn-danger ds-btn-sm" onClick={confirmDeleteService}>
              Delete service
            </button>
          </>
        }
      />
    </DashboardShell>
  );
}
