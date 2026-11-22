'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { HOMEPAGE_CATEGORIES } from '@/lib/kenya';
import { Reveal, StaggerGrid, StaggerItem, PageFade } from '@/components/motion';
import { SearchBar } from '@/components/ui/search-bar';
import { CategoryCard } from '@/components/cards/category-card';
import { ProfessionalCard, type ProfessionalCardData } from '@/components/cards/professional-card';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Discover',
    text: 'Find the right professional by service, Kenyan neighbourhood, starting price, and availability.',
    icon: Compass,
  },
  {
    step: '02',
    title: 'Connect',
    text: 'Review their work portfolio, transparent starting prices, and customer feedback, then send a request or ask for a quote.',
    icon: MessageSquare,
  },
  {
    step: '03',
    title: 'Get it done',
    text: 'Agree on the scope, timing, and final terms directly inside your request workspace and track progress to completion.',
    icon: CheckCircle2,
  },
] as const;

const WHY_DOORSTEP = [
  {
    title: 'Discover skilled professionals',
    text: 'Explore specialists across Nairobi neighbourhoods, Mombasa, Kisumu, Nakuru, Eldoret, and Kiambu in one organised directory.',
    icon: Search,
  },
  {
    title: 'Transparent service information',
    text: 'See clear KES starting prices up front and request written quotations before committing to any work.',
    icon: Wallet,
  },
  {
    title: 'Real customer reviews',
    text: 'Reviews are tied directly to completed Doorstep requests so feedback reflects real work — never fabricated ratings.',
    icon: Star,
  },
  {
    title: 'Convenient communication',
    text: 'Keep scope notes, proposed dates, quotes, and messages attached to each service request for clarity.',
    icon: MessageSquare,
  },
  {
    title: 'Local service discovery',
    text: 'Filter by Kenyan towns and estates or opt in to approximate distance ranking without exposing your exact address.',
    icon: MapPin,
  },
  {
    title: 'Verified professionals where applicable',
    text: 'Categories and credentials go through compliance review before approval; verified badges appear only when confirmed.',
    icon: ShieldCheck,
  },
] as const;

const FAQ_ITEMS = [
  {
    q: 'How does Doorstep work for Kenyan customers?',
    a: 'Search by service and area — from Westlands and Kilimani to Nyali, Kisumu, or Nakuru — compare starting prices in KES, review profiles and portfolios, and send a booking or quotation request directly.',
  },
  {
    q: 'How do payments and M-Pesa work?',
    a: 'During this pre-launch stage, Doorstep does not collect online payments, hold escrow, or charge card/M-Pesa fees on the platform. You agree on final scope and payment terms directly with your chosen professional.',
  },
  {
    q: 'Are all service providers verified?',
    a: 'No verification badge is shown unless Doorstep’s compliance team has actually reviewed and approved the provider’s credential record. Sample profiles shown in preview mode are never marked as verified.',
  },
  {
    q: 'How do service providers join Doorstep?',
    a: 'Create a provider account, complete your business profile, publish services with KES starting prices, set your weekly EAT hours, and upload genuine portfolio photos from your workspace.',
  },
  {
    q: 'Can I request a custom quote before booking?',
    a: 'Yes. On any live professional’s profile, choose "Request a Quote" to describe the job, your neighbourhood, and preferred date. The provider can respond with a formal KES quote you can accept or decline.',
  },
] as const;

