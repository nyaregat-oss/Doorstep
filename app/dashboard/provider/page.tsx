import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProviderDashboard } from './provider-dashboard';
import { logoutAction } from '../../auth-actions';

export default async function ProviderPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <main className="wrap auth-wrap"><a className="logo" href="/"><i/>Doorstep</a><section className="card dash-card"><h1>Supabase setup needed</h1><p>Add your Supabase project URL and anon key to `.env.local`, then apply the migrations in `supabase/migrations`.</p><a className="btn" href="/">Back to home</a></section></main>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: account } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  if (account?.role !== 'provider') redirect('/dashboard/customer');

  const [providerResult, categoriesResult, servicesResult, portfolioResult, availabilityResult, bookingsResult, notificationsResult] = await Promise.all([
    supabase.from('provider_profiles').select('profile_id, business_name, category_id, location, bio, years_experience').eq('profile_id', user.id).maybeSingle(),
    supabase.from('categories').select('id, name').eq('active', true).order('sort_order'),
    supabase.from('services').select('id, name, description, starting_price, currency, active').eq('provider_id', user.id).order('created_at', { ascending: false }),
    supabase.from('portfolio_items').select('id, storage_path, caption').eq('provider_id', user.id).order('sort_order').order('created_at'),
    supabase.from('availability').select('weekday, is_open, start_time, end_time').eq('provider_id', user.id).order('weekday'),
    supabase.from('bookings').select('id, customer_id, customer_display_name, request_kind, description, location, preferred_at, proposed_at, status, created_at, services(name), messages(id, sender_id, recipient_id, body, created_at), quotations(id, amount, currency, message, status)').eq('provider_id', user.id).order('created_at', { ascending: false}),
    supabase.from('notifications').select('id, body, read_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);

  if (!providerResult.data) {
    return <main className="wrap auth-wrap"><a className="logo" href="/"><i/>Doorstep</a><section className="card dash-card"><h1>Business profile unavailable</h1><p>The provider profile could not be loaded. Apply the foundation migration and sign in again.</p><form action={logoutAction}><button className="btn ghost" type="submit">Sign out</button></form></section></main>;
  }

  const categoryReview = providerResult.data.category_id
    ? await supabase.from('category_compliance').select('state, required_verification_kinds').eq('category_id', providerResult.data.category_id).maybeSingle()
    : { data: null, error: null };

  return <>
    <ProviderDashboard
      profile={providerResult.data}
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
      bookings={bookingsResult.data || []}
      bookingsError={Boolean(bookingsResult.error)}
      notifications={notificationsResult.data || []}
    />
    <div className="wrap provider-signout"><form action={logoutAction}><button className="btn ghost small" type="submit">Sign out</button></form></div>
  </>;
}
