'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const kinds = new Set(['safety', 'harassment', 'service_complaint', 'payment_concern', 'other']);

export async function submitTrustReport(formData: FormData) {
  const kind = String(formData.get('report_kind') || '');
  const description = String(formData.get('description') || '').trim();
  const bookingId = String(formData.get('booking_id') || '').trim();
  if (!kinds.has(kind) || description.length < 10 || description.length > 3000 || (bookingId && !/^[0-9a-f-]{36}$/i.test(bookingId))) redirect('/report?error=invalid');
  let saved = false;
  let needsLogin = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) needsLogin = true;
    else {
      const { error } = await supabase.from('trust_reports').insert({
        reporter_id: user.id, report_kind: kind, description, booking_id: bookingId || null,
      });
      saved = !error;
    }
  } catch { saved = false; }
  if (needsLogin) redirect('/login');
  if (saved) revalidatePath('/report');
  redirect(saved ? '/report?submitted=1' : '/report?error=unavailable');
}
