'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBookingAction } from '@/app/booking-actions';

type ServiceOption = { id: string; name: string; starting_price: number | string; currency: string };

export function RequestServiceForm({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const wallTime = String(data.get('local_datetime') || '');
    // Kenya stays on EAT (UTC+03:00); store the selected wall time as an absolute instant.
    const instant = new Date(`${wallTime}:00+03:00`);
    if (!Number.isFinite(instant.getTime())) { setMessage('Choose a valid date and time.'); return; }
    data.set('preferred_at', instant.toISOString());
    startTransition(async () => {
      const result = await createBookingAction(data);
      setMessage(result.error || result.message || '');
      if (!result.error) { form.reset(); router.refresh(); }
    });
  }
  return <form className="request-form" onSubmit={submit}>
    {services.length ? <label>Service<select name="service_id" required defaultValue=""><option value="" disabled>Choose a published service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.currency.trim()} {Number(service.starting_price).toLocaleString('en-KE')}</option>)}</select></label> : <p className="muted">This provider has no published service to request yet.</p>}
    <label>Request type<select name="request_kind"><option value="booking">Booking request</option><option value="quotation">Request a quote</option></select></label>
    <label>Preferred date and time (East Africa Time)<input name="local_datetime" type="datetime-local" required/></label>
    <label>Your area or neighbourhood<input name="location" maxLength={120} minLength={2} placeholder="e.g. Kilimani, Nairobi" required/></label>
    <p className="note">Share a neighbourhood at this stage, not a full home address. Avoid passwords, ID numbers, and health details in the request or messages.</p>
    <label>What do you need?<textarea name="description" minLength={10} maxLength={2000} rows={4} placeholder="Describe the work and relevant safety details. Avoid personal document numbers." required/></label>
    <button className="btn" type="submit" disabled={busy || !services.length}>{busy ? 'Sending…' : 'Send request'}</button>
    <p className="provider-feedback" role="status" aria-live="polite">{message}</p>
    <p className="note">The provider will confirm or suggest another time. No payment is collected here.</p>
  </form>;
}
