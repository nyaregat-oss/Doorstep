'use client';

import { FormEvent, useState } from 'react';

export function SampleBookingForm({ services }: { services: Array<{ name: string; price: number; currency: string }> }) {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) return <p className="auth-message" role="status">Preview only: no booking request was saved or sent.</p>;
  return <form onSubmit={submit}>
    <label>Service<select required defaultValue="">{<option value="" disabled>Choose a sample service</option>}{services.map((service) => <option key={service.name}>{service.name} — {service.currency} {service.price.toLocaleString('en-KE')}</option>)}</select></label>
    <label>Preferred date<input type="date" min={new Date().toISOString().slice(0, 10)} required/></label>
    <label>What do you need?<textarea rows={4} maxLength={1000} required/></label>
    <button className="btn" type="submit">Preview booking request</button>
    <p className="note">This is a sample profile. Your request is not transmitted or saved.</p>
  </form>;
}
