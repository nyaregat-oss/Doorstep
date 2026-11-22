import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Briefcase, CalendarClock, Flag, MapPin } from 'lucide-react';
import { getSampleProvider } from '@/lib/marketplace-data';
import { formatKenyanDateTime, getCategoryImage } from '@/lib/kenya';
import { createClient } from '@/lib/supabase/server';
import { Badge, VerifiedBadge } from '@/components/ui/badge';
import { RatingStars } from '@/components/ui/rating-stars';
import { PortfolioLightbox, type GalleryItem } from '@/components/provider/portfolio-lightbox';
import { SaveProviderButton } from '@/components/provider/save-provider-button';
import { ProviderProfileInteractive } from '@/components/provider/provider-profile-interactive';

export const metadata: Metadata = {
  title: 'Professional Profile | Doorstep Kenya',
  description: 'View professional skills, portfolio work, transparent starting prices, and availability on Doorstep.',
};

type LiveProfile = {
  profile_id: string;
  business_name: string;
  location: string;
  bio: string;
  years_experience: number;
  verified: boolean;
  headline?: string;
  skills?: string[];
  categories: { name: string } | null;
};
type LiveService = { id: string; name: string; description: string; starting_price: number | string; currency: string };
type LiveReview = { id: string; rating: number; comment: string; created_at: string };

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = getSampleProvider(id);

  if (sample) {
    const demoServices = [
      {
        id: 'sample-svc-1',
        name: `${sample.category} diagnostic & quick visit`,
        description: `Standard inspection and minor ${sample.category.toLowerCase()} work within ${sample.location}.`,
        starting_price: sample.startingPrice,
        currency: 'KES',
      },
      {
        id: 'sample-svc-2',
        name: `Standard ${sample.category.toLowerCase()} service`,
        description: 'Full single-session repair, installation, or servicing (materials quoted separately).',
        starting_price: sample.startingPrice * 2,
        currency: 'KES',
      },
      {
        id: 'sample-svc-3',
        name: `Comprehensive project package`,
        description: 'Multi-day or larger residential/commercial scope with written estimate.',
        starting_price: sample.startingPrice * 4,
        currency: 'KES',
      },
    ];

    const sampleGallery: GalleryItem[] = [
      { id: 's1', url: sample.image, caption: `${sample.category} craft showcase (Sample)` },
      { id: 's2', url: '/images/hero-secondary.jpg', caption: 'On-site client consultation (Sample)' },
    ];

    return (
      <main className="ds-container ds-profile-page">
        <Link className="ds-back-link" href="/browse">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to services
        </Link>

        <header className="ds-card ds-profile-hero">
          <div className="ds-profile-identity">
            <div className="ds-profile-avatar">
              <Image
                src={sample.image}
                alt={`${sample.businessName} category photography`}
                fill
                sizes="80px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <div className="ds-actions-row">
                <Badge tone="navy">{sample.category}</Badge>
                <Badge tone="amber">Sample profile</Badge>
              </div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)' }}>{sample.businessName}</h1>
              <div className="ds-actions-row ds-muted" style={{ fontSize: '0.92rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={15} aria-hidden="true" />
                  {sample.location}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Briefcase size={15} aria-hidden="true" />
                  {sample.experienceLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="ds-actions-row">
            <SaveProviderButton providerId={sample.id} initialSaved={false} canSave={false} />
            <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/report">
              <Flag size={14} aria-hidden="true" />
              Report
            </Link>
          </div>
        </header>

        <ProviderProfileInteractive
          mode="sample"
          category={sample.category}
          location={sample.location}
          services={demoServices}
          mainBeforeBooking={
            <section className="ds-card ds-profile-block">
              <h2>About {sample.name}</h2>
              <p>{sample.about}</p>
              <p className="ds-muted">{sample.categoryDescription}</p>
              <div className="ds-skills-list">
                {sample.skills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          }
          asideAboveBooking={
            <section className="ds-card ds-profile-block">
              <h2>Availability</h2>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={17} aria-hidden="true" />
                <span>{sample.availability}</span>
              </p>
              <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                Illustrative schedule only; connect a live profile to view weekly EAT hours.
              </p>
            </section>
          }
          asideBelowBooking={
            <>
              <section className="ds-card ds-profile-block">
                <h2>Portfolio gallery</h2>
                <PortfolioLightbox items={sampleGallery} businessName={sample.businessName} />
                <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
                  Sample photography shown for demonstration. Live providers upload private portfolio photos from their
                  dashboard.
                </p>
              </section>

              <section className="ds-card ds-profile-block">
                <h2>Customer reviews</h2>
                <p className="ds-muted">No real customer reviews are attached to illustrative sample profiles.</p>
              </section>
            </>
          }
        />
      </main>
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) notFound();

  const supabase = await createClient();
  let rawProfile: Record<string, unknown> | null = null;
  const enhancedProfileQuery = await supabase
    .from('provider_profiles')
    .select('profile_id, business_name, location, bio, years_experience, verified, headline, skills, categories(name)')
    .eq('profile_id', id)
    .maybeSingle();

  if (enhancedProfileQuery.error) {
    // Fallback if optional enhancement migration has not been applied yet.
    const baseQuery = await supabase
      .from('provider_profiles')
      .select('profile_id, business_name, location, bio, years_experience, verified, categories(name)')
      .eq('profile_id', id)
      .maybeSingle();
    if (baseQuery.error || !baseQuery.data) notFound();
    rawProfile = baseQuery.data as unknown as Record<string, unknown>;
  } else if (!enhancedProfileQuery.data) {
    notFound();
  } else {
    rawProfile = enhancedProfileQuery.data as unknown as Record<string, unknown>;
  }

  const profile = {
    ...rawProfile,
    categories: Array.isArray(rawProfile.categories)
      ? (rawProfile.categories[0] as { name: string } | null) || null
      : (rawProfile.categories as { name: string } | null),
  } as LiveProfile;

  const categoryName = profile.categories?.name || 'Service provider';

  const [servicesResult, portfolioResult, availabilityResult, authResult] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, description, starting_price, currency')
      .eq('provider_id', id)
      .eq('active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('portfolio_items')
      .select('id, storage_path, caption')
      .eq('provider_id', id)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('availability')
      .select('weekday, start_time, end_time')
      .eq('provider_id', id)
      .eq('is_open', true)
      .order('weekday'),
    supabase.auth.getUser(),
  ]);

  const currentUser = authResult.data.user;
  let canSave = false;
  let initialSaved = false;
  let reviews: LiveReview[] = [];

  try {
    const [reviewsRes, profileRoleRes] = await Promise.all([
      supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('provider_id', id)
        .order('created_at', { ascending: false })
        .limit(30),
      currentUser ? supabase.from('profiles').select('role').eq('id', currentUser.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (!reviewsRes.error && reviewsRes.data) {
      reviews = reviewsRes.data as LiveReview[];
    }
    if (currentUser && profileRoleRes.data?.role === 'customer') {
      canSave = true;
      const savedRes = await supabase
        .from('saved_providers')
        .select('provider_id')
        .eq('customer_id', currentUser.id)
        .eq('provider_id', id)
        .maybeSingle();
      if (!savedRes.error && savedRes.data) initialSaved = true;
    }
  } catch {
    // Reviews and saved providers stay safely optional before migration is applied.
  }

  const services = (servicesResult.data || []) as LiveService[];
  const portfolioItems = portfolioResult.data || [];
  const signedPortfolio: GalleryItem[] = (
    await Promise.all(
      portfolioItems.map(async (item) => {
        const { data } = await supabase.storage
          .from('doorstep-provider-portfolio')
          .createSignedUrl(item.storage_path, 3600);
        return { id: item.id, caption: item.caption || '', url: data?.signedUrl || '' };
      }),
    )
  ).filter((item) => Boolean(item.url));

  const openDays = availabilityResult.data || [];
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, item) => sum + Number(item.rating), 0) / reviews.length : null;
  const heroPhoto = signedPortfolio[0]?.url || getCategoryImage(categoryName);

  return (
    <main className="ds-container ds-profile-page">
      <Link className="ds-back-link" href="/browse">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to services
      </Link>

      <header className="ds-card ds-profile-hero">
        <div className="ds-profile-identity">
          <div className="ds-profile-avatar">
            <Image
              src={heroPhoto}
              alt={`${profile.business_name} profile showcase`}
              fill
              unoptimized={heroPhoto.startsWith('http')}
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div className="ds-actions-row">
              <Badge tone="navy">{categoryName}</Badge>
              {profile.verified === true && <VerifiedBadge />}
              {avgRating !== null && <RatingStars rating={avgRating} count={reviews.length} />}
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)' }}>{profile.business_name}</h1>
            {profile.headline && (
              <p className="ds-muted" style={{ fontWeight: 500 }}>
                {profile.headline}
              </p>
            )}
            <div className="ds-actions-row ds-muted" style={{ fontSize: '0.92rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={15} aria-hidden="true" />
                {profile.location}
              </span>
              {profile.years_experience > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Briefcase size={15} aria-hidden="true" />
                  {profile.years_experience} years experience
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ds-actions-row">
          <SaveProviderButton providerId={profile.profile_id} initialSaved={initialSaved} canSave={canSave} />
          <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/report">
            <Flag size={14} aria-hidden="true" />
            Report
          </Link>
        </div>
      </header>

      <ProviderProfileInteractive
        mode="live"
        category={categoryName}
        location={profile.location}
        services={services}
        mainBeforeBooking={
          <section className="ds-card ds-profile-block">
            <h2>About this professional</h2>
            <p>{profile.bio || 'This provider has not added a business description yet.'}</p>
            {Array.isArray(profile.skills) && profile.skills.length > 0 && (
              <div className="ds-skills-list">
                {profile.skills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        }
        asideAboveBooking={
          <section className="ds-card ds-profile-block">
            <h2>Weekly availability</h2>
            {availabilityResult.error ? (
              <p className="ds-muted">Availability could not be loaded.</p>
            ) : openDays.length > 0 ? (
              <ul className="ds-hours-list">
                {openDays.map((day) => (
                  <li key={day.weekday}>
                    <strong>{weekdayNames[day.weekday]}</strong>
                    <span className="tabular-nums ds-muted">
                      {day.start_time.slice(0, 5)}–{day.end_time.slice(0, 5)} EAT
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ds-muted">This provider has not published weekly hours yet.</p>
            )}
          </section>
        }
        asideBelowBooking={
          <>
            <section className="ds-card ds-profile-block">
              <h2>Work portfolio</h2>
              {portfolioResult.error ? (
                <p className="ds-muted">Portfolio items could not be loaded.</p>
              ) : signedPortfolio.length > 0 ? (
                <PortfolioLightbox items={signedPortfolio} businessName={profile.business_name} />
              ) : (
                <p className="ds-muted">This provider has not added portfolio images yet.</p>
              )}
            </section>

            <section className="ds-card ds-profile-block">
              <div className="ds-panel-head">
                <h2>Customer reviews</h2>
                {avgRating !== null && <RatingStars rating={avgRating} count={reviews.length} />}
              </div>
              {reviews.length > 0 ? (
                <div>
                  {reviews.map((review) => (
                    <article className="ds-review-item" key={review.id}>
                      <div className="ds-actions-row" style={{ justifyContent: 'space-between' }}>
                        <RatingStars rating={review.rating} showCount={false} />
                        <span className="ds-muted" style={{ fontSize: '0.82rem' }}>
                          {formatKenyanDateTime(review.created_at)}
                        </span>
                      </div>
                      {review.comment && <p>{review.comment}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="ds-muted">No verified customer reviews yet. Reviews appear after completed jobs.</p>
              )}
            </section>
          </>
        }
      />
    </main>
  );
}
