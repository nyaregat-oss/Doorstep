'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { saveAvailabilityAction } from './actions';
import { useToast } from '@/components/ui/toast';

type Availability = { weekday: number; is_open: boolean; start_time: string | null; end_time: string | null };
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityManager({ items, loadError }: { items: Availability[]; loadError: boolean }) {
  const router = useRouter();
  const { notify } = useToast();
  const [busy, startTransition] = useTransition();
  const [feedback, setFeedback] = useState('');
  const [openDays, setOpenDays] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(weekdays.map((_, day) => [day, items.find((item) => item.weekday === day)?.is_open ?? false])),
  );
  const schedules = Object.fromEntries(items.map((item) => [item.weekday, item]));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const dayIdx = Number(data.get('weekday'));
    data.set('is_open', String(openDays[dayIdx]));
    startTransition(async () => {
      const result = await saveAvailabilityAction(data);
      const msg = result.error || result.message || '';
      setFeedback(msg);
      notify(msg, result.error ? 'error' : 'success');
      if (!result.error) router.refresh();
    });
  }

  return (
    <section className="ds-card ds-panel">
      <div className="ds-panel-head">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={20} aria-hidden="true" />
            Weekly availability
          </h2>
          <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
            Hours are displayed in East Africa Time (Africa/Nairobi). Closed days remain hidden from customer discovery.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="ds-alert ds-alert-error" role="alert">
          <span>Availability could not load. Apply the portfolio and availability migration.</span>
        </div>
      )}

      <div>
        {weekdays.map((name, weekday) => {
          const schedule = schedules[weekday] as Availability | undefined;
          const isOpen = openDays[weekday];
          return (
            <form className="ds-avail-row" key={name} onSubmit={save}>
              <input type="hidden" name="weekday" value={weekday} />
              <strong>{name}</strong>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(event) => setOpenDays((previous) => ({ ...previous, [weekday]: event.target.checked }))}
                />
                <span>{isOpen ? 'Open' : 'Closed'}</span>
              </label>

              <label className="ds-field" style={{ fontSize: '0.82rem' }}>
                From
                <input
                  className="ds-input"
                  type="time"
                  name="start_time"
                  defaultValue={schedule?.start_time?.slice(0, 5) || '08:00'}
                  disabled={!isOpen}
                />
              </label>

              <label className="ds-field" style={{ fontSize: '0.82rem' }}>
                Until
                <input
                  className="ds-input"
                  type="time"
                  name="end_time"
                  defaultValue={schedule?.end_time?.slice(0, 5) || '17:00'}
                  disabled={!isOpen}
                />
              </label>

              <button className="ds-btn ds-btn-secondary ds-btn-sm" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save day'}
              </button>
            </form>
          );
        })}
      </div>

      {feedback && (
        <p className="ds-muted" role="status" aria-live="polite" style={{ fontSize: '0.9rem' }}>
          {feedback}
        </p>
      )}
    </section>
  );
}
