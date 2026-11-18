'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type BookingActionResult = { error?: string; message?: string };

async function signedIn() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return { supabase, user, role: profile?.role as string | undefined };
}

function refreshDashboards() {
  revalidatePath('/dashboard/customer');
  revalidatePath('/dashboard/provider');
}

export async function createBookingAction(formData: FormData): Promise<BookingActionResult> {
  const serviceId = String(formData.get('service_id') || '').trim();
  const kind = String(formData.get('request_kind') || 'booking');
  const description = String(formData.get('description') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const preferredAt = String(formData.get('preferred_at') || '').trim();
  const date = new Date(preferredAt);
  if (!/^[0-9a-f-]{36}$/i.test(serviceId) || !['booking', 'quotation'].includes(kind) || description.length < 10 || description.length > 2000 || location.length < 2 || location.length > 120 || !Number.isFinite(date.getTime()) || date <= new Date()) {
    return { error: 'Add a clear description, location, and future date for your request.' };
  }
  try {
    const context = await signedIn();
    if (!context) return { error: 'Sign in as a customer to send a service request.' };
    if (context.role !== 'customer') return { error: 'Only customer accounts can request a service.' };
    const { data: service, error: serviceError } = await context.supabase.from('services').select('provider_id').eq('id', serviceId).eq('active', true).maybeSingle();
    if (serviceError || !service) return { error: 'This service is no longer available.' };
    const { error } = await context.supabase.from('bookings').insert({
      customer_id: context.user.id, provider_id: service.provider_id, service_id: serviceId,
      request_kind: kind, description, location, preferred_at: date.toISOString(),
    });
    if (error) return { error: 'We could not send your request. Check that the latest database migrations are applied.' };
    refreshDashboards();
    return { message: kind === 'quotation' ? 'Quotation request sent.' : 'Booking request sent.' };
  } catch {
    return { error: 'We could not reach the database. Check your Supabase setup and try again.' };
  }
}

export async function respondToBookingAction(formData: FormData): Promise<BookingActionResult> {
  const bookingId = String(formData.get('booking_id') || '');
  const status = String(formData.get('status') || '');
  const rawDate = String(formData.get('proposed_at') || '');
  const proposedAt = rawDate ? new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawDate) ? `${rawDate}:00+03:00` : rawDate) : null;
  if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !['accepted', 'declined', 'proposed', 'in_progress', 'completed', 'cancelled'].includes(status) || (status === 'proposed' && (!proposedAt || !Number.isFinite(proposedAt.getTime()) || proposedAt <= new Date()))) return { error: 'Choose a valid status and future alternative date, if needed.' };
  try {
    const context = await signedIn();
    if (!context) return { error: 'Sign in to update this request.' };
    const { error } = await context.supabase.rpc('respond_to_booking', {
      p_booking_id: bookingId, p_next: status,
      p_proposed_at: status === 'proposed' ? proposedAt?.toISOString() : null,
      p_proposed_timezone: 'Africa/Nairobi',
    });
    if (error) return { error: error.message.includes('not allowed') || error.message.includes('future') ? error.message : 'This request could not be updated. It may have changed or the migration is not applied.' };
    refreshDashboards();
    return { message: 'Request updated.' };
  } catch { return { error: 'We could not reach the database. Try again.' }; }
}

export async function sendQuotationAction(formData: FormData): Promise<BookingActionResult> {
  const bookingId = String(formData.get('booking_id') || '');
  const amount = Number(formData.get('amount'));
  const currency = String(formData.get('currency') || 'KES').trim().toUpperCase();
  const message = String(formData.get('message') || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !Number.isFinite(amount) || amount < 0 || amount > 9999999999.99 || !/^[A-Z]{3}$/.test(currency) || message.length < 5 || message.length > 2000) return { error: 'Enter a valid amount, currency, and a short note.' };
  try {
    const context = await signedIn();
    if (!context || context.role !== 'provider') return { error: 'Sign in with a provider account to send a quote.' };
    const { data: booking, error: bookingError } = await context.supabase.from('bookings').select('customer_id').eq('id', bookingId).eq('provider_id', context.user.id).eq('request_kind', 'quotation').eq('status', 'pending').maybeSingle();
    if (bookingError || !booking) return { error: 'This quotation request is no longer open.' };
    const { error } = await context.supabase.from('quotations').insert({ booking_id: bookingId, provider_id: context.user.id, customer_id: booking.customer_id, amount, currency, message });
    if (error) return { error: 'We could not send the quote. One quote may already exist for this request.' };
    refreshDashboards();
    return { message: 'Quotation sent.' };
  } catch { return { error: 'We could not reach the database. Try again.' }; }
}

export async function respondToQuotationAction(formData: FormData): Promise<BookingActionResult> {
  const id = String(formData.get('quotation_id') || '');
  const accept = String(formData.get('accept')) === 'true';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Quotation not found.' };
  try {
    const context = await signedIn();
    if (!context || context.role !== 'customer') return { error: 'Sign in as a customer to respond to a quote.' };
    const { error } = await context.supabase.rpc('respond_to_quotation', { p_quotation_id: id, p_accept: accept });
    if (error) return { error: error.message.includes('passed') ? error.message : 'This quotation is no longer available.' };
    refreshDashboards();
    return { message: accept ? 'Quotation accepted.' : 'Quotation declined.' };
  } catch { return { error: 'We could not reach the database. Try again.' }; }
}

export async function sendMessageAction(formData: FormData): Promise<BookingActionResult> {
  const bookingId = String(formData.get('booking_id') || '');
  const recipientId = String(formData.get('recipient_id') || '');
  const body = String(formData.get('body') || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !/^[0-9a-f-]{36}$/i.test(recipientId) || body.length < 1 || body.length > 2000) return { error: 'Write a message under 2,000 characters.' };
  try {
    const context = await signedIn();
    if (!context) return { error: 'Sign in to message the other participant.' };
    const { error } = await context.supabase.from('messages').insert({ booking_id: bookingId, sender_id: context.user.id, recipient_id: recipientId, body });
    if (error) return { error: 'Message could not be sent.' };
    refreshDashboards();
    return { message: 'Message sent.' };
  } catch { return { error: 'We could not reach the database. Try again.' }; }
}

export async function markNotificationReadAction(formData: FormData): Promise<BookingActionResult> {
  const id = String(formData.get('notification_id') || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Notification not found.' };
  try {
    const context = await signedIn();
    if (!context) return { error: 'Sign in to update notifications.' };
    const { error } = await context.supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
    if (error) return { error: 'Notification could not be updated.' };
    refreshDashboards();
    return { message: 'Notification marked as read.' };
  } catch { return { error: 'We could not reach the database. Try again.' }; }
}
