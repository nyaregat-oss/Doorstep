'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CustomerActionResult = { error?: string; message?: string; saved?: boolean };

async function getCustomerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return { supabase, user, role: profile?.role as string | undefined };
}

export async function updateCustomerProfileAction(formData: FormData): Promise<CustomerActionResult> {
  const fullName = String(formData.get('full_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();

  if (fullName.length < 2 || fullName.length > 120) {
    return { error: 'Enter your full name between 2 and 120 characters.' };
  }
  if (
    phone.length > 32 ||
    (phone && (!/^\+?[0-9 ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15))
  ) {
    return { error: 'Enter a valid Kenyan or international phone number (e.g. +254 712 345 678), or leave blank.' };
  }

  try {
    const context = await getCustomerContext();
    if (!context) return { error: 'Sign in to update your account settings.' };
    const { error } = await context.supabase
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null })
      .eq('id', context.user.id);
    if (error) return { error: 'Your account settings could not be updated right now.' };
    revalidatePath('/dashboard/customer');
    return { message: 'Account details updated.' };
  } catch {
    return { error: 'Unable to reach the database. Check your Supabase connection.' };
  }
}

export async function toggleSaveProviderAction(formData: FormData): Promise<CustomerActionResult> {
  const providerId = String(formData.get('provider_id') || '').trim();
  const intent = String(formData.get('intent') || 'toggle');
  if (!/^[0-9a-f-]{36}$/i.test(providerId)) {
    return { error: 'Only live Doorstep providers can be saved.' };
  }

  try {
    const context = await getCustomerContext();
    if (!context) return { error: 'Sign in as a customer to save professionals.' };
    if (context.role !== 'customer') return { error: 'Only customer accounts can save professionals.' };

    const { data: existing, error: checkError } = await context.supabase
      .from('saved_providers')
      .select('provider_id')
      .eq('customer_id', context.user.id)
      .eq('provider_id', providerId)
      .maybeSingle();

    if (checkError) {
      return { error: 'Saved providers require the marketplace enhancement migration.' };
    }

    if (existing && intent !== 'save') {
      const { error } = await context.supabase
        .from('saved_providers')
        .delete()
        .eq('customer_id', context.user.id)
        .eq('provider_id', providerId);
      if (error) return { error: 'Could not remove saved professional.' };
      revalidatePath('/dashboard/customer');
      revalidatePath(`/providers/${providerId}`);
      return { message: 'Removed from saved professionals.', saved: false };
    }

    if (!existing && intent !== 'remove') {
      const { error } = await context.supabase
        .from('saved_providers')
        .insert({ customer_id: context.user.id, provider_id: providerId });
      if (error) return { error: 'Could not save professional.' };
      revalidatePath('/dashboard/customer');
      revalidatePath(`/providers/${providerId}`);
      return { message: 'Saved to your professionals list.', saved: true };
    }

    return { saved: Boolean(existing) };
  } catch {
    return { error: 'Unable to update saved professionals right now.' };
  }
}

export async function submitReviewAction(formData: FormData): Promise<CustomerActionResult> {
  const bookingId = String(formData.get('booking_id') || '').trim();
  const providerId = String(formData.get('provider_id') || '').trim();
  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') || '').trim();

  if (
    !/^[0-9a-f-]{36}$/i.test(bookingId) ||
    !/^[0-9a-f-]{36}$/i.test(providerId) ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    comment.length > 1500
  ) {
    return { error: 'Choose a rating from 1 to 5 stars and keep comments under 1,500 characters.' };
  }

  try {
    const context = await getCustomerContext();
    if (!context || context.role !== 'customer') {
      return { error: 'Sign in with your customer account to submit a review.' };
    }

    const { error } = await context.supabase.from('reviews').insert({
      booking_id: bookingId,
      customer_id: context.user.id,
      provider_id: providerId,
      rating,
      comment,
    });

    if (error) {
      return { error: 'Reviews can only be submitted once after a completed booking (and require the latest migration).' };
    }

    revalidatePath('/dashboard/customer');
    revalidatePath('/dashboard/provider');
    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/browse');
    return { message: 'Thank you — your review has been published.' };
  } catch {
    return { error: 'Unable to submit review right now.' };
  }
}
