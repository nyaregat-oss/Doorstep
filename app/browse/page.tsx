import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Info, SearchX } from 'lucide-react';
import { categories as sampleCategories } from '@/lib/catalog';
import { getSampleProviders } from '@/lib/marketplace-data';
import { createClient } from '@/lib/supabase/server';
import { BrowseControls } from './browse-controls';
import { NearbyResults } from './nearby-results';
import { ProfessionalCard, type ProfessionalCardData } from '@/components/cards/professional-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Explore Services | Doorstep Kenya',
  description: 'Search trusted local service professionals across Kenyan counties and Nairobi neighbourhoods.',
};

type Params = Record<string, string | string[] | undefined>;
type BrowseService = {
  id: string;
  name: string;
  description: string;
  starting_price: number | string;
  currency: string;
  created_at: string;
  provider_profiles:
    | Array<{
        profile_id: string;
        business_name: string;
        location: string;
        verified: boolean;
        categories: { name: string }[] | { name: string } | null;
      }>
    | {
        profile_id: string;
        business_name: string;
        location: string;
        verified: boolean;
        categories: { name: string }[] | { name: string } | null;
      };
};

type ReviewSummary = { average: number; count: number };

function safeText(value: string | string[] | undefined, maxLength = 80) {
  const text = Array.isArray(value) ? value[0] : value;
  return (text || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
}

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const rawQ = safeText(params.q);
  const q = rawQ.toLocaleLowerCase();
  const rawLocation = safeText(params.location);
  const location = rawLocation.toLocaleLowerCase();
  const category = safeText(params.category, 40);
  const availability = safeText(params.availability);
  const rawMaxPriceText = safeText(params.max_price);
  const rawMaxPrice = rawMaxPriceText ? Number(rawMaxPriceText) : Number.NaN;
  const maxPrice = Number.isFinite(rawMaxPrice) && rawMaxPrice >= 0 ? rawMaxPrice : undefined;
  const verifiedOnly = safeText(params.verified) === '1';
  const rawMinRating = safeText(params.min_rating);
  const minRating = rawMinRating ? Number(rawMinRating) : undefined;
  const sortParam = safeText(params.sort);
  const sort = ['price', 'price_desc', 'newest'].includes(sortParam) ? sortParam : 'newest';
  const requestedPage = Number.parseInt(safeText(params.page, 5), 10);
  const livePage = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1;
  const pageSize = 24;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const samples = getSampleProviders().map((provider) => ({
    id: provider.id,
    providerId: provider.id,
    businessName: provider.businessName,
    serviceName: provider.category,
    description: provider.categoryDescription,
    location: provider.location,
    category: provider.category,
    price: provider.startingPrice,
    currency: provider.currency,
    source: 'sample' as const,
    imageUrl: provider.image,
    availabilityLabel: provider.availability,
    availabilityKey: provider.availabilityKey,
  }));

  let liveListings: Array<ProfessionalCardData & { availabilityKey: string }> = [];
  let liveError = false;
  let liveTotal = 0;
  let hasRealReviews = false;
  let categoryNames = sampleCategories.map(([name]) => name);

  const weekdayNumber: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const today =
    weekdayNumber[new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Nairobi', weekday: 'short' }).format(new Date())];
  const tomorrow = (today + 1) % 7;

  if (configured) {
    try {
      const supabase = await createClient();
      const categoryResult = await supabase.from('categories').select('id, name').eq('active', true).order('sort_order');
      categoryNames = categoryResult.data?.map((item) => item.name) || categoryNames;

      let availableProviderIds: string[] | null = null;
      let availabilityError = false;
      if (availability) {
        const weekdays =
          availability === 'today'
            ? [today]
            : availability === 'tomorrow'
              ? [tomorrow]
              : availability === 'weekends'
                ? [0, 6]
                : Array.from({ length: 7 - today }, (_, offset) => (today + offset) % 7);
        let availabilityQuery = supabase.from('availability').select('provider_id').eq('is_open', true);
        if (availability === 'this-week') availabilityQuery = availabilityQuery.gte('weekday', today);
        else availabilityQuery = availabilityQuery.in('weekday', weekdays);
        const availabilityResult = await availabilityQuery;
        availabilityError = Boolean(availabilityResult.error);
        availableProviderIds = [...new Set((availabilityResult.data || []).map((slot) => slot.provider_id))];
      }

      let query = supabase
        .from('services')
        .select(
          'id, name, description, starting_price, currency, created_at, provider_profiles!inner(profile_id, business_name, location, verified, categories(name))',
          { count: 'exact' },
        )
        .eq('active', true);

      if (q) query = query.ilike('name', `%${q.replace(/[%_\\]/g, '\\$&')}%`);
      if (location) query = query.ilike('provider_profiles.location', `%${location.replace(/[%_\\]/g, '\\$&')}%`);
      if (category) {
        const selected = categoryResult.data?.find((item) => item.name === category);
        if (selected) query = query.eq('provider_profiles.category_id', selected.id);
        else query = query.eq('provider_profiles.category_id', '00000000-0000-0000-0000-000000000000');
      }
      if (verifiedOnly) query = query.eq('provider_profiles.verified', true);
      if (maxPrice !== undefined) query = query.lte('starting_price', maxPrice);
      if (availableProviderIds !== null) {
        if (availableProviderIds.length > 0) query = query.in('provider_profiles.profile_id', availableProviderIds);
        else query = query.eq('provider_profiles.profile_id', '00000000-0000-0000-0000-000000000000');
      }

      const orderColumn = sort === 'price' || sort === 'price_desc' ? 'starting_price' : 'created_at';
      const orderAscending = sort === 'price';
      const serviceResult = await query
        .order(orderColumn, { ascending: orderAscending })
        .range((livePage - 1) * pageSize, livePage * pageSize - 1);

      liveError = Boolean(categoryResult.error || availabilityError || serviceResult.error);
      liveTotal = serviceResult.count || 0;

      const rawServices = (serviceResult.data || []) as unknown as BrowseService[];
      const providerIds = [
        ...new Set(
          rawServices
            .map((svc) => (Array.isArray(svc.provider_profiles) ? svc.provider_profiles[0]?.profile_id : svc.provider_profiles?.profile_id))
            .filter(Boolean),
        ),
      ];

      // Gracefully fetch real reviews + portfolio images if available.
      const reviewMap = new Map<string, ReviewSummary>();
      const portfolioMap = new Map<string, string>();
      if (providerIds.length > 0) {
        try {
          const [reviewsRes, portfolioRes] = await Promise.all([
            supabase.from('reviews').select('provider_id, rating').in('provider_id', providerIds),
            supabase.from('portfolio_items').select('provider_id, storage_path').in('provider_id', providerIds).order('sort_order'),
          ]);
          if (!reviewsRes.error && reviewsRes.data && reviewsRes.data.length > 0) {
            hasRealReviews = true;
            const grouped = new Map<string, number[]>();
            for (const row of reviewsRes.data) {
              const list = grouped.get(row.provider_id) || [];
              list.push(Number(row.rating));
              grouped.set(row.provider_id, list);
            }
            for (const [pid, ratings] of grouped.entries()) {
              reviewMap.set(pid, {
                average: ratings.reduce((sum, n) => sum + n, 0) / ratings.length,
                count: ratings.length,
              });
            }
          }
          if (!portfolioRes.error && portfolioRes.data) {
            const seen = new Set<string>();
            for (const item of portfolioRes.data) {
              if (seen.has(item.provider_id)) continue;
              seen.add(item.provider_id);
              const signed = await supabase.storage
                .from('doorstep-provider-portfolio')
                .createSignedUrl(item.storage_path, 3600);
              if (signed.data?.signedUrl) {
                portfolioMap.set(item.provider_id, signed.data.signedUrl);
              }
            }
          }
        } catch {
          // Optional enhancement tables remain safe if not yet migrated.
        }
      }

      liveListings = rawServices.flatMap((service) => {
        const provider = Array.isArray(service.provider_profiles)
          ? service.provider_profiles[0]
          : service.provider_profiles;
        if (!provider) return [];
        const joinedCategory = Array.isArray(provider.categories)
          ? provider.categories[0]
          : provider.categories;
        const reviewSummary = reviewMap.get(provider.profile_id);
        return [
          {
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
            verified: provider.verified,
            imageUrl: portfolioMap.get(provider.profile_id),
            rating: reviewSummary ? reviewSummary.average : null,
            reviewCount: reviewSummary ? reviewSummary.count : 0,
            availabilityKey: '',
          },
        ];
      });
    } catch {
      liveError = true;
    }
  }

  const matchesSample = (listing: (typeof samples)[number]) => {
    const matchesText =
      !q ||
      `${listing.serviceName} ${listing.businessName} ${listing.description} ${listing.category}`
        .toLocaleLowerCase()
        .includes(q);
    const matchesLocation = !location || listing.location.toLocaleLowerCase().includes(location);
    const matchesCategory = !category || listing.category === category;
    const matchesPrice = maxPrice === undefined || listing.price <= maxPrice;
    const matchesAvailability = !availability || listing.availabilityKey === availability;
    // Sample providers never claim verified status or real reviews.
    const matchesVerified = !verifiedOnly;
    return matchesText && matchesLocation && matchesCategory && matchesPrice && matchesAvailability && matchesVerified;
  };

  const sampleMatches = samples.filter(matchesSample);
  const liveMatches = liveListings.filter((listing) => {
    if (minRating && (!listing.rating || listing.rating < minRating)) return false;
    return true;
  });

  if (sort === 'price') {
    sampleMatches.sort((a, b) => a.price - b.price);
    liveMatches.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    sampleMatches.sort((a, b) => b.price - a.price);
    liveMatches.sort((a, b) => b.price - a.price);
  }

  const livePageCount = Math.max(1, Math.ceil(liveTotal / pageSize));
  const pageUrl = (page: number) => {
    const query = new URLSearchParams();
    const entries: Array<[string, string]> = [
      ['q', rawQ],
      ['location', rawLocation],
      ['category', category],
      ['max_price', rawMaxPriceText],
      ['availability', availability],
      ['verified', verifiedOnly ? '1' : ''],
      ['min_rating', rawMinRating],
      ['sort', sort !== 'newest' ? sort : ''],
    ];
    entries.forEach(([key, val]) => {
      if (val) query.set(key, val);
    });
    if (page > 1) query.set('page', String(page));
    return `/browse?${query.toString()}`;
  };

  return (
    <main className="ds-container ds-browse-page">
      <Link className="ds-back-link" href="/">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Doorstep
      </Link>

      <header className="ds-browse-top">
        <div>
          <span className="ds-eyebrow">Doorstep Kenya Directory</span>
          <h1>Browse services &amp; professionals</h1>
          <p className="ds-muted" style={{ marginTop: 8, maxWidth: '58ch' }}>
            Search skilled providers across Kenyan counties, towns, and neighbourhoods, compare transparent starting
            prices in KES, and request bookings or quotes.
          </p>
        </div>
        <Link className="ds-btn ds-btn-secondary" href="/register?role=provider">
          List your service
        </Link>
      </header>

      {!configured && (
        <div className="ds-alert ds-alert-info" style={{ marginBottom: 18 }}>
          <Info size={18} aria-hidden="true" />
          <span>
            Showing clearly labeled sample professionals across 16 trades. Connect Supabase to load live provider
            profiles.
          </span>
        </div>
      )}

      {liveError && (
        <div className="ds-alert ds-alert-error" role="alert" style={{ marginBottom: 18 }}>
          <span>Live listings or categories could not load. Apply the database migrations and check your Supabase setup.</span>
        </div>
      )}

      <BrowseControls
        values={{
          q: rawQ,
          location: rawLocation,
          category,
          maxPrice: rawMaxPriceText,
          availability,
          verifiedOnly,
          minRating: rawMinRating,
          sort,
        }}
        categoryNames={categoryNames}
        hasRealReviews={hasRealReviews}
      />

      <NearbyResults
        configured={configured}
        query={q}
        location={rawLocation}
        category={category}
        maxPrice={maxPrice}
        availability={availability}
      />

      {configured && (
        <section style={{ marginBottom: 40 }} aria-labelledby="live-listings-heading">
          <div className="ds-section-head" style={{ marginBottom: 18 }}>
            <div>
              <h2 id="live-listings-heading">Live provider listings</h2>
              <p>{liveTotal} live services match your current filters.</p>
            </div>
            <Badge tone="navy">
              Page {livePage} of {livePageCount}
            </Badge>
          </div>

          {!liveError && liveMatches.length > 0 ? (
            <div className="ds-pro-grid">
              {liveMatches.map((item) => (
                <ProfessionalCard key={`live-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            !liveError && (
              <EmptyState
                icon={<SearchX size={22} />}
                title="No live listings match yet"
                description="Try expanding your Kenyan area filter, increasing your budget ceiling, or clearing filters."
                actionLabel="Clear all filters"
                actionHref="/browse"
              />
            )
          )}

          {liveTotal > pageSize && (
            <nav className="ds-pagination" aria-label="Live listings pages">
              {livePage > 1 && (
                <Link className="ds-btn ds-btn-secondary ds-btn-sm" href={pageUrl(livePage - 1)}>
                  Previous
                </Link>
              )}
              <span className="ds-muted" style={{ fontSize: '0.9rem' }}>
                Page {livePage} of {livePageCount}
              </span>
              {livePage < livePageCount && (
                <Link className="ds-btn ds-btn-secondary ds-btn-sm" href={pageUrl(livePage + 1)}>
                  Next
                </Link>
              )}
            </nav>
          )}
        </section>
      )}

      <section aria-labelledby="sample-listings-heading">
        <div className="ds-section-head" style={{ marginBottom: 18 }}>
          <div>
            <h2 id="sample-listings-heading">Sample professionals</h2>
            <p>{sampleMatches.length} illustrative profiles across the 16 Doorstep service categories.</p>
          </div>
          <Badge tone="amber">Sample preview data</Badge>
        </div>

        {sampleMatches.length > 0 ? (
          <div className="ds-pro-grid">
            {sampleMatches.map((item) => (
              <ProfessionalCard key={`sample-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<SearchX size={22} />}
            title="No sample profiles match those filters"
            description={
              verifiedOnly
                ? 'Sample preview listings are never marked as verified. Uncheck "Verified providers only" or clear filters to explore sample trades.'
                : 'Try adjusting your keyword, location, or budget filter.'
            }
            actionLabel="Clear all filters"
            actionHref="/browse"
          />
        )}
      </section>

      <p className="ds-muted" style={{ fontSize: '0.84rem', marginTop: 28 }}>
        Sample providers and availability are illustrative only. Ratings, reviews, and verification badges appear only
        when backed by real marketplace records.
      </p>
    </main>
  );
}
