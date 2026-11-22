'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isCurrencyCode, parseStartingPrice } from '@/lib/marketplace-validation';
import { parseApproximateCoordinatePair } from '@/lib/location';

export type ProviderActionResult = { error?: string; message?: string };

async function getProviderContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'provider') return null;
  return { supabase, providerId: user.id };
}

export async function saveProviderProfileAction(formData: FormData): Promise<ProviderActionResult> {
  const businessName = String(formData.get('business_name') || '').trim();
  const categoryId = String(formData.get('category_id') || '').trim() || null;
  const location = String(formData.get('location') || '').trim();
  const bio = String(formData.get('bio') || '').trim();
  const headline = String(formData.get('headline') || '').trim();
  const rawSkills = String(formData.get('skills') || '');
  const skills = [...new Set(rawSkills.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 12);
  const paused = formData.get('paused') === 'true';
  const yearsExperience = Number(formData.get('years_experience') || 0);
  const hadServiceCenter = formData.get('service_center_exists') === 'true';
  const center = parseApproximateCoordinatePair(formData.get('service_latitude'), formData.get('service_longitude'));

  if (
    businessName.length < 2 ||
    businessName.length > 120 ||
    location.length < 2 ||
    location.length > 160 ||
    bio.length > 2000 ||
    headline.length > 140 ||
    !Number.isInteger(yearsExperience) ||
    yearsExperience < 0 ||
    yearsExperience > 80
  ) {
    return { error: 'Check the business name, headline, location, description, and experience fields.' };
  }
  if (center.error) return { error: center.error };

  try {
    const context = await getProviderContext();
    if (!context) return { error: 'Sign in with a provider account to edit this profile.' };

    const updateEnhanced = await context.supabase
      .from('provider_profiles')
      .update({
        business_name: businessName,
        category_id: categoryId,
        location,
        bio,
        years_experience: yearsExperience,
        paused,
        headline,
        skills,
      })
      .eq('profile_id', context.providerId)
      .select('profile_id')
      .maybeSingle();

    if (updateEnhanced.error) {
      // Fallback if optional enhancement columns (headline/skills) are not migrated yet.
      const fallback = await context.supabase
        .from('provider_profiles')
        .update({
          business_name: businessName,
          category_id: categoryId,
          location,
          bio,
          years_experience: yearsExperience,
          paused,
        })
        .eq('profile_id', context.providerId)
        .select('profile_id')
        .maybeSingle();

      if (fallback.error || !fallback.data) {
        return { error: 'We could not save your profile. Check that the database migration is applied and try again.' };
      }
    } else if (!updateEnhanced.data) {
      return { error: 'We could not find your business profile.' };
    }

    const centerResult = center.coordinates
      ? await context.supabase.from('provider_service_centers').upsert(
          {
            provider_id: context.providerId,
            latitude: center.coordinates.latitude,
            longitude: center.coordinates.longitude,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'provider_id' },
        )
      : hadServiceCenter
        ? await context.supabase.from('provider_service_centers').delete().eq('provider_id', context.providerId)
        : { error: null };

    revalidatePath('/dashboard/provider');
    revalidatePath('/browse');
    revalidatePath(`/providers/${context.providerId}`);
    if (centerResult.error) {
      return {
        error:
          'Your profile was saved, but the approximate service-area center was not. Apply the nearby-discovery migration and try again.',
      };
    }
    return { message: 'Business profile saved.' };
  } catch {
    return { error: 'We could not reach the database. Check your Supabase setup and try again.' };
  }
}

export async function saveServiceAction(formData: FormData): Promise<ProviderActionResult> {
  const id = String(formData.get('id') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const rawPrice = formData.get('starting_price');
  const startingPrice = parseStartingPrice(rawPrice);
  const currency = String(formData.get('currency') || 'KES').trim().toUpperCase();
  if (name.length < 3 || name.length > 100 || description.length > 2000 || startingPrice === null || !isCurrencyCode(currency)) {
    return {
      error: 'Enter a service name (3–100 characters), non-negative starting price, three-letter currency, and description under 2,000 characters.',
    };
  }
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return { error: 'That service could not be found.' };

  try {
    const context = await getProviderContext();
    if (!context) return { error: 'Sign in with a provider account to manage services.' };
    if (id) {
      const { data, error } = await context.supabase
        .from('services')
        .update({ name, description, starting_price: startingPrice, currency })
        .eq('id', id)
        .eq('provider_id', context.providerId)
        .select('id')
        .maybeSingle();
      if (error || !data) {
        return {
          error:
            'We could not update this service. Check that it belongs to your account and that your category review and required credential checks are approved.',
        };
      }
    } else {
      const { error } = await context.supabase
        .from('services')
        .insert({ name, description, starting_price: startingPrice, currency, active: true, provider_id: context.providerId });
      if (error) {
        return {
          error:
            'We could not add this service. Confirm the database migrations are applied and the category review and required credential checks are approved.',
        };
      }
    }
    revalidatePath('/dashboard/provider');
    revalidatePath('/browse');
    return { message: id ? 'Service updated.' : 'Service added.' };
  } catch {
    return { error: 'We could not reach the database. Check your Supabase setup and try again.' };
  }
}

export async function setServiceActiveAction(formData: FormData): Promise<ProviderActionResult> {
  const id = String(formData.get('id') || '').trim();
  const activeValue = formData.get('active');
  if (activeValue !== 'true' && activeValue !== 'false') return { error: 'Choose whether to publish or pause this service.' };
  const active = activeValue === 'true';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'That service could not be found.' };
  try {
    const context = await getProviderContext();
    if (!context) return { error: 'Sign in with a provider account to manage services.' };
    const { data, error } = await context.supabase
      .from('services')
      .update({ active })
      .eq('id', id)
      .eq('provider_id', context.providerId)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      return {
        error:
          'We could not change this service. Check that it still exists and that the category review and required credential checks are approved.',
      };
    }
    revalidatePath('/dashboard/provider');
    revalidatePath('/browse');
    return { message: active ? 'Service published.' : 'Service paused.' };
  } catch {
    return { error: 'We could not reach the database. Try again.' };
  }
}

