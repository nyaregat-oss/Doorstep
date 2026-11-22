import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { formatCurrency, getCategoryImage } from '@/lib/kenya';
import { Badge, VerifiedBadge } from '@/components/ui/badge';
import { RatingStars } from '@/components/ui/rating-stars';

export type ProfessionalCardData = {
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
  imageUrl?: string;
  verified?: boolean;
  rating?: number | null;
  reviewCount?: number;
  availabilityLabel?: string;
  distanceKm?: number;
};

export function ProfessionalCard({ item }: { item: ProfessionalCardData }) {
  const imageSrc = item.imageUrl || getCategoryImage(item.category);
  return (
    <article className="ds-pro-card">
      <div className="ds-pro-media">
        <Image
          src={imageSrc}
          alt={`${item.businessName} — ${item.category}`}
          fill
          unoptimized={imageSrc.startsWith('http')}
          sizes="(max-width: 680px) 100vw, (max-width: 1040px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="ds-pro-media-badges">
          {item.source === 'sample' ? (
            <Badge tone="amber">Sample listing</Badge>
          ) : (
            <Badge tone="navy">Live provider</Badge>
          )}
          {item.source === 'live' && item.verified === true && <VerifiedBadge />}
        </div>
      </div>

      <div className="ds-pro-body">
        <div className="ds-pro-meta">
          <span>{item.category}</span>
          {item.source === 'live' && typeof item.rating === 'number' && (item.reviewCount ?? 0) > 0 && (
            <RatingStars rating={item.rating} count={item.reviewCount} />
          )}
        </div>

        <h3 className="ds-pro-name">{item.businessName}</h3>
        <p className="ds-pro-service">{item.serviceName}</p>
        {item.description && <p className="ds-pro-desc">{item.description}</p>}

        <p className="ds-pro-loc">
          <MapPin size={14} aria-hidden="true" />
          <span>
            {item.location}
            {typeof item.distanceKm === 'number' ? ` · ${item.distanceKm.toFixed(1)} km away` : ''}
          </span>
        </p>

        {item.availabilityLabel && (
          <p className="ds-muted" style={{ fontSize: '0.8rem' }}>
            {item.availabilityLabel}
          </p>
        )}

        <div className="ds-pro-foot">
          <div className="ds-pro-price">
            <span>Starting from</span>
            <strong className="tabular-nums">{formatCurrency(item.price, item.currency)}</strong>
          </div>
          <Link className="ds-btn ds-btn-secondary ds-btn-sm" href={`/providers/${item.providerId}`}>
            View Profile
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
