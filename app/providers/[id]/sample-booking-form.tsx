'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { KENYAN_LOCATIONS, formatCurrency } from '@/lib/kenya';

export function SampleBookingForm({
  services,
  selectedServiceName = '',
}: {
  services: Array<{ name: string; price: number; currency: string }>;
  selectedServiceName?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [kind, setKind] = useState<'booking' | 'quotation'>('booking');
  const [chosenService, setChosenService] = useState(selectedServiceName || services[0]?.name || '');

  useEffect(() => {
    if (selectedServiceName) {
      setChosenService(selectedServiceName);
      setSubmitted(false);
    }
  }, [selectedServiceName]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="ds-alert ds-alert-warning" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>Preview only:</strong> no booking request was saved or sent because this is an illustrative sample
            profile.
          </div>
        </div>
        <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => setSubmitted(false)}>
          Reset preview form
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="ds-form-grid" style={{ gridTemplateColumns: '1fr' }} id="request-form">
      <div className="ds-tabs" role="tablist" aria-label="Request type" style={{ width: '100%' }}>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'booking'}
          className="ds-tab-btn"
          style={{ flex: 1 }}
          onClick={() => setKind('booking')}
        >
          Book a Service
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'quotation'}
          className="ds-tab-btn"
          style={{ flex: 1 }}
          onClick={() => setKind('quotation')}
        >
          Request a Quote
        </button>
      </div>

      <label className="ds-field">
        Service
        <select
          className="ds-select"
          required
          value={chosenService}
          onChange={(event) => setChosenService(event.target.value)}
        >
          <option value="" disabled>
            Choose a sample service
          </option>
          {services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.name} — {formatCurrency(service.price, service.currency)}
            </option>
          ))}
        </select>
      </label>

      <div className="ds-form-grid">
        <label className="ds-field">
          Preferred date
          <input className="ds-input" type="date" min={new Date().toISOString().slice(0, 10)} required />
        </label>
        <label className="ds-field">
          Preferred time (EAT)
          <input className="ds-input" type="time" defaultValue="10:00" required />
        </label>
      </div>

      <label className="ds-field">
        Your area or neighbourhood
        <input
          className="ds-input"
          list="ds-sample-areas"
          placeholder="e.g. Westlands, Nairobi"
          required
        />
        <datalist id="ds-sample-areas">
          {KENYAN_LOCATIONS.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
      </label>

      <label className="ds-field">
        What do you need?
        <textarea
          className="ds-textarea"
          rows={3}
          maxLength={1000}
          placeholder="Describe your job scope..."
          required
        />
      </label>

      <button className="ds-btn ds-btn-amber ds-btn-full" type="submit">
        {kind === 'quotation' ? 'Preview quote request' : 'Preview booking request'}
      </button>

      <div className="ds-alert ds-alert-info" style={{ fontSize: '0.84rem' }}>
        <Info size={16} aria-hidden="true" />
        <span>This is a sample profile preview. Requests here are not saved or transmitted.</span>
      </div>
    </form>
  );
}
