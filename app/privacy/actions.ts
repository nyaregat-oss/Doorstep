'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const requestKinds = new Set(['access', 'correction', 'objection', 'restriction', 'portability', 'erasure', 'other']);

export async function submitPrivacyRequest(formData: FormData) {
  const kind = String(formData.get('request_kind') || '');
  const details = String(formData.get('details') || '').trim();
  if (!requestKinds.has(kind) || details.length > 1200) redirect('/privacy?error=invalid');
  let saved = false;
  let needsLogin = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) needsLogin = true;
    else {
      const { error } = await supabase.from('privacy_requests').insert({
        subject_id: user.id, request_kind: kind, details,
      });
      saved = !error;
    }
  } catch { saved = false; }
  if (needsLogin) redirect('/login');
  if (saved) revalidatePath('/privacy');
  redirect(saved ? '/privacy?submitted=1' : '/privacy?error=unavailable');
}