export async function deleteServiceAction(formData: FormData): Promise<ProviderActionResult> {
  const id = String(formData.get('id') || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'That service could not be found.' };
  try {
    const context = await getProviderContext();
    if (!context) return { error: 'Sign in with a provider account to manage services.' };
    const { data, error } = await context.supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('provider_id', context.providerId)
      .select('id')
      .maybeSingle();
    if (error || !data) return { error: 'We could not delete this service. Check that it still exists and belongs to your account.' };
    revalidatePath('/dashboard/provider');
    revalidatePath('/browse');
    return { message: 'Service deleted.' };
  } catch {
    return { error: 'We could not reach the database. Try again.' };
  }
}

export async function addPortfolioItemAction(formData: FormData): Promise<ProviderActionResult> {
  const storagePath = String(formData.get('storage_path') || '').trim();
  const caption = String(formData.get('caption') || '').trim();
  if (caption.length > 240 || storagePath.length > 240) return { error: 'Use a caption under 240 characters.' };
  try {
    const context = await getProviderContext();
    if (!context) return { error: 'Sign in with a provider account to add portfolio images.' };
    if (!storagePath.startsWith(`${context.providerId}/`) || storagePath.includes('..')) {
      return { error: 'That image path is not allowed.' };
    }
    const { error } = await context.supabase
      .from('portfolio_items')
      .insert({ provider_id: context.providerId, storage_path: storagePath, caption, sort_order: 0 });
    if (error) return { error: 'We could not add this image. Check that the portfolio migration is applied.' };
    revalidatePath('/dashboard/provider');
    revalidatePath(`/providers/${context.providerId}`);
    return { message: 'Portfolio image added.' };
  } catch {
    return { error: 'We could not reach the database. Check your Supabase setup and try again.' };
  }
}

export async function deletePortfolioItemAction(formData: FormData): Promise<ProviderActionResult> {
  const id = String(formData.get('id') || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'That portfolio image could not be found.' };
  try {
    const context = await getProviderContext();
    if (!context) return { error: 'Sign in with a provider account to manage portfolio images.' };
    const { data: item, error: itemError } = await context.supabase
      .from('portfolio_items')
      .select('storage_path')
      .eq('id', id)
      .eq('provider_id', context.providerId)
      .maybeSingle();
    if (itemError || !item) return { error: 'That portfolio image could not be found.' };
    const { error: storageError } = await context.supabase.storage
      .from('doorstep-provider-portfolio')
      .remove([item.storage_path]);
    if (storageError) return { error: 'We could not remove the stored image. Try again.' };
    const { error } = await context.supabase
      .from('portfolio_items')
      .delete()
      .eq('id', id)
      .eq('provider_id', context.providerId);
    if (error) return { error: 'The image file was removed, but its portfolio record could not be deleted.' };
    revalidatePath('/dashboard/provider');
    revalidatePath(`/providers/${context.providerId}`);
    return { message: 'Portfolio image removed.' };
  } catch {
    return { error: 'We could not reach the database. Try again.' };
  }
}

export async function saveAvailabilityAction(formData: FormData): Promise<ProviderActionResult> {
  const weekday = Number(formData.get('weekday'));
  const isOpen = formData.get('is_open') === 'true';
  const startTime = String(formData.get('start_time') || '');
  const endTime = String(formData.get('end_time') || '');
  if (
    !Number.isInteger(weekday) ||
    weekday < 0 ||
    weekday > 6 ||
    (isOpen && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime))
  ) {
    return { error: 'Choose a valid day and a start time earlier than the end time.' };
  }
  try {
    const context = await getProviderContext();
    if (!context) return { error: 'Sign in with a provider account to set availability.' };
    const { error } = await context.supabase.from('availability').upsert(
      {
        provider_id: context.providerId,
        weekday,
        is_open: isOpen,
        start_time: isOpen ? startTime : null,
        end_time: isOpen ? endTime : null,
        timezone: 'Africa/Nairobi',
      },
      { onConflict: 'provider_id,weekday' },
    );
    if (error) return { error: 'We could not save availability. Check that the portfolio and availability migration is applied.' };
    revalidatePath('/dashboard/provider');
    revalidatePath(`/providers/${context.providerId}`);
    revalidatePath('/browse');
    return { message: 'Availability saved.' };
  } catch {
    return { error: 'We could not reach the database. Try again.' };
  }
}
