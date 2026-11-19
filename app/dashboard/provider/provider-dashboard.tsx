'use client';

import { ActionForm } from '@/app/action-form';
import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteServiceAction, saveProviderProfileAction, saveServiceAction, setServiceActiveAction } from './actions';
import { AvailabilityManager } from './availability-manager';
import { PortfolioManager } from './portfolio-manager';
import { markNotificationReadAction, respondToBookingAction, sendMessageAction, sendQuotationAction } from '@/app/booking-actions';
import { roundToApproximate } from '@/lib/location';

type Category = { id: string; name: string };
type Service = { id: string; name: string; description: string; starting_price: number; currency: string; active: boolean };
type ProviderProfile = { profile_id: string; business_name: string; category_id: string | null; location: string; bio: string; years_experience: number };

export function ProviderDashboard({ profile, serviceCenter, categories, services, categoryError, categoryReviewState, requiredVerificationKinds, databaseError, portfolio, portfolioError, availability, availabilityError, bookings = [], bookingsError = false, notifications = [] }: {
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
  bookings?: Array<any>;
  bookingsError?: boolean;
  notifications?: Array<any>;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [feedback, setFeedback] = useState('');
  const [locationSetupFeedback, setLocationSetupFeedback] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const activeCount = services.filter((service) => service.active).length;
  const formatDate = (value: string) => new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(value));

  function runAction(form: HTMLFormElement, action: (data: FormData) => Promise<{ error?: string; message?: string }>, reset = false) {
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      setFeedback(result.error || result.message || '');
      if (!result.error) {
        if (reset) form.reset();
        setEditing(null);
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

  return <main className="wrap auth-wrap provider-dashboard">
    <a className="logo" href="/"><i/>Doorstep</a>
    <header className="dashboard-heading"><div><p className="eyebrow">Provider workspace</p><h1>Grow your business</h1><p className="sub">Manage your profile, submit relevant professional credentials for review, and manage requests.</p></div><div className="acts"><a className="btn ghost" href="/dashboard/provider/compliance">Credentials</a><a className="btn ghost" href="/">View marketplace</a></div></header>
    <section className="stats" aria-label="Business overview">
      <div className="card"><span>Services</span><b>{databaseError ? '—' : services.length}</b></div>
      <div className="card"><span>Published</span><b>{databaseError ? '—' : activeCount}</b></div>
      <div className="card"><span>Requests</span><b>{bookingsError ? '—' : bookings.length}</b><small>Customer bookings and quote requests</small></div>
    </section>

    {categoryReviewState !== 'approved' ? <p className="banner">Live profiles and services in this category are hidden until compliance review is recorded. Current status: {categoryReviewState}. Customer requests are disabled.</p> : requiredVerificationKinds.length > 0 && <p className="banner">This category requires approved checks: {requiredVerificationKinds.join(', ')}. Submit current records in <a href="/dashboard/provider/compliance">Credentials</a>. Expired or unapproved checks prevent publishing.</p>}

    <section className="card provider-panel"><h2>Notifications</h2>{notifications.length ? <div className="request-list">{notifications.map((item) => <article className="request-card" key={item.id}><p>{item.body}</p><small>{formatDate(item.created_at)}</small>{!item.read_at && <ActionForm action={markNotificationReadAction}><input type="hidden" name="notification_id" value={item.id}/><button className="btn ghost small">Mark read</button></ActionForm>}</article>)}</div> : <p className="muted">No notifications yet.</p>}</section>

    <section className="provider-panel"><div className="panel-heading"><div><h2>Customer requests</h2><p className="muted">Respond to bookings, propose a time, and send quotes for quotation requests.</p></div></div>
      {bookingsError ? <p className="auth-error">Requests could not be loaded. Apply the bookings migration.</p> : bookings.length ? <div className="request-list">{bookings.map((booking) => {
        const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
        const quote = Array.isArray(booking.quotations) ? booking.quotations[0] : null;
        const messages = booking.messages || [];
        return <article className="card request-card" key={booking.id}>
          <div className="provider-service-top"><div><p className="eyebrow">{booking.request_kind === 'quotation' ? 'Quote request' : 'Booking request'}</p><h3>{service?.name || 'Service request'} · {booking.customer_display_name || 'Customer'}</h3></div><span className="service-state">{booking.status.replaceAll('_', ' ')}</span></div>
          <p>{booking.description}</p><p className="muted">{booking.location} · Preferred: {formatDate(booking.preferred_at)}{booking.proposed_at ? ` · You proposed: ${formatDate(booking.proposed_at)}` : ''}</p>
          {booking.status === 'pending' && booking.request_kind === 'booking' && <div className="acts">{['accepted', 'declined'].map((status) => <ActionForm action={respondToBookingAction} key={status}><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="status" value={status}/><button className={`btn small ${status === 'accepted' ? '' : 'ghost'}`}>{status === 'accepted' ? 'Accept' : 'Decline'}</button></ActionForm>)}<ActionForm action={respondToBookingAction} className="acts"><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="status" value="proposed"/><label>Suggest another time<input name="proposed_at" type="datetime-local" required/></label><button className="btn ghost small">Propose time</button></ActionForm></div>}
          {booking.status === 'accepted' && <ActionForm action={respondToBookingAction}><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="status" value="in_progress"/><button className="btn small">Mark work started</button></ActionForm>}
          {booking.status === 'in_progress' && <ActionForm action={respondToBookingAction}><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="status" value="completed"/><button className="btn small">Mark complete</button></ActionForm>}
          {booking.status === 'pending' && booking.request_kind === 'quotation' && !quote && <ActionForm action={sendQuotationAction} className="provider-fields quote-form"><input type="hidden" name="booking_id" value={booking.id}/><label>Quote amount<input name="amount" type="number" min="0" step="0.01" required/></label><label>Currency<input name="currency" defaultValue="KES" minLength={3} maxLength={3} required/></label><label className="wide">Note<textarea name="message" minLength={5} maxLength={2000} rows={2} required/></label><button className="btn small">Send quote</button></ActionForm>}
          {quote && <p className="quote-card">Quote sent: {quote.currency} {Number(quote.amount).toLocaleString('en-KE')} · {quote.status}</p>}
          <details className="message-thread"><summary>Messages ({messages.length})</summary><div className="thread-messages">{messages.map((message: any) => <p className={message.sender_id === profile.profile_id ? 'mine' : ''} key={message.id}>{message.body}<small>{formatDate(message.created_at)}</small></p>)}</div><ActionForm action={sendMessageAction} className="message-form"><input type="hidden" name="booking_id" value={booking.id}/><input type="hidden" name="recipient_id" value={booking.customer_id}/><textarea name="body" maxLength={2000} rows={2} placeholder="Write a message. Avoid ID numbers, passwords, and health details." required/><button className="btn ghost small">Send</button></ActionForm></details>
        </article>;
      })}</div> : <p className="banner">No customer requests yet. Published services will appear in discovery.</p>}
    </section>

    <section className="card provider-panel">
      <div className="panel-heading"><div><h2>Business profile</h2><p className="muted">This information appears on your professional profile.</p></div></div>
      {categoryError && <p className="auth-error" role="alert">Service categories could not load. Apply the database migration and try again.</p>}
      <form className="provider-fields" onSubmit={submit(saveProviderProfileAction)}>
        <input type="hidden" name="service_center_exists" value={serviceCenter ? 'true' : 'false'}/>
        <label>Business name<input name="business_name" minLength={2} maxLength={120} defaultValue={profile.business_name} required/></label>
        <label>Main service<select name="category_id" defaultValue={profile.category_id || ''}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>County, town, or area<input name="location" minLength={2} maxLength={160} defaultValue={profile.location} placeholder="e.g. Westlands, Nairobi" required/></label>
        <label>Approximate service-area latitude<input name="service_latitude" type="number" min="-90" max="90" step="0.01" defaultValue={serviceCenter?.latitude ?? ''} placeholder="Optional"/></label>
        <label>Approximate service-area longitude<input name="service_longitude" type="number" min="-180" max="180" step="0.01" defaultValue={serviceCenter?.longitude ?? ''} placeholder="Optional"/></label>
        <p className="note wide">Use an approximate public service-area center, not your home or a customer address. Coordinates are rounded to about 1 km and kept private; nearby search returns distance only.</p>
        <div className="wide acts"><button className="btn ghost small" type="button" onClick={(event) => {
          const form = event.currentTarget.form;
          if (!navigator.geolocation || !form) { setLocationSetupFeedback('Location access is unavailable. You can enter an approximate center manually.'); return; }
          setLocationSetupFeedback('Waiting for location permission…');
          navigator.geolocation.getCurrentPosition((position) => {
            const latitude = roundToApproximate(position.coords.latitude, -90, 90);
            const longitude = roundToApproximate(position.coords.longitude, -180, 180);
            if (latitude === null || longitude === null) { setLocationSetupFeedback('We could not read a valid location. Enter an approximate center manually.'); return; }
            (form.elements.namedItem('service_latitude') as HTMLInputElement).value = String(latitude);
            (form.elements.namedItem('service_longitude') as HTMLInputElement).value = String(longitude);
            setLocationSetupFeedback('Approximate coordinates added. Check that they represent your service area, then save.');
          }, () => setLocationSetupFeedback('Location was not shared. You can enter an approximate center manually.'), { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 });
        }}>Set approximate center from my location</button><span className="muted" role="status">{locationSetupFeedback}</span></div>
        <label>Years of experience<input name="years_experience" type="number" min="0" max="80" step="1" defaultValue={profile.years_experience} required/></label>
        <label className="wide">About your business<textarea name="bio" maxLength={2000} rows={4} defaultValue={profile.bio} placeholder="Describe the work you do and what customers can expect."/></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </section>

    <section className="provider-panel">
      <div className="panel-heading"><div><h2>Services and pricing</h2><p className="muted">Set a clear starting price in Kenyan shillings or another supported currency.</p></div></div>
      {databaseError && <p className="auth-error" role="alert">Services are not connected yet. Apply `202611170002_provider_services.sql` in your Supabase project to enable them.</p>}
      {!databaseError && services.length === 0 && <p className="banner">You have no services yet. Add your first service to prepare your profile for discovery.</p>}
      <div className="provider-service-list">
        {services.map((service) => <article className="card provider-service" key={service.id}>
          {editing === service.id ? <form className="provider-fields" onSubmit={submit(saveServiceAction)}>
            <input type="hidden" name="id" value={service.id}/>
            <label>Service name<input name="name" minLength={3} maxLength={100} defaultValue={service.name} required/></label>
            <label>Starting price<input name="starting_price" type="number" min="0" step="0.01" defaultValue={service.starting_price} required/></label>
            <label>Currency<input name="currency" minLength={3} maxLength={3} defaultValue={service.currency.trim()} required/></label>
            <label className="wide">Description<textarea name="description" maxLength={2000} rows={3} defaultValue={service.description}/></label>
            <div className="acts"><button className="btn small" type="submit" disabled={busy}>Save changes</button><button className="btn ghost small" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
          </form> : <>
            <div className="provider-service-top"><div><h3>{service.name}</h3><p className="muted">From {service.currency.trim()} {Number(service.starting_price).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div><span className={`service-state ${service.active ? 'is-active' : ''}`}>{service.active ? 'Published' : 'Paused'}</span></div>
            {service.description && <p>{service.description}</p>}
            <div className="acts">
              <button className="btn ghost small" type="button" onClick={() => setEditing(service.id)}>Edit</button>
              <form onSubmit={submit(setServiceActiveAction)}><input type="hidden" name="id" value={service.id}/><input type="hidden" name="active" value={String(!service.active)}/><button className="btn ghost small" type="submit" disabled={busy}>{service.active ? 'Pause' : 'Publish'}</button></form>
              <form onSubmit={(event) => { if (!window.confirm(`Delete “${service.name}”? This removes the service listing.`)) { event.preventDefault(); return; } submit(deleteServiceAction)(event); }}><input type="hidden" name="id" value={service.id}/><button className="btn ghost small danger" type="submit" disabled={busy}>Delete</button></form>
            </div>
          </>}
        </article>)}
      </div>

      <div className="card provider-panel add-service">
        <h3>Add a service</h3>
        <form className="provider-fields" onSubmit={submit(saveServiceAction, true)}>
          <label>Service name<input name="name" minLength={3} maxLength={100} placeholder="e.g. Tap repair" required/></label>
          <label>Starting price<input name="starting_price" type="number" min="0" step="0.01" placeholder="0.00" required/></label>
          <label>Currency<input name="currency" minLength={3} maxLength={3} defaultValue="KES" required/></label>
          <label className="wide">Description<textarea name="description" maxLength={2000} rows={3} placeholder="What is included in this service?"/></label>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add service'}</button>
        </form>
      </div>
    </section>
    <p className="provider-feedback" role="status" aria-live="polite">{feedback}</p>
    <AvailabilityManager items={availability} loadError={availabilityError}/>
    <PortfolioManager items={portfolio} loadError={portfolioError}/>
    <p className="note">Ratings, reviews, and analytics will be added after completed service transactions are ready.</p>
  </main>;
}
