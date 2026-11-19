import { ActionForm } from '../../action-form';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '../../auth-actions';
import { markNotificationReadAction, respondToBookingAction, respondToQuotationAction, sendMessageAction } from '../../booking-actions';

export default async function CustomerDashboard() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return <DashboardSetup/>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  if (profile?.role === 'provider') redirect('/dashboard/provider');

  const [bookingResult, notificationsResult] = await Promise.all([
    supabase.from('bookings').select('id, provider_id, request_kind, description, location, preferred_at, proposed_at, proposed_timezone, status, created_at, services(name), provider_profiles(business_name), messages(id, sender_id, recipient_id, body, created_at), quotations(id, amount, currency, message, status)').eq('customer_id', user.id).order('created_at', { ascending: false }),
    supabase.from('notifications').select('id, kind, body, read_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);
  const bookings = (bookingResult.data || []) as Array<any>;
  const notifications = notificationsResult.data || [];
  const date = (value: string) => new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(value));

  return <main className="wrap auth-wrap provider-dashboard">
    <a className="logo" href="/"><i/>Doorstep</a>
    <header className="dashboard-heading"><div><p className="eyebrow">Customer workspace</p><h1>Your service requests</h1><p className="sub">Hello, {profile?.full_name || user.email || 'there'}. Track dates, provider replies, and quotes here.</p></div><a className="btn ghost" href="/browse">Find a professional</a></header>
    <section className="card provider-panel"><h2>Notifications</h2>{notificationsResult.error ? <p className="auth-error">Notifications could not be loaded.</p> : notifications.length ? <div className="request-list">{notifications.map((notification) => <article className="request-card" key={notification.id}><p>{notification.body}</p><small>{date(notification.created_at)}</small>{!notification.read_at && <ActionForm action={markNotificationReadAction}><input type="hidden" name="notification_id" value={notification.id}/><button className="btn ghost small">Mark read</button></ActionForm>}</article>)}</div> : <p className="muted">You have no notifications yet.</p>}</section>
    <section className="provider-panel"><div className="panel-heading"><div><h2>Bookings and quotes</h2><p className="muted">Dates are shown in East Africa Time.</p></div></div>
      {bookingResult.error ? <p className="auth-error">Requests could not be loaded. Apply the latest database migrations.</p> : bookings.length ? <div className="request-list">{bookings.map((booking) => {
        const provider = Array.isArray(booking.provider_profiles) ? booking.provider_profiles[0] : booking.provider_profiles;
        const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
        const quote = Array.isArray(booking.quotations) ? booking.quotations[0] : null;
        const messages = booking.messages || [];
        return <article className="card request-card" key={booking.id}>
          <div className="provider-service-top"><div><p className="eyebrow">{booking.request_kind === 'quotation' ? 'Quote request' : 'Booking request'}</p><h3>{service?.name || 'Service request'} · {provider?.business_name || 'Provider'}</h3></div><span className="service-state">{booking.status.replaceAll('_', ' ')}</span></div>
          <p>{booking.description}</p><p className="muted">{booking.location} · Preferred: {date(booking.preferred_at)}{booking.proposed_at ? ` · Provider proposed: ${date(booking.proposed_at)}` : ''}</p>
          {quote && <section className="quote-card"><h4>Provider quote</h4><p><strong>{quote.currency} {Number(quote.amount).toLocaleString('en-KE')}</strong> — {quote.message}</p><p className="muted">Quote: {quote.status}</p>{booking.status === 'pending' && quote.status === 'quoted' && <><p className="note">Before accepting, confirm the work scope, what is included, the final amount and any fees, timing, and cancellation terms. Doorstep does not collect payment in this prototype.</p><div className="acts">{[true, false].map((accept) => <ActionForm action={respondToQuotationAction} key={String(accept)}><input type="hidden" name="quotation_id" value={quote.id}/><input type="hidden" name="accept" value={String(accept)}/><button className={`btn small ${accept ? '' : 'ghost'}`}>{accept ? 'Accept quote' : 'Decline'}</button></ActionForm>)}</div></>}</section>}
          {booking.status === 'proposed' && <div className="acts">{['accepted', 'declined'].map((status) => <ActionForm action={respondToBookingAction} key={status}><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="status" value={status}/><button className={`btn small ${status === 'accepted' ? '' : 'ghost'}`}>{status === 'accepted' ? 'Accept new time' : 'Decline new time'}</button></ActionForm>)}</div>}
          {['pending', 'accepted'].includes(booking.status) && <ActionForm action={respondToBookingAction} className="acts"><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="status" value="cancelled"/><button className="btn ghost small">Cancel request</button></ActionForm>}
          <details className="message-thread"><summary>Messages ({messages.length})</summary><div className="thread-messages">{messages.map((message: any) => <p className={message.sender_id === user.id ? 'mine' : ''} key={message.id}>{message.body}<small>{date(message.created_at)}</small></p>)}</div><ActionForm action={sendMessageAction} className="message-form"><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="recipient_id" value={booking.provider_id}/><textarea name="body" maxLength={2000} rows={2} placeholder="Write a message. Avoid ID numbers, passwords, and health details." required/><button className="btn ghost small">Send</button></ActionForm></details>
        </article>;
      })}</div> : <p className="banner">No service requests yet. <a href="/browse">Browse providers</a> and send a booking or quote request from a live profile.</p>}
    </section>
    <form action={logoutAction}><button className="btn ghost small">Sign out</button></form>
  </main>;
}

function DashboardSetup() { return <main className="wrap auth-wrap"><a className="logo" href="/"><i/>Doorstep</a><section className="card dash-card"><h1>Supabase setup needed</h1><p>Add your Supabase project URL and anon key to `.env.local`, then apply the migrations in `supabase/migrations`.</p><a className="btn" href="/">Back to home</a></section></main>; }
