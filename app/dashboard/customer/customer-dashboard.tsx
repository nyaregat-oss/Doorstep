'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { Bell, ExternalLink, Heart, MapPin, MessageSquare, Search, Send, Star, Trash2 } from 'lucide-react';
import { ActionForm } from '@/app/action-form';
import {
  markAllNotificationsReadAction,
  markMessagesReadAction,
  markNotificationReadAction,
  respondToBookingAction,
  respondToQuotationAction,
  sendMessageAction,
} from '@/app/booking-actions';
import { submitReviewAction, toggleSaveProviderAction, updateCustomerProfileAction } from './actions';
import { formatCurrency, formatKenyanDateTime, getCategoryImage } from '@/lib/kenya';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { Badge, VerifiedBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { RatingStars } from '@/components/ui/rating-stars';

export type CustomerMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type CustomerBooking = {
  id: string;
  provider_id: string;
  request_kind: 'booking' | 'quotation';
  description: string;
  location: string;
  preferred_at: string;
  proposed_at: string | null;
  status: string;
  created_at: string;
  services: { name: string }[] | { name: string } | null;
  provider_profiles: { business_name: string }[] | { business_name: string } | null;
  messages: CustomerMessage[];
  quotations: Array<{ id: string; amount: number | string; currency: string; message: string; status: string }>;
};

export type CustomerNotification = {
  id: string;
  kind: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type SavedProviderItem = {
  provider_id: string;
  created_at: string;
  provider_profiles:
    | {
        business_name: string;
        location: string;
        verified: boolean;
        categories: { name: string }[] | { name: string } | null;
      }
    | Array<{
        business_name: string;
        location: string;
        verified: boolean;
        categories: { name: string }[] | { name: string } | null;
      }>
    | null;
};

export type CustomerReview = {
  id: string;
  booking_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
  provider_profiles: { business_name: string }[] | { business_name: string } | null;
};

function statusTone(status: string): 'warning' | 'success' | 'danger' | 'navy' | 'neutral' {
  if (status === 'completed' || status === 'accepted') return 'success';
  if (status === 'declined' || status === 'cancelled') return 'danger';
  if (status === 'in_progress') return 'navy';
  if (status === 'proposed' || status === 'pending') return 'warning';
  return 'neutral';
}

function RequestStepper({ status }: { status: string }) {
  const steps = [
    { label: 'Requested', done: true },
    { label: 'Confirmed', done: ['accepted', 'in_progress', 'completed'].includes(status) },
    { label: 'In Progress', done: ['in_progress', 'completed'].includes(status) },
    { label: 'Completed', done: status === 'completed' },
  ];
  return (
    <div className="ds-stepper" aria-label={`Progress: ${status.replaceAll('_', ' ')}`}>
      {steps.map((step) => (
        <div className={`ds-step-dot ${step.done ? 'is-done' : ''}`} key={step.label}>
          <div className="ds-step-bar" />
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export function CustomerDashboard({
  userId,
  email,
  fullName,
  phone,
  bookings,
  bookingError,
  notifications,
  notificationError,
  savedProviders,
  reviews,
}: {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  bookings: CustomerBooking[];
  bookingError: boolean;
  notifications: CustomerNotification[];
  notificationError: boolean;
  savedProviders: SavedProviderItem[];
  reviews: CustomerReview[];
}) {
  const [activeTab, setActiveTab] = useState('requests');
  const [filter, setFilter] = useState('all');
  const [selectedThreadId, setSelectedThreadId] = useState(bookings[0]?.id || '');

  const activeBookingsCount = bookings.filter((b) => ['pending', 'proposed', 'accepted', 'in_progress'].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const unreadNotifs = notifications.filter((n) => !n.read_at).length;
  const unreadMsgs = bookings.reduce(
    (sum, b) => sum + (b.messages || []).filter((m) => m.recipient_id === userId && !m.read_at).length,
    0,
  );
  const reviewedBookingIds = new Set(reviews.map((r) => r.booking_id));

  const navItems: DashboardNavItem[] = [
    { id: 'requests', label: 'My Requests', icon: 'requests', badge: unreadNotifs },
    { id: 'messages', label: 'Messages', icon: 'messages', badge: unreadMsgs },
    { id: 'saved', label: 'Saved Pros', icon: 'saved', badge: savedProviders.length },
    { id: 'reviews', label: 'My Reviews', icon: 'reviews' },
    { id: 'settings', label: 'Account Settings', icon: 'settings' },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'proposed', 'accepted', 'in_progress'].includes(b.status);
    if (filter === 'completed') return b.status === 'completed';
    return ['declined', 'cancelled'].includes(b.status);
  });

  const activeThread = bookings.find((b) => b.id === selectedThreadId) || bookings[0] || null;

  return (
    <DashboardShell
      roleLabel="Customer workspace"
      userTitle={fullName || email || 'Customer'}
      userSubtitle={email}
      items={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      headerActions={
        <header className="ds-dash-header">
          <div>
            <span className="ds-eyebrow">Customer Hub</span>
            <h1>Your service requests</h1>
            <p className="ds-muted" style={{ marginTop: 6 }}>
              Track active bookings, respond to provider quotes, message professionals, and manage your account.
            </p>
          </div>
          <Link className="ds-btn ds-btn-amber ds-btn-sm" href="/browse">
            <Search size={15} aria-hidden="true" />
            Find a professional
          </Link>
        </header>
      }
      sidebarFooter={
        <Link className="ds-btn ds-btn-ghost ds-btn-sm ds-btn-full" href="/report">
          Safety &amp; Report Centre
        </Link>
      }
    >
      {activeTab === 'requests' && (
        <>
          <section className="ds-kpi-grid" aria-label="Request summary">
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Active Requests</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{activeBookingsCount}</strong>
              <span className="ds-kpi-sub">Open or scheduled jobs</span>
            </div>
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Completed Jobs</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{completedCount}</strong>
              <span className="ds-kpi-sub">Finished services</span>
            </div>
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Saved Professionals</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{savedProviders.length}</strong>
              <span className="ds-kpi-sub">Bookmarked specialists</span>
            </div>
            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-top">
                <span>Unread Alerts</span>
              </div>
              <strong className="ds-kpi-val tabular-nums">{unreadNotifs + unreadMsgs}</strong>
              <span className="ds-kpi-sub">Updates &amp; messages</span>
            </div>
          </section>

          {/* Notifications */}
          <section className="ds-card ds-panel">
            <div className="ds-panel-head">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={20} aria-hidden="true" />
                Notifications
              </h2>
              {unreadNotifs > 0 && (
                <ActionForm action={markAllNotificationsReadAction}>
                  <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit">
                    Mark all read
                  </button>
                </ActionForm>
              )}
            </div>
            {notificationError ? (
              <div className="ds-alert ds-alert-error">
                <span>Notifications could not be loaded.</span>
              </div>
            ) : notifications.length > 0 ? (
              <div className="ds-request-list">
                {notifications.map((notification) => (
                  <article className="ds-record-item" key={notification.id}>
                    <div>
                      <p style={{ fontWeight: notification.read_at ? 400 : 600 }}>{notification.body}</p>
                      <small className="ds-muted">{formatKenyanDateTime(notification.created_at)}</small>
                    </div>
                    {!notification.read_at && (
                      <ActionForm action={markNotificationReadAction}>
                        <input type="hidden" name="notification_id" value={notification.id} />
                        <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit">
                          Mark read
                        </button>
                      </ActionForm>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="ds-muted">You have no notifications yet.</p>
            )}
          </section>

          {/* Bookings & Quotes */}
          <section style={{ display: 'grid', gap: 14 }}>
            <div className="ds-panel-head">
              <div>
                <h2>Bookings &amp; quote history</h2>
                <p className="ds-muted" style={{ fontSize: '0.88rem' }}>
                  All dates use East Africa Time (EAT).
                </p>
              </div>
              <div className="ds-tabs" role="tablist" aria-label="Filter requests">
                {[
                  ['all', 'All'],
                  ['active', 'Active'],
                  ['completed', 'Completed'],
                  ['closed', 'Cancelled / Declined'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={filter === key}
                    className="ds-tab-btn"
                    onClick={() => setFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {bookingError ? (
              <div className="ds-alert ds-alert-error">
                <span>Requests could not be loaded. Apply the latest database migrations.</span>
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="ds-request-list">
                {filteredBookings.map((booking) => {
                  const provider = Array.isArray(booking.provider_profiles)
                    ? booking.provider_profiles[0]
                    : booking.provider_profiles;
                  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
                  const quote = Array.isArray(booking.quotations) ? booking.quotations[0] : null;
                  const messages = booking.messages || [];
                  const canReview = booking.status === 'completed' && !reviewedBookingIds.has(booking.id);

                  return (
                    <article className="ds-card ds-request-card" key={booking.id}>
                      <div className="ds-request-top">
                        <div>
                          <div className="ds-actions-row">
                            <Badge tone="navy">
                              {booking.request_kind === 'quotation' ? 'Quote request' : 'Booking request'}
                            </Badge>
                            <Badge tone={statusTone(booking.status)}>{booking.status.replaceAll('_', ' ')}</Badge>
                          </div>
                          <h3 style={{ marginTop: 8 }}>
                            {service?.name || 'Service request'} · {provider?.business_name || 'Provider'}
                          </h3>
                        </div>
                        <Link className="ds-btn ds-btn-ghost ds-btn-sm" href={`/providers/${booking.provider_id}`}>
                          <ExternalLink size={14} aria-hidden="true" />
                          Provider profile
                        </Link>
                      </div>

                      <RequestStepper status={booking.status} />

                      <p>{booking.description}</p>
                      <p className="ds-muted" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} aria-hidden="true" />
                        <span>
                          {booking.location} · Preferred: {formatKenyanDateTime(booking.preferred_at)}
                          {booking.proposed_at ? ` · Provider proposed: ${formatKenyanDateTime(booking.proposed_at)}` : ''}
                        </span>
                      </p>

                      {quote && (
                        <div className="ds-quote-box">
                          <strong>
                            Provider quote: {formatCurrency(quote.amount, quote.currency)} ({quote.status})
                          </strong>
                          <p style={{ fontSize: '0.92rem' }}>{quote.message}</p>
                          {booking.status === 'pending' && quote.status === 'quoted' && (
                            <>
                              <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                                Confirm job scope, materials, and payment terms before accepting. Doorstep does not
                                process online payments yet.
                              </p>
                              <div className="ds-actions-row">
                                <ActionForm action={respondToQuotationAction}>
                                  <input type="hidden" name="quotation_id" value={quote.id} />
                                  <input type="hidden" name="accept" value="true" />
                                  <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                                    Accept quote
                                  </button>
                                </ActionForm>
                                <ActionForm action={respondToQuotationAction}>
                                  <input type="hidden" name="quotation_id" value={quote.id} />
                                  <input type="hidden" name="accept" value="false" />
                                  <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit">
                                    Decline quote
                                  </button>
                                </ActionForm>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {booking.status === 'proposed' && (
                        <div className="ds-actions-row">
                          <ActionForm action={respondToBookingAction}>
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <input type="hidden" name="status" value="accepted" />
                            <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                              Accept new time
                            </button>
                          </ActionForm>
                          <ActionForm action={respondToBookingAction}>
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <input type="hidden" name="status" value="declined" />
                            <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit">
                              Decline new time
                            </button>
                          </ActionForm>
                        </div>
                      )}

                      {['pending', 'accepted'].includes(booking.status) && (
                        <ActionForm action={respondToBookingAction}>
                          <input type="hidden" name="booking_id" value={booking.id} />
                          <input type="hidden" name="status" value="cancelled" />
                          <button className="ds-btn ds-btn-danger ds-btn-sm" type="submit">
                            Cancel request
                          </button>
                        </ActionForm>
                      )}

                      {canReview && (
                        <ActionForm action={submitReviewAction} className="ds-quote-box">
                          <strong>Leave a verified review</strong>
                          <input type="hidden" name="booking_id" value={booking.id} />
                          <input type="hidden" name="provider_id" value={booking.provider_id} />
                          <label className="ds-field">
                            Rating
                            <select className="ds-select" name="rating" defaultValue="5">
                              <option value="5">5 stars — Excellent</option>
                              <option value="4">4 stars — Good</option>
                              <option value="3">3 stars — Satisfactory</option>
                              <option value="2">2 stars — Needs improvement</option>
                              <option value="1">1 star — Poor</option>
                            </select>
                          </label>
                          <label className="ds-field">
                            Your review (optional)
                            <textarea
                              className="ds-textarea"
                              name="comment"
                              maxLength={1500}
                              rows={2}
                              placeholder="Share how punctuality, quality, and communication went..."
                            />
                          </label>
                          <div>
                            <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
                              Publish review
                            </button>
                          </div>
                        </ActionForm>
                      )}

                      <details style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem' }}>
                          Messages ({messages.length})
                        </summary>
                        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`ds-chat-bubble ${message.sender_id === userId ? 'is-mine' : ''}`}
                            >
                              <span>{message.body}</span>
                              <small>{formatKenyanDateTime(message.created_at)}</small>
                            </div>
                          ))}
                          <ActionForm action={sendMessageAction} className="ds-actions-row">
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <input type="hidden" name="recipient_id" value={booking.provider_id} />
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
                })}
              </div>
            ) : (
              <EmptyState
                title="No service requests yet"
                description="Browse skilled Kenyan professionals and send a booking or quotation request directly from their profile."
                actionLabel="Explore professionals"
                actionHref="/browse"
              />
            )}
          </section>
        </>
      )}

      {activeTab === 'messages' && (
        <section className="ds-card ds-panel">
          <div>
            <h2>Messages inbox</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              Communicate with professionals about each service request.
            </p>
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={22} />}
              title="No message threads yet"
              description="Send a service or quote request to start messaging a professional."
              actionLabel="Browse services"
              actionHref="/browse"
            />
          ) : (
            <div className="ds-inbox-grid">
              <div className="ds-inbox-threads">
                {bookings.map((b) => {
                  const provider = Array.isArray(b.provider_profiles) ? b.provider_profiles[0] : b.provider_profiles;
                  const service = Array.isArray(b.services) ? b.services[0] : b.services;
                  const unread = (b.messages || []).filter((m) => m.recipient_id === userId && !m.read_at).length;
                  const isCurrent = activeThread?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`ds-thread-btn ${isCurrent ? 'is-active' : ''}`}
                      onClick={() => setSelectedThreadId(b.id)}
                    >
                      <div className="ds-actions-row" style={{ justifyContent: 'space-between' }}>
                        <strong>{provider?.business_name || 'Provider'}</strong>
                        {unread > 0 && <Badge tone="amber">{unread}</Badge>}
                      </div>
                      <span className="ds-muted" style={{ fontSize: '0.82rem' }}>
                        {service?.name || 'Request'} · {b.status.replaceAll('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeThread && (
                <div className="ds-card ds-chat-pane">
                  <div className="ds-panel-head" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                    <div>
                      <strong>
                        {(Array.isArray(activeThread.provider_profiles)
                          ? activeThread.provider_profiles[0]
                          : activeThread.provider_profiles
                        )?.business_name || 'Provider'}
                      </strong>
                      <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                        {activeThread.location} · {formatKenyanDateTime(activeThread.preferred_at)}
                      </p>
                    </div>
                    {(activeThread.messages || []).some((m) => m.recipient_id === userId && !m.read_at) && (
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
                        No messages yet. Send a question or access instruction below.
                      </p>
                    ) : (
                      activeThread.messages.map((msg) => (
                        <div key={msg.id} className={`ds-chat-bubble ${msg.sender_id === userId ? 'is-mine' : ''}`}>
                          <span>{msg.body}</span>
                          <small>{formatKenyanDateTime(msg.created_at)}</small>
                        </div>
                      ))
                    )}
                  </div>

                  <ActionForm action={sendMessageAction} className="ds-actions-row">
                    <input type="hidden" name="booking_id" value={activeThread.id} />
                    <input type="hidden" name="recipient_id" value={activeThread.provider_id} />
                    <textarea
                      className="ds-textarea"
                      name="body"
                      maxLength={2000}
                      rows={2}
                      placeholder="Write a message..."
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

      {activeTab === 'saved' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2>Saved professionals</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem' }}>
              Keep trusted specialists bookmarked for future home or business work.
            </p>
          </div>

          {savedProviders.length > 0 ? (
            <div className="ds-pro-grid">
              {savedProviders.map((item) => {
                const pro = Array.isArray(item.provider_profiles)
                  ? item.provider_profiles[0]
                  : item.provider_profiles;
                if (!pro) return null;
                const cat = Array.isArray(pro.categories) ? pro.categories[0]?.name : pro.categories?.name;
                return (
                  <article className="ds-pro-card" key={item.provider_id}>
                    <div className="ds-pro-media">
                      <Image
                        src={getCategoryImage(cat || '')}
                        alt={pro.business_name}
                        fill
                        sizes="(max-width: 680px) 100vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="ds-pro-media-badges">
                        <Badge tone="navy">{cat || 'Provider'}</Badge>
                        {pro.verified && <VerifiedBadge />}
                      </div>
                    </div>
                    <div className="ds-pro-body">
                      <h3 className="ds-pro-name">{pro.business_name}</h3>
                      <p className="ds-pro-loc">
                        <MapPin size={14} aria-hidden="true" />
                        {pro.location}
                      </p>
                      <div className="ds-pro-foot">
                        <Link className="ds-btn ds-btn-secondary ds-btn-sm" href={`/providers/${item.provider_id}`}>
                          View Profile
                        </Link>
                        <ActionForm action={toggleSaveProviderAction}>
                          <input type="hidden" name="provider_id" value={item.provider_id} />
                          <input type="hidden" name="intent" value="remove" />
                          <button type="submit" className="ds-btn ds-btn-danger ds-btn-sm" aria-label={`Remove ${pro.business_name}`}>
                            <Trash2 size={14} aria-hidden="true" />
                            Remove
                          </button>
                        </ActionForm>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Heart size={22} />}
              title="No saved professionals yet"
              description="Click 'Save Professional' on any live provider profile to bookmark them here."
              actionLabel="Browse professionals"
              actionHref="/browse"
            />
          )}
        </section>
      )}

      {activeTab === 'reviews' && (
        <section className="ds-card ds-panel">
          <div>
            <h2>Your submitted reviews</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              Reviews can be submitted once after a booking reaches Completed status.
            </p>
          </div>
          {reviews.length > 0 ? (
            <div>
              {reviews.map((review) => {
                const pro = Array.isArray(review.provider_profiles)
                  ? review.provider_profiles[0]
                  : review.provider_profiles;
                return (
                  <article className="ds-review-item" key={review.id}>
                    <div className="ds-actions-row" style={{ justifyContent: 'space-between' }}>
                      <strong>{pro?.business_name || 'Service provider'}</strong>
                      <RatingStars rating={review.rating} showCount={false} />
                    </div>
                    <p>{review.comment || 'No written comment.'}</p>
                    <small className="ds-muted">{formatKenyanDateTime(review.created_at)}</small>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Star size={22} />}
              title="No reviews submitted yet"
              description="Once a service request is marked complete, you can rate and review the professional from My Requests."
            />
          )}
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="ds-card ds-panel">
          <div>
            <h2>Account settings</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              Update your contact details used on service requests.
            </p>
          </div>
          <ActionForm action={updateCustomerProfileAction} className="ds-form-grid">
            <label className="ds-field">
              Full name
              <input
                className="ds-input"
                name="full_name"
                minLength={2}
                maxLength={120}
                defaultValue={fullName}
                required
              />
            </label>
            <label className="ds-field">
              Phone number (Kenya format)
              <input
                className="ds-input"
                name="phone"
                type="tel"
                maxLength={32}
                defaultValue={phone}
                placeholder="+254 712 345 678"
              />
            </label>
            <label className="ds-field ds-span-2">
              Email address
              <input className="ds-input" value={email} disabled />
            </label>
            <div className="ds-span-2 ds-actions-row">
              <button className="ds-btn ds-btn-primary" type="submit">
                Save account details
              </button>
              <Link className="ds-btn ds-btn-secondary" href="/reset-password">
                Change password
              </Link>
              <Link className="ds-btn ds-btn-ghost" href="/privacy">
                Privacy controls
              </Link>
            </div>
          </ActionForm>
        </section>
      )}
    </DashboardShell>
  );
}
