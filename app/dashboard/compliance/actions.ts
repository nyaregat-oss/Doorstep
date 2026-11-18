'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data, error } = await supabase.rpc('is_compliance_admin');
  if (error || !data) redirect('/dashboard');
  return { supabase, user };
}

function finish(ok: boolean, kind: string) {
  if (ok) revalidatePath('/dashboard/compliance');
  redirect(`/dashboard/compliance?${kind}=${ok ? 'saved' : 'error'}`);
}

export async function reviewCategoryAction(formData: FormData) {
  const id = String(formData.get('category_id') || '');
  const state = String(formData.get('state') || '');
  const reference = String(formData.get('review_reference') || '').trim().slice(0, 500);
  const allowedKinds = new Set(['identity', 'qualification', 'professional_licence', 'reference']);
  const submittedKinds = String(formData.get('required_verification_kinds') || '')
    .split(',').map((kind) => kind.trim()).filter(Boolean);
  if (submittedKinds.some((kind) => !allowedKinds.has(kind))) finish(false, 'category');
  const requiredKinds = [...new Set(submittedKinds)];
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['pending', 'approved', 'blocked'].includes(state)) finish(false, 'category');
  if (state !== 'pending' && !reference) finish(false, 'category');
  const { supabase, user } = await adminClient();
  let saved = false;
  try {
    const reviewedAt = state === 'pending' ? null : new Date().toISOString();
    const { error } = await supabase.from('category_compliance').update({
      state, required_verification_kinds: requiredKinds, review_reference: reference || null,
      reviewed_by: state === 'pending' ? null : user.id, reviewed_at: reviewedAt, updated_at: new Date().toISOString(),
    }).eq('category_id', id);
    saved = !error;
  } catch { saved = false; }
  if (saved) {
    revalidatePath('/browse');
    revalidatePath('/dashboard/provider');
  }
  finish(saved, 'category');
}

export async function reviewVerificationAction(formData: FormData) {
  const id = String(formData.get('verification_id') || '');
  const status = String(formData.get('status') || '');
  const reviewerNote = String(formData.get('reviewer_note') || '').trim().slice(0, 1000);
  const providerMessage = String(formData.get('provider_message') || '').trim().slice(0, 1000);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['approved', 'rejected', 'suspended'].includes(status)) finish(false, 'verification');
  const { supabase } = await adminClient();
  let saved = false;
  try {
    const { error } = await supabase.rpc('review_worker_verification', {
      p_verification_id: id,
      p_status: status,
      p_internal_note: reviewerNote || null,
      p_provider_message: providerMessage || null,
    });
    saved = !error;
  } catch { saved = false; }
  finish(saved, 'verification');
}

export async function reviewPrivacyRequestAction(formData: FormData) {
  const id = String(formData.get('request_id') || '');
  const status = String(formData.get('status') || '');
  const responseNote = String(formData.get('response_note') || '').trim().slice(0, 1200);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['in_review', 'fulfilled', 'declined', 'needs_information'].includes(status)) finish(false, 'privacy');
  const { supabase, user } = await adminClient();
  let saved = false;
  try {
    const { error } = await supabase.from('privacy_requests').update({
      status, response_note: responseNote || null, handled_by: user.id,
      handled_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id);
    saved = !error;
  } catch { saved = false; }
  finish(saved, 'privacy');
}

export async function reviewTrustReportAction(formData: FormData) {
  const id = String(formData.get('report_id') || '');
  const status = String(formData.get('status') || '');
  const responseNote = String(formData.get('response_note') || '').trim().slice(0, 1200);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['in_review', 'resolved', 'referred', 'closed'].includes(status)) finish(false, 'report');
  const { supabase, user } = await adminClient();
  let saved = false;
  try {
    const { error } = await supabase.from('trust_reports').update({
      status, response_note: responseNote || null, handled_by: user.id,
      handled_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id);
    saved = !error;
  } catch { saved = false; }
  finish(saved, 'report');
}
