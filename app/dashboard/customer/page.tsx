import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  CustomerDashboard,
  type CustomerBooking,
  type CustomerNotification,
  type CustomerReview,
  type SavedProviderItem,
} from './customer-dashboard';

export default async function CustomerDashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="ds-container ds-section">
        <section className="ds-card ds-setup-card">
          <span className="ds-eyebrow">Workspace setup</span>
          <h1>Supabase setup needed</h1>
          <p className="ds-muted">
            Add your Supabase project URL and anon key to <code>.env.local</code>, then apply the migrations in{' '}
            <code>supabase/migrations</code>.
          </p>
          <div>
            <Link className="ds-btn ds-btn-primary" href="/">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'provider') redirect('/dashboard/provider');

  const [bookingResult, notificationsResult] = await Promise.all([
    supabase
      .from('bookings')
      .select(
        'id, provider_id, request_kind, description, location, preferred_at, proposed_at, proposed_timezone, status, created_at, services(name), provider_profiles(business_name), messages(id, sender_id, recipient_id, body, read_at, created_at), quotations(id, amount, currency, message, status)',
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('id, kind, body, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  let savedProviders: SavedProviderItem[] = [];
  let reviews: CustomerReview[] = [];
  try {
    const [savedRes, reviewsRes] = await Promise.all([
      supabase
        .from('saved_providers')
        .select('provider_id, created_at, provider_profiles(business_name, location, verified, categories(name))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('id, booking_id, provider_id, rating, comment, created_at, provider_profiles(business_name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false }),
    ]);
    if (!savedRes.error && savedRes.data) {
      savedProviders = savedRes.data as unknown as SavedProviderItem[];
    }
    if (!reviewsRes.error && reviewsRes.data) {
      reviews = reviewsRes.data as unknown as CustomerReview[];
    }
  } catch {
    // Optional tables remain safe when migration hasn't run yet.
  }

  return (
    <CustomerDashboard
      userId={user.id}
      email={user.email || ''}
      fullName={profile?.full_name || ''}
      phone={profile?.phone || ''}
      bookings={(bookingResult.data || []) as unknown as CustomerBooking[]}
      bookingError={Boolean(bookingResult.error)}
      notifications={(notificationsResult.data || []) as CustomerNotification[]}
      notificationError={Boolean(notificationsResult.error)}
      savedProviders={savedProviders}
      reviews={reviews}
    />
  );
}
