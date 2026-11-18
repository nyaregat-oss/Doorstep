import { notFound } from 'next/navigation';
import { getSampleProvider } from '@/lib/marketplace-data';
import { createClient } from '@/lib/supabase/server';
import { SampleBookingForm } from './sample-booking-form';
import { RequestServiceForm } from './request-service-form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Provider profile | Doorstep', description: 'View provider services, business details, and availability on Doorstep.' };

type LiveProfile = {
  profile_id: string;
  business_name: string;
  location: string;
  bio: string;
  years_experience: number;
  categories: { name: string } | null;
};
type LiveService = { id: string; name: string; description: string; starting_price: number | string; currency: string };

function price(value: number, currency: string) {
  try { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: currency.trim(), maximumFractionDigits: 2 }).format(value); }
  catch { return `${currency.trim()} ${value.toLocaleString('en-KE')}`; }
}

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = getSampleProvider(id);
  if (sample) {
    const demoServices = [
      { name: 'Quick visit', price: sample.startingPrice, currency: 'KES' },
      { name: 'Standard service', price: sample.startingPrice * 2, currency: 'KES' },
      { name: 'Larger project', price: sample.startingPrice * 4, currency: 'KES' },
    ];
    return <main className="wrap profile-page">
      <a className="back" href="/browse">← Back to services</a>
      <header className="card profile-header"><div className="av profile-avatar">{sample.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><p className="eyebrow">{sample.category}</p><h1>{sample.businessName}</h1><p className="muted">{sample.location}</p></div><span className="tag sample-tag">Sample profile</span></header>
      <div className="profile-grid"><div>
        <section className="card profile-section"><h2>About</h2><p>{sample.about}</p><p className="muted">{sample.categoryDescription}</p></section>
        <section className="card profile-section"><h2>Services and starting prices</h2>{demoServices.map((service) => <div className="row" key={service.name}><span>{service.name}</span><strong>From {price(service.price, service.currency)}</strong></div>)}<p className="note">Illustrative prices for the preview; this provider is not a real listing.</p></section>
        <section className="card profile-section"><h2>Portfolio</h2><div className="tiles">{[1,2,3,4].map((item) => <div key={item}>Sample work placeholder</div>)}</div><p className="note">Providers will upload their own work after portfolio tools are connected.</p></section>
        <section className="card profile-section"><h2>Reviews</h2><p className="muted">No real reviews are available for this sample profile.</p></section>
      </div><aside className="profile-sticky">
        <section className="card profile-section"><h2>Availability</h2><p>{sample.availability}</p><p className="note">Sample availability only; no calendar is connected.</p></section>
        <section className="card profile-section"><h2>Request a booking</h2><SampleBookingForm services={demoServices}/></section>
      </aside></div>
    </main>;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) notFound();
  const supabase = await createClient();
  const { data: rawProfile, error } = await supabase.from('provider_profiles').select('profile_id, business_name, location, bio, years_experience, categories(name)').eq('profile_id', id).maybeSingle();
  if (error || !rawProfile) notFound();
  const profile = rawProfile as LiveProfile;
  const [servicesResult, portfolioResult, availabilityResult] = await Promise.all([
    supabase.from('services').select('id, name, description, starting_price, currency').eq('provider_id', id).eq('active', true).order('created_at', { ascending: false }),
    supabase.from('portfolio_items').select('id, storage_path, caption').eq('provider_id', id).order('sort_order').order('created_at'),
    supabase.from('availability').select('weekday, start_time, end_time').eq('provider_id', id).eq('is_open', true).order('weekday'),
  ]);
  const services = (servicesResult.data || []) as LiveService[];
  const portfolioItems = portfolioResult.data || [];
  const signedPortfolio = await Promise.all(portfolioItems.map(async (item) => {
    const { data } = await supabase.storage.from('doorstep-provider-portfolio').createSignedUrl(item.storage_path, 3600);
    return { id: item.id, caption: item.caption, url: data?.signedUrl || '' };
  }));
  const openDays = availabilityResult.data || [];
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return <main className="wrap profile-page">
    <a className="back" href="/browse">← Back to services</a>
    <header className="card profile-header"><div className="av profile-avatar">{profile.business_name.trim().slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">{profile.categories?.name || 'Service provider'}</p><h1>{profile.business_name}</h1><p className="muted">{profile.location}</p></div></header>
    <div className="profile-grid"><div>
      <section className="card profile-section"><h2>About</h2><p>{profile.bio || 'This provider has not added a business description yet.'}</p>{profile.years_experience > 0 && <p className="muted">{profile.years_experience} years of experience</p>}</section>
      <section className="card profile-section"><h2>Services and starting prices</h2>{servicesResult.error ? <p className="auth-error" role="alert">Published services could not be loaded.</p> : services.length ? services.map((service) => <div className="profile-service" key={service.id}><div className="row"><span>{service.name}</span><strong>From {price(Number(service.starting_price), service.currency)}</strong></div>{service.description && <p className="muted">{service.description}</p>}</div>) : <p className="muted">No published services at the moment.</p>}</section>
      <section className="card profile-section"><h2>Reviews</h2><p className="muted">Reviews are not available in the current prototype.</p></section>
    </div><aside className="profile-sticky">
      <section className="card profile-section"><h2>Portfolio</h2>{portfolioResult.error ? <p className="muted">Portfolio items could not be loaded.</p> : signedPortfolio.length ? <div className="portfolio-grid">{signedPortfolio.filter((item) => item.url).map((item) => <figure className="portfolio-item" key={item.id}><img src={item.url} alt={item.caption || `${profile.business_name} portfolio work`} loading="lazy"/>{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div> : <p className="muted">This provider has not added portfolio images yet.</p>}</section>
      <section className="card profile-section"><h2>Availability</h2>{availabilityResult.error ? <p className="muted">Availability could not be loaded.</p> : openDays.length ? <ul className="profile-hours">{openDays.map((day) => <li key={day.weekday}><span>{weekdayNames[day.weekday]}</span><span>{day.start_time.slice(0, 5)}–{day.end_time.slice(0, 5)} EAT</span></li>)}</ul> : <p className="muted">This provider has not published availability yet.</p>}</section>
      <section className="card profile-section"><h2>Booking request</h2><RequestServiceForm services={services}/></section>
    </aside></div>
  </main>;
}
