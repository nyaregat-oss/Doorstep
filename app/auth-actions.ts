'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail, normalizeEmail } from '@/lib/auth-validation';
import { categories } from '@/lib/catalog';

type FormState = { error?: string; message?: string };
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function registerAction(_state: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get('full_name') || '').trim();
  const email = normalizeEmail(formData.get('email'));
  const password = String(formData.get('password') || '');
  const role = formData.get('role') === 'provider' ? 'provider' : 'customer';
  const phone = String(formData.get('phone') || '').trim();
  const businessName = String(formData.get('business_name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const location = String(formData.get('location') || '').trim();
  if (fullName.length < 2 || fullName.length > 120 || !isValidEmail(email) || password.length < 8 || password.length > 128) return { error: 'Enter your name, a valid email, and a password between 8 and 128 characters.' };
  if (phone.length > 32 || (phone && (!/^\+?[0-9 ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15))) return { error: 'Enter a valid phone number, or leave the field blank.' };
  if (role === 'provider' && (businessName.length < 2 || businessName.length > 120 || location.length < 2 || location.length > 160 || !categories.some(([name]) => name === category))) return { error: 'Enter your business name, choose a service category, and add your town or area.' };

  let supabase;
  try { supabase = await createClient(); } catch { return { error: 'Doorstep authentication is not configured yet. Add the Supabase settings to .env.local.' }; }
  const { error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(role === 'provider' ? '/dashboard/provider' : '/dashboard/customer')}`,
      data: {
        full_name: fullName,
        phone,
        role,
        business_name: businessName,
        category,
        location,
      },
    },
  }).catch(() => ({ error: new Error('Authentication service unavailable') }));
  if (error) return { error: 'We could not create the account with those details. Check the information and try again.' };
  return redirect('/login?checkEmail=1');
}

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get('email'));
  const password = String(formData.get('password') || '');
  if (!isValidEmail(email) || !password || password.length > 128) return { error: 'Email or password is incorrect, or the email has not been verified.' };
  let supabase;
  try { supabase = await createClient(); } catch { return { error: 'Doorstep authentication is not configured yet. Add the Supabase settings to .env.local.' }; }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }).catch(() => ({ data: { user: null }, error: new Error('Authentication service unavailable') }));
  if (error || !data.user) return { error: 'Email or password is incorrect, or the email has not been verified.' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return redirect(profile?.role === 'provider' ? '/dashboard/provider' : '/dashboard/customer');
}

export async function requestPasswordResetAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get('email'));
  if (!isValidEmail(email)) return { message: 'If an account matches that email, password reset instructions will arrive shortly.' };
  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent('/reset-password?mode=update')}`,
    });
  } catch { /* Keep the same response to avoid revealing account or configuration state. */ }
  return { message: 'If an account matches that email, password reset instructions will arrive shortly.' };
}

export async function updatePasswordAction(_state: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get('password') || '');
  if (password.length < 8 || password.length > 128) return { error: 'Choose a password between 8 and 128 characters.' };
  let supabase;
  try { supabase = await createClient(); } catch { return { error: 'The password reset session is unavailable. Request a new reset email.' }; }
  const { error } = await supabase.auth.updateUser({ password }).catch(() => ({ error: new Error('Authentication service unavailable') }));
  if (error) return { error: 'We could not update the password. Request a new reset email and try again.' };
  return { message: 'Your password has been updated. You can now sign in.' };
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect('/login?signout=0');
  redirect('/');
}
