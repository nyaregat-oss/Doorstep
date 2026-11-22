import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProviderDashboard, type ProviderBooking, type ProviderNotification, type ProviderReview } from './provider-dashboard';
import { logoutAction } from '../../auth-actions';

export default async function ProviderPage() {
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
  const { data: account } = await supabase.from('profiles').select('role, full_name, phone').eq('id', user.id).maybeSingle();
  if (account?.role !== 'provider') redirect('/dashboard/customer');

  let providerData: Record<string, unknown> | null = null;
  const enhancedProvider = await supabase
    .from('provider_profiles')
    .select('profile_id, business_name, category_id, location, bio, years_experience, verified, paused, headline, skills')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (enhancedProvider.error) {
    const baseProvider = await supabase
      .from('provider_profiles')
      .select('profile_id, business_name, category_id, location, bio, years_experience, verified, paused')
      .eq('profile_id', user.id)
      .maybeSingle();
    providerData = (baseProvider.data as unknown as Record<string, unknown>) || null;
  } else {
    providerData = (enhancedProvider.data as unknown as Record<string, unknown>) || null;
  }

  if (!providerData) {
    return (
      <main className="ds-container ds-section">
        <section className="ds-card ds-setup-card">
          <h1>Business profile unavailable</h1>
          <p className="ds-muted">
            The provider profile could not be loaded. Apply the foundation migration and sign in again.
          </p>
          <form action={logoutAction}>
            <button className="ds-btn ds-btn-secondary" type="submit">
              Log out
            </button>
          </form>
        </section>
      </main>
    );
  }

  const [
    categoriesResult,
    servicesResult,
    portfolioResult,
    availabilityResult,
    bookingsResult,
    notificationsResult,
    serviceCenterResult,
  ] = await Promise.all([
    supabase.from('categories').select('id, name').eq('active', true).order('sort_order'),
    supabase
      .from('services')
      .select('id, name, description, starting_price, currency, active')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('portfolio_items')
      .select('id, storage_path, caption')
      .eq('provider_id', user.id)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('availability')
      .select('weekday, is_open, start_time, end_time')
      .eq('provider_id', user.id)
      .order('weekday'),
    supabase
      .from('bookings')
      .select(
        'id, customer_id, customer_display_name, request_kind, description, location, preferred_at, proposed_at, status, created_at, services(name), messages(id, sender_id, recipient_id, body, read_at, created_at), quotations(id, amount, currency, message, status)',
      )
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('id, body, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('provider_service_centers').select('latitude, longitude').eq('provider_id', user.id).maybeSingle(),
  ]);

  const categoryId = typeof providerData.category_id === 'string' ? providerData.category_id : null;
  const categoryReview = categoryId
    ? await supabase
        .from('category_compliance')
        .select('state, required_verification_kinds')
        .eq('category_id', categoryId)
        .maybeSingle()
    : { data: null, error: null };

  let reviews: ProviderReview[] = [];
  try {
    const reviewsRes = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });
    if (!reviewsRes.error && reviewsRes.data) {
      reviews = reviewsRes.data as ProviderReview[];
    }
  } catch {
    reviews = [];
  }

  return (
    <ProviderDashboard
      accountName={account?.full_name || user.email || 'Provider'}
      profile={{
        profile_id: String(providerData.profile_id),
        business_name: String(providerData.business_name || ''),
        category_id: categoryId,
        location: String(providerData.location || ''),
        bio: String(providerData.bio || ''),
        years_experience: Number(providerData.years_experience || 0),
        verified: Boolean(providerData.verified),
        paused: Boolean(providerData.paused),
        headline: typeof providerData.headline === 'string' ? providerData.headline : '',
        skills: Array.isArray(providerData.skills) ? (providerData.skills as string[]) : [],
      }}
      serviceCenter={serviceCenterResult.data || null}
      categories={categoriesResult.data || []}
      services={servicesResult.data || []}
      categoryError={Boolean(categoriesResult.error)}
      categoryReviewState={categoryReview.data?.state || 'unreviewed'}
      requiredVerificationKinds={categoryReview.data?.required_verification_kinds || []}
      databaseError={Boolean(servicesResult.error)}
      portfolio={portfolioResult.data || []}
      portfolioError={Boolean(portfolioResult.error)}
      availability={availabilityResult.data || []}
      availabilityError={Boolean(availabilityResult.error)}
      bookings={(bookingsResult.data || []) as unknown as ProviderBooking[]}
      bookingsError={Boolean(bookingsResult.error)}
      notifications={(notificationsResult.data || []) as ProviderNotification[]}
      reviews={reviews}
    />
  );
}
