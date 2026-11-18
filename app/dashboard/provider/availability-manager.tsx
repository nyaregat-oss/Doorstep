'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveAvailabilityAction } from './actions';

type Availability = { weekday: number; is_open: boolean; start_time: string | null; end_time: string | null };
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityManager({ items, loadError }: { items: Availability[]; loadError: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [feedback, setFeedback] = useState('');
  const [openDays, setOpenDays] = useState<Record<number, boolean>>(() => Object.fromEntries(weekdays.map((_, day) => [day, items.find((item) => item.weekday === day)?.is_open ?? false])));
  const schedules = Object.fromEntries(items.map((item) => [item.weekday, item]));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set('is_open', String(openDays[Number(data.get('weekday'))]));
    startTransition(async () => {
      const result = await saveAvailabilityAction(data);
      setFeedback(result.error || result.message || '');
      if (!result.error) router.refresh();
    });
  }

  return <section className="card provider-panel">
    <div className="panel-heading"><div><h2>Weekly availability</h2><p className="muted">Hours use East Africa Time (Africa/Nairobi). Closed days stay hidden from customers.</p></div></div>
    {loadError && <p className="auth-error" role="alert">Availability could not load. Apply the portfolio and availability migration.</p>}
    <div className="availability-list">{weekdays.map((name, weekday) => {
      const schedule = schedules[weekday] as Availability | undefined;
      return <form className="availability-day" key={name} onSubmit={save}>
        <input type="hidden" name="weekday" value={weekday}/>
        <strong>{name}</strong>
        <label className="chk2"><input type="checkbox" checked={openDays[weekday]} onChange={(event) => setOpenDays((previous) => ({ ...previous, [weekday]: event.target.checked }))}/>Open</label>
        <label>From<input type="time" name="start_time" defaultValue={schedule?.start_time?.slice(0, 5) || '09:00'} disabled={!openDays[weekday]}/></label>
        <label>Until<input type="time" name="end_time" defaultValue={schedule?.end_time?.slice(0, 5) || '17:00'} disabled={!openDays[weekday]}/></label>
        <button className="btn ghost small" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save day'}</button>
      </form>;
    })}</div>
    <p className="provider-feedback" role="status" aria-live="polite">{feedback}</p>
  </section>;
}
