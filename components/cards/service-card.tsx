import { MapPin, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/kenya';

export function ServiceCard({
  name,
  description,
  price,
  currency,
  category,
  location,
  selected = false,
  onSelect,
}: {
  name: string;
  description?: string;
  price: number | string;
  currency: string;
  category?: string;
  location?: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <article className={`ds-service-row ${selected ? 'is-selected' : ''}`}>
      <div className="ds-service-row-top">
        <div style={{ display: 'grid', gap: 4 }}>
          <h3>{name}</h3>
          {(category || location) && (
            <div className="ds-actions-row ds-muted" style={{ fontSize: '0.82rem' }}>
              {category && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={13} aria-hidden="true" />
                  {category}
                </span>
              )}
              {location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} aria-hidden="true" />
                  {location}
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="ds-muted" style={{ fontSize: '0.76rem', display: 'block' }}>
            Starting from
          </span>
          <strong className="tabular-nums" style={{ fontSize: '1.05rem' }}>
            {formatCurrency(price, currency)}
          </strong>
        </div>
      </div>
      {description && (
        <p className="ds-muted" style={{ fontSize: '0.92rem' }}>
          {description}
        </p>
      )}
      {onSelect && (
        <div>
          <button
            type="button"
            className={`ds-btn ds-btn-sm ${selected ? 'ds-btn-amber' : 'ds-btn-secondary'}`}
            onClick={onSelect}
          >
            {selected ? 'Selected for request' : 'Request this service'}
          </button>
        </div>
      )}
    </article>
  );
}
