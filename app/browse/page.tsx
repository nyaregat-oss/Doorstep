import { categories as sampleCategories } from '@/lib/catalog';
import { getSampleProviders, sampleAreas } from '@/lib/marketplace-data';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { NearbyResults } from './nearby-results';

export const metadata: Metadata = { title: 'Browse services | Doorstep', description: 'Search sample and live provider services across Kenya.' };

type Params = Record<string, string | string[] | undefined>;
type BrowseService = {
  id: string;
  name: string;
  description: string;
  starting_price: number | string;
  currency: string;
  created_at: string;
  provider_profiles: Array<{
    profile_id: string;
    business_name: string;
    location: string;
    categories: { name: string }[] | { name: string } | null;
  }>;
};
type Listing = {
  id: string;
  providerId: string;
  businessName: string;
  serviceName: string;
  description: string;
  location: string;
  category: string;
  price: number;
  currency: string;
  source: 'live' | 'sample';
  availability: string;
  availabilityKey: string;
};

function safeText(value: string | string[] | undefined, maxLength = 80) {
  const text = Array.isArray(value) ? value[0] : value;
  return (text || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
}

function formatPrice(price: number, currency: string) {
  const code = currency.trim();
  try { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(Number(price)); }
  catch { return `${code} ${Number(price).toLocaleString('en-KE')}`; }
}

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = safeText(params.q).toLocaleLowerCase();
  const location = safeText(params.location).toLocaleLowerCase();
  const category = safeText(params.category, 40);
  const availability = safeText(params.availability);
  const rawMaxPriceText = safeText(params.max_price);
  const rawMaxPrice = rawMaxPriceText ? Number(rawMaxPriceText) : Number.NaN;
  const maxPrice = Number.isFinite(rawMaxPrice) && rawMaxPrice >= 0 ? rawMaxPrice : undefined;
  const priceSort = safeText(params.sort) === 'price';
  const requestedPage = Number.parseInt(safeText(params.page, 5), 10);
  const livePage = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1;
  const pageSize = 24;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const samples: Listing[] = getSampleProviders().map((provider) => ({
    id: provider.id,
    providerId: provider.id,
    businessName: provider.businessName,
    serviceName: provider.category,
    description: provider.categoryDescription,
    location: provider.location,
    category: provider.category,
    price: provider.startingPrice,
    currency: provider.currency,
    source: 'sample',
    availability: provider.availability,
    availabilityKey: provider.availabilityKey,
  }));

  let liveListings: Listing[] = [];
  let liveError = false;
  let liveTotal = 0;
  const weekdayNumber: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const today = weekdayNumber[new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Nairobi', weekday: 'short' }).format(new Date())];
  const tomorrow = (today + 1) % 7;
  let categoryNames = sampleCategories.map(([name]) => name);
  if (configured) {
    const supabase = await createClient();
    const categoryResult = await supabase.from('categories').select('id, name').eq('active', true).order('sort_order');
    categoryNames = categoryResult.data?.map((item) => item.name) || categoryNames;
    let availableProviderIds: string[] | null = null;
    let availabilityError = false;
    if (availability) {
      const weekdays = availability === 'today' ? [today]
        : availability === 'tomorrow' ? [tomorrow]
          : availability === 'weekends' ? [0, 6]
            : Array.from({ length: 7 - today }, (_, offset) => (today + offset) % 7);
      let availabilityQuery = supabase.from('availability').select('provider_id').eq('is_open', true);
      if (availability === 'this-week') availabilityQuery = availabilityQuery.gte('weekday', today);
      else availabilityQuery = availabilityQuery.in('weekday', weekdays);
      const availabilityResult = await availabilityQuery;
      availabilityError = Boolean(availabilityResult.error);
      availableProviderIds = [...new Set((availabilityResult.data || []).map((slot) => slot.provider_id))];
    }
    let query = supabase.from('services').select('id, name, description, starting_price, currency, created_at, provider_profiles!inner(profile_id, business_name, location, categories(name))', { count: 'exact' }).eq('active', true);
    if (q) query = query.ilike('name', `%${q.replace(/[%_\\]/g, '\\$&')}%`);
    if (location) query = query.ilike('provider_profiles.location', `%${location.replace(/[%_\\]/g, '\\$&')}%`);
    if (category) {
      const selected = categoryResult.data?.find((item) => item.name === category);
      if (selected) query = query.eq('provider_profiles.category_id', selected.id);
      else query = query.eq('provider_profiles.category_id', '00000000-0000-0000-0000-000000000000');
    }
    if (maxPrice !== undefined) query = query.lte('starting_price', maxPrice);
    if (availableProviderIds !== null) {
      if (availableProviderIds.length > 0) query = query.in('provider_profiles.profile_id', availableProviderIds);
      else query = query.eq('provider_profiles.profile_id', '00000000-0000-0000-0000-000000000000');
    }
    const serviceResult = await query.order(priceSort ? 'starting_price' : 'created_at', { ascending: priceSort }).range((livePage - 1) * pageSize, livePage * pageSize - 1);
    liveError = Boolean(categoryResult.error || availabilityError || serviceResult.error);
    liveTotal = serviceResult.count || 0;
    liveListings = ((serviceResult.data || []) as unknown as BrowseService[]).flatMap((service) => {
      const provider = service.provider_profiles[0];
      if (!provider) return [];
      const joinedCategory = Array.isArray(provider.categories) ? provider.categories[0] : provider.categories;
      return [{
        id: service.id,
        providerId: provider.profile_id,
        businessName: provider.business_name,
        serviceName: service.name,
        description: service.description,
        location: provider.location,
        category: joinedCategory?.name || 'Other service',
        price: Number(service.starting_price),
        currency: service.currency,
        source: 'live' as const,
        availability: '',
        availabilityKey: '',
      }];
    });
  }

  const matches = (listing: Listing) => {
    const matchesText = !q || `${listing.serviceName} ${listing.businessName} ${listing.description} ${listing.category}`.toLocaleLowerCase().includes(q);
    const matchesLocation = !location || listing.location.toLocaleLowerCase().includes(location);
    const matchesCategory = !category || listing.category === category;
    const matchesPrice = maxPrice === undefined || listing.price <= maxPrice;
    const hasLiveAvailability = listing.source === 'live';
    const matchesAvailability = !availability || (listing.source === 'sample' ? listing.availabilityKey === availability : hasLiveAvailability);
    return matchesText && matchesLocation && matchesCategory && matchesPrice && matchesAvailability;
  };
  const sampleMatches = samples.filter(matches);
  const liveMatches = liveListings.filter(matches);
  if (priceSort) { sampleMatches.sort((a, b) => a.price - b.price); liveMatches.sort((a, b) => a.price - b.price); }
  const livePageCount = Math.max(1, Math.ceil(liveTotal / pageSize));
  const pageUrl = (page: number) => {
    const query = new URLSearchParams();
    const values: Array<[string, string]> = [
      ['q', safeText(params.q)], ['location', safeText(params.location)], ['category', category],
      ['max_price', rawMaxPriceText], ['availability', availability], ['sort', priceSort ? 'price' : 'newest'],
    ];
    values.forEach(([key, value]) => { if (value) query.set(key, value); });
    if (page > 1) query.set('page', String(page));
    return `/browse?${query.toString()}`;
  };
  const renderCard = (listing: Listing) => <article className="card browse-card" key={`${listing.source}-${listing.id}`}>
    <div className="browse-card-heading"><div className="av" aria-hidden="true">{listing.businessName.trim().slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">{listing.category}</p><h2>{listing.businessName}</h2></div></div>
    <h3>{listing.serviceName}</h3>
    {listing.description && <p className="muted">{listing.description}</p>}
    <p className="browse-location">{listing.location}</p>
    <p className="browse-price">From {formatPrice(listing.price, listing.currency)}</p>
    {listing.source === 'sample' && <p className="note">{listing.availability}</p>}
    <div className="browse-card-foot"><span className={`tag ${listing.source === 'sample' ? 'sample-tag' : ''}`}>{listing.source === 'sample' ? 'Sample listing' : 'Provider listing'}</span><a className="btn ghost small" href={`/providers/${listing.providerId}`}>View profile</a></div>
  </article>;

  return <main className="wrap browse-page">
    <a className="back" href="/">← Back to Doorstep</a>
    <header className="browse-heading"><div><p className="eyebrow">Doorstep marketplace</p><h1>Browse services</h1><p className="sub">Find services offered by professionals in counties, towns, and neighbourhoods across Kenya.</p></div><a className="btn ghost" href="/register?role=provider">List your service</a></header>
    {!configured && <p className="banner">Showing clearly labeled sample professionals. Connect Supabase to include live provider listings.</p>}
    {liveError && <p className="auth-error" role="alert">Live listings or categories could not load. Apply the database migrations and check your Supabase setup.</p>}
    <form className="card browse-filters" action="/browse" method="get">
      <label>Service<input name="q" maxLength={80} defaultValue={safeText(params.q)} placeholder="What do you need?"/></label>
      <label>County, town, or area<input name="location" maxLength={80} defaultValue={safeText(params.location)} placeholder="e.g. Nakuru, Westlands" list="areas"/><datalist id="areas">{sampleAreas.map((area) => <option key={area} value={area}/>)}</datalist></label>
      <label>Category<select name="category" defaultValue={category}><option value="">All categories</option>{categoryNames.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
      <label>Maximum price<input name="max_price" type="number" min="0" step="0.01" defaultValue={maxPrice}/></label>
      <label>Availability<select name="availability" defaultValue={availability}><option value="">Any availability</option><option value="today">Available today</option><option value="tomorrow">Available tomorrow</option><option value="this-week">Available this week</option><option value="weekends">Available weekends</option></select></label>
      <label>Minimum rating<select disabled aria-label="Minimum rating"><option>Ratings unlock after real reviews are available</option></select></label>
      <label>Sort by<select name="sort" defaultValue={priceSort ? 'price' : 'newest'}><option value="newest">Recently added</option><option value="price">Lowest price</option></select></label>
      <div className="browse-actions"><button className="btn" type="submit">Search</button><a className="btn ghost" href="/browse">Clear filters</a></div>
    </form>

    <NearbyResults configured={configured} query={q} location={safeText(params.location)} category={category} maxPrice={maxPrice} availability={availability}/>

    {configured && <section className="browse-results-section"><div className="panel-heading"><div><h2>Live provider listings</h2><p className="muted">{liveTotal} live services match these filters.</p></div><span className="browse-page-label">Page {livePage} of {livePageCount}</span></div>
      {liveError && <p className="auth-error" role="alert">Live listings, categories, or availability could not load. Apply the database migrations and check your Supabase setup.</p>}
      {!liveError && liveMatches.length > 0 ? <div className="browse-grid">{liveMatches.map(renderCard)}</div> : !liveError && <p className="card browse-empty">No live listings match these filters yet.</p>}
      {liveTotal > pageSize && <nav className="browse-pagination" aria-label="Live listings pages">{livePage > 1 && <a className="btn ghost small" href={pageUrl(livePage - 1)}>Previous</a>}<span>Page {livePage} of {livePageCount}</span>{livePage < livePageCount && <a className="btn ghost small" href={pageUrl(livePage + 1)}>Next</a>}</nav>}
    </section>}
    <section className="browse-results-section"><div className="panel-heading"><div><h2>Sample professionals</h2><p className="muted">{sampleMatches.length} illustrative profiles across the 16 service categories.</p></div><span className="tag sample-tag">Sample data</span></div>
      {sampleMatches.length > 0 ? <div className="browse-grid">{sampleMatches.map(renderCard)}</div> : <section className="card browse-empty"><h2>No sample profiles match</h2><p>Try clearing a filter. Sample profiles stay separate from real provider listings.</p><a className="btn" href="/browse">Clear filters</a></section>}
    </section>
    <p className="note browse-disclaimer">Sample providers and availability are illustrative only. Ratings, reviews, and verification appear only when backed by real marketplace records.</p>
  </main>;
}
