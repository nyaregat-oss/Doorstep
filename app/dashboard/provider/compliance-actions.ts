'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function submitVerificationAction(formData: FormData) {
  const kind = String(formData.get('kind') || '');
  const issuer = String(formData.get('issuing_authority') || '').trim();
  const credential = String(formData.get('credential_name') || '').trim();
  const number = String(formData.get('credential_number') || '').trim();
  const scope = String(formData.get('scope') || '').trim();
  const rawExpiry = String(formData.get('expires_on') || '').trim();
  const file = formData.get('evidence');
  const allowed = new Set(['qualification', 'professional_licence', 'reference']);
  if (!allowed.has(kind) || issuer.length < 2 || issuer.length > 200 || credential.length < 2 || credential.length > 200 || number.length > 120 || (kind === 'professional_licence' && !number) || scope.length > 500 || (rawExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(rawExpiry))) redirect('/dashboard/provider/compliance?error=invalid');

  let saved = false;
  let errorCode = 'unavailable';
  let supabase: Awaited<ReturnType<typeof createClient>> | undefined;
  let evidencePath: string | null = null;
  try {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) errorCode = 'login';
    else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile?.role !== 'provider') errorCode = 'role';
      else if (file instanceof File && file.size > 0) {
      const mimeToExt: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
      const ext = mimeToExt[file.type];
        if (!ext || file.size > 10 * 1024 * 1024) errorCode = 'file';
        else {
          evidencePath = `${user.id}/${kind}/${crypto.randomUUID()}.${ext}`;
          const upload = await supabase.storage.from('doorstep-verification-evidence').upload(evidencePath, file, { contentType: file.type, upsert: false });
          if (upload.error) errorCode = 'file';
        }
      }
      if (profile?.role === 'provider' && errorCode === 'unavailable') {
        const { error } = await supabase.from('worker_verifications').insert({
          provider_id: user.id, kind, issuing_authority: issuer, credential_name: credential,
          credential_number: number || null, scope, expires_on: rawExpiry || null, evidence_path: evidencePath,
        });
        saved = !error;
        if (!saved && evidencePath) await supabase.storage.from('doorstep-verification-evidence').remove([evidencePath]);
      }
    }
  } catch {
    if (evidencePath && supabase) await supabase.storage.from('doorstep-verification-evidence').remove([evidencePath]);
  }
  if (saved) {
    revalidatePath('/dashboard/provider/compliance');
    redirect('/dashboard/provider/compliance?submitted=1');
  }
  if (errorCode === 'login') redirect('/login');
  if (errorCode === 'role') redirect('/dashboard');
  redirect(`/dashboard/provider/compliance?error=${errorCode}`);
}
