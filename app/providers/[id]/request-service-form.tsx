'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { createBookingAction } from '@/app/booking-actions';
import { KENYAN_LOCATIONS, formatCurrency } from '@/lib/kenya';
import { useToast } from '@/components/ui/toast';

type ServiceOption = { id: string; name: string; starting_price: number | string; currency: string };

export function RequestServiceForm({
  services,
  selectedServiceId = '',
}: {
  services: ServiceOption[];
  selectedServiceId?: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [busy, startTransition] = useTransition();
  const [kind, setKind] = useState<'booking' | 'quotation'>('booking');
  const [serviceId, setServiceId] = useState(selectedServiceId || services[0]?.id || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (selectedServiceId) setServiceId(selectedServiceId);
  }, [selectedServiceId]);

  const minDate = new Date().toISOString().slice(0, 10);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setConfirmation('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const dateValue = String(data.get('preferred_date') || '');
    const timeValue = String(data.get('preferred_time') || '10:00');
    // Kenya uses EAT (UTC+03:00) year-round.
    const instant = new Date(`${dateValue}T${timeValue}:00+03:00`);
    if (!dateValue || !Number.isFinite(instant.getTime()) || instant <= new Date()) {
      setError('Choose a future preferred date and time (East Africa Time).');
      return;
    }

    data.set('request_kind', kind);
    data.set('service_id', serviceId);
    data.set('preferred_at', instant.toISOString());

    startTransition(async () => {
      const result = await createBookingAction(data);
      if (result.error) {
        setError(result.error);
        notify(result.error, 'error');
        return;
      }
      const successText = result.message || 'Service request sent.';
      setConfirmation(successText);
      notify(successText, 'success');
      setDescription('');
      form.reset();
      router.refresh();
    });
  }

  return (
    <form className="ds-form-grid" style={{ gridTemplateColumns: '1fr' }} onSubmit={submit} id="request-form">
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

      {services.length > 0 ? (
        <label className="ds-field">
          Requested service
          <select
            className="ds-select"
            name="service_id"
            required
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            <option value="" disabled>
              Choose a published service
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · From {formatCurrency(service.starting_price, service.currency)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="ds-muted">This provider has no published service to request yet.</p>
      )}

      <div className="ds-form-grid">
        <label className="ds-field">
          Preferred date
          <input className="ds-input" name="preferred_date" type="date" min={minDate} required />
        </label>
        <label className="ds-field">
          Preferred time (EAT)
          <input className="ds-input" name="preferred_time" type="time" defaultValue="10:00" required />
        </label>
      </div>

      <label className="ds-field">
        Your area or neighbourhood
        <input
          className="ds-input"
          name="location"
          list="ds-request-areas"
          maxLength={120}
          minLength={2}
          placeholder="e.g. Kilimani, Nairobi"
          required
        />
        <datalist id="ds-request-areas">
          {KENYAN_LOCATIONS.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
        <span className="ds-field-hint">
          Share a neighbourhood at this stage — avoid full street addresses, ID numbers, or passwords.
        </span>
      </label>

      <label className="ds-field">
        Describe the job or issue
        <textarea
          className="ds-textarea"
          name="description"
          minLength={10}
          maxLength={2000}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Explain what needs to be done, relevant measurements, or access notes..."
          required
        />
        <span className="ds-field-hint">{description.length}/2000 characters</span>
      </label>

      <button className="ds-btn ds-btn-amber ds-btn-full" type="submit" disabled={busy || !services.length}>
        {busy ? 'Sending request…' : kind === 'quotation' ? 'Request written quote' : 'Send booking request'}
      </button>

      {error && (
        <div className="ds-alert ds-alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {confirmation && (
        <div className="ds-alert ds-alert-success" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div style={{ display: 'grid', gap: 6 }}>
            <span>{confirmation}</span>
            <Link href="/dashboard/customer" style={{ fontWeight: 700, textDecoration: 'underline' }}>
              Track status in your Customer Dashboard →
            </Link>
          </div>
        </div>
      )}

      <div className="ds-alert ds-alert-info" style={{ fontSize: '0.84rem' }}>
        <Info size={16} aria-hidden="true" />
        <span>
          Doorstep does not collect online M-Pesa or card payments yet. Agree on final scope and payment method
          directly after the professional confirms.
        </span>
      </div>

      <p className="ds-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={14} aria-hidden="true" />
        Contact details stay protected inside your request thread.
      </p>
    </form>
  );
}