export function HomeClient({
  featuredProfessionals,
  hasLiveListings,
}: {
  featuredProfessionals: ProfessionalCardData[];
  hasLiveListings: boolean;
}) {
  return (
    <PageFade>
      <main id="top">
        {/* Hero */}
        <section className="ds-hero">
          <div className="ds-container ds-hero-grid">
            <div className="ds-hero-copy">
              <span className="ds-eyebrow">
                <Sparkles size={14} aria-hidden="true" />
                Trusted local services across Kenya
              </span>
              <h1>Your next great service is just a doorstep away.</h1>
              <p className="ds-hero-lead">
                Discover skilled, reliable professionals around you. From fixing a leaking tap to transforming your
                home, find the right person for every job.
              </p>

              <SearchBar />

              <div className="ds-hero-pills">
                <span>Popular in Kenya:</span>
                {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Automotive'].map((term) => (
                  <Link
                    key={term}
                    className="ds-chip"
                    href={`/browse?q=${encodeURIComponent(term)}`}
                  >
                    {term}
                  </Link>
                ))}
              </div>

              <div className="ds-actions-row" style={{ paddingTop: 6 }}>
                <Link className="ds-btn ds-btn-primary ds-btn-lg" href="/browse">
                  Find a Professional
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link className="ds-btn ds-btn-secondary ds-btn-lg" href="/register?role=provider">
                  Offer Your Services
                </Link>
              </div>
            </div>

            <div className="ds-hero-media">
              <div className="ds-hero-photo-main">
                <Image
                  src="/images/hero-main.jpg"
                  alt="Skilled Kenyan electrician installing architectural pendant lighting in a sunlit Nairobi home"
                  fill
                  priority
                  sizes="(max-width: 980px) 100vw, 48vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="ds-hero-photo-strip">
                <div className="ds-hero-photo-sub">
                  <Image
                    src="/images/hero-secondary.jpg"
                    alt="Kenyan plumbing specialist consulting with a homeowner in a modern kitchen"
                    fill
                    sizes="(max-width: 980px) 50vw, 24vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="ds-hero-trust-card">
                  <div>
                    <span className="ds-eyebrow" style={{ marginBottom: 6 }}>
                      Built for Kenya
                    </span>
                    <strong>Clear starting prices &amp; direct quotes</strong>
                  </div>
                  <p>
                    Browse Nairobi estates and Kenyan counties with KES pricing, weekly EAT availability, and
                    request-linked messaging.
                  </p>
                  <Link
                    href="/browse"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    style={{ justifySelf: 'start' }}
                  >
                    Explore directory
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Service Categories */}
        <section id="explore" className="ds-section">
          <div className="ds-container">
            <Reveal>
              <div className="ds-section-head">
                <div>
                  <span className="ds-eyebrow">Service directory</span>
                  <h2>Popular service categories</h2>
                  <p>
                    Explore skilled specialists across 12 everyday home, automotive, wellness, and commercial trades.
                  </p>
                </div>
                <Link className="ds-btn ds-btn-secondary" href="/browse">
                  View all services
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>

            <StaggerGrid className="ds-cat-grid">
              {HOMEPAGE_CATEGORIES.map((category) => (
                <StaggerItem key={category.slug}>
                  <CategoryCard category={category} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* Featured Professionals */}
        <section id="featured" className="ds-section" style={{ background: 'var(--bg-elevated)' }}>
          <div className="ds-container">
            <Reveal>
              <div className="ds-section-head">
                <div>
                  <span className="ds-eyebrow">
                    {hasLiveListings ? 'Live marketplace profiles' : 'Illustrative marketplace preview'}
                  </span>
                  <h2>Featured professionals</h2>
                  <p>
                    {hasLiveListings
                      ? 'Approved local professionals currently accepting booking and quotation requests on Doorstep.'
                      : 'Illustrative Kenyan profiles demonstrating starting prices, locations, and service scopes. Live professionals appear here as categories are approved.'}
                  </p>
                </div>
                <Link className="ds-btn ds-btn-primary" href="/browse">
                  Find a Professional
                </Link>
              </div>
            </Reveal>

            <StaggerGrid className="ds-pro-grid">
              {featuredProfessionals.map((pro) => (
                <StaggerItem key={`${pro.source}-${pro.id}`}>
                  <ProfessionalCard item={pro} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* How Doorstep Works */}
        <section id="how-it-works" className="ds-section">
          <div className="ds-container">
            <Reveal>
              <div className="ds-section-head">
                <div>
                  <span className="ds-eyebrow">Simple 3-step workflow</span>
                  <h2>How Doorstep works</h2>
                  <p>
                    From initial search to completed job, keep scope, timing, and quotes clear in one place.
                  </p>
                </div>
              </div>
            </Reveal>

            <StaggerGrid className="ds-steps-grid">
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.step}>
                    <article className="ds-step-card">
                      <div className="ds-step-num">
                        <span>{item.step}</span>
                        <Icon size={22} aria-hidden="true" />
                      </div>
                      <h3>{item.title}</h3>
                      <p className="ds-muted">{item.text}</p>
                    </article>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          </div>
        </section>

        {/* Why Choose Doorstep */}
        <section id="why-doorstep" className="ds-section" style={{ background: 'var(--bg-elevated)' }}>
          <div className="ds-container">
            <Reveal>
              <div className="ds-section-head">
                <div>
                  <span className="ds-eyebrow">Built for clarity and trust</span>
                  <h2>Why choose Doorstep?</h2>
                  <p>
                    Honest professional listings without inflated claims — every badge, quote, and review stays backed by
                    real records.
                  </p>
                </div>
              </div>
            </Reveal>

            <StaggerGrid className="ds-pillars-grid">
              {WHY_DOORSTEP.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <StaggerItem key={pillar.title}>
                    <article className="ds-pillar-card">
                      <div className="ds-pillar-icon" aria-hidden="true">
                        <Icon size={20} />
                      </div>
                      <h3>{pillar.title}</h3>
                      <p className="ds-muted" style={{ fontSize: '0.92rem' }}>
                        {pillar.text}
                      </p>
                    </article>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          </div>
        </section>

        {/* About & Help Centre FAQ */}
        <section id="about" className="ds-section">
          <div className="ds-container ds-faq-grid">
            <Reveal>
              <div style={{ display: 'grid', gap: 14 }}>
                <span className="ds-eyebrow">About Doorstep · Help Centre</span>
                <h2 id="faq">Clear answers before you book or list</h2>
                <p className="ds-muted">
                  Doorstep connects Kenyan households and businesses with skilled tradespeople — from plumbers and
                  electricians to carpenters, stylists, mechanics, and technicians — through structured requests and
                  transparent communication.
                </p>
                <div className="ds-actions-row" style={{ paddingTop: 6 }}>
                  <Link className="ds-btn ds-btn-secondary ds-btn-sm" href="/terms">
                    Marketplace Terms
                  </Link>
                  <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/privacy">
                    Privacy Information
                  </Link>
                </div>
              </div>
            </Reveal>

            <div className="ds-faq-list">
              {FAQ_ITEMS.map((item) => (
                <details className="ds-faq-item" key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Become a Provider CTA */}
        <section id="become-provider" className="ds-section-tight">
          <div className="ds-container">
            <Reveal>
              <div className="ds-provider-banner">
                <div className="ds-provider-banner-copy">
                  <span className="ds-eyebrow" style={{ color: 'var(--amber)' }}>
                    For Kenyan tradespeople &amp; specialists
                  </span>
                  <h2>Your skills deserve more customers.</h2>
                  <p>
                    Showcase your work, attract new clients and grow your business with Doorstep. Set your own KES
                    starting prices, manage weekly availability, and respond to local requests with clear quotes.
                  </p>
                  <div className="ds-actions-row" style={{ paddingTop: 8 }}>
                    <Link className="ds-btn ds-btn-amber ds-btn-lg" href="/register?role=provider">
                      Start Selling Your Services
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="ds-provider-banner-media">
                  <Image
                    src="/images/provider-cta.jpg"
                    alt="Kenyan master carpenter standing in his sunlit woodworking workshop"
                    fill
                    sizes="(max-width: 860px) 100vw, 48vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </PageFade>
  );
}
