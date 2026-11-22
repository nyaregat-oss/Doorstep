'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { KENYAN_LOCATIONS, QUICK_AREA_FILTERS } from '@/lib/kenya';

export type BrowseFilterValues = {
  q: string;
  location: string;
  category: string;
  maxPrice: string;
  availability: string;
  verifiedOnly: boolean;
  minRating: string;
  sort: string;
};

export function BrowseControls({
  values,
  categoryNames,
  hasRealReviews,
}: {
  values: BrowseFilterValues;
  categoryNames: string[];
  hasRealReviews: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const areaHref = (areaValue: string) => {
    const query = new URLSearchParams();
    if (values.q) query.set('q', values.q);
    if (areaValue) query.set('location', areaValue);
    if (values.category) query.set('category', values.category);
    if (values.maxPrice) query.set('max_price', values.maxPrice);
    if (values.availability) query.set('availability', values.availability);
    if (values.verifiedOnly) query.set('verified', '1');
    if (values.minRating) query.set('min_rating', values.minRating);
    if (values.sort && values.sort !== 'newest') query.set('sort', values.sort);
    const s = query.toString();
    return `/browse${s ? `?${s}` : ''}`;
  };

  const activeChips: Array<{ label: string; removeHref: string }> = [];
  const withoutParam = (key: keyof BrowseFilterValues) => {
    const next = { ...values };
    if (key === 'verifiedOnly') next.verifiedOnly = false;
    else if (key === 'sort') next.sort = 'newest';
    else next[key] = '';
    const query = new URLSearchParams();
    if (next.q) query.set('q', next.q);
    if (next.location) query.set('location', next.location);
    if (next.category) query.set('category', next.category);
    if (next.maxPrice) query.set('max_price', next.maxPrice);
    if (next.availability) query.set('availability', next.availability);
    if (next.verifiedOnly) query.set('verified', '1');
    if (next.minRating) query.set('min_rating', next.minRating);
    if (next.sort && next.sort !== 'newest') query.set('sort', next.sort);
    const s = query.toString();
    return `/browse${s ? `?${s}` : ''}`;
  };

  if (values.q) activeChips.push({ label: `Service: ${values.q}`, removeHref: withoutParam('q') });
  if (values.location) activeChips.push({ label: `Area: ${values.location}`, removeHref: withoutParam('location') });
  if (values.category) activeChips.push({ label: `Category: ${values.category}`, removeHref: withoutParam('category') });
  if (values.maxPrice) activeChips.push({ label: `Max: KES ${values.maxPrice}`, removeHref: withoutParam('maxPrice') });
  if (values.availability) activeChips.push({ label: `When: ${values.availability}`, removeHref: withoutParam('availability') });
  if (values.verifiedOnly) activeChips.push({ label: 'Verified providers only', removeHref: withoutParam('verifiedOnly') });
  if (values.minRating) activeChips.push({ label: `${values.minRating}+ stars`, removeHref: withoutParam('minRating') });

  const renderFilterFields = (idPrefix: string) => (
    <>
      <label className="ds-field" htmlFor={`${idPrefix}-q`}>
        Service or keyword
        <input
          id={`${idPrefix}-q`}
          className="ds-input"
          name="q"
          maxLength={80}
          defaultValue={values.q}
          placeholder="What do you need?"
        />
      </label>

      <label className="ds-field" htmlFor={`${idPrefix}-location`}>
        County, town, or estate
        <input
          id={`${idPrefix}-location`}
          className="ds-input"
          name="location"
          maxLength={80}
          defaultValue={values.location}
          placeholder="e.g. Westlands, Nyali"
          list="ds-browse-areas"
        />
        <datalist id="ds-browse-areas">
          {KENYAN_LOCATIONS.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
      </label>

      <label className="ds-field" htmlFor={`${idPrefix}-category`}>
        Category
        <select id={`${idPrefix}-category`} className="ds-select" name="category" defaultValue={values.category}>
          <option value="">All categories</option>
          {categoryNames.map((name) => (
            <option value={name} key={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="ds-field" htmlFor={`${idPrefix}-price`}>
        Maximum budget (KES)
        <input
          id={`${idPrefix}-price`}
          className="ds-input"
          name="max_price"
          type="number"
          min="0"
          step="100"
          defaultValue={values.maxPrice}
          placeholder="Any budget"
        />
      </label>

      <label className="ds-field" htmlFor={`${idPrefix}-availability`}>
        Availability
        <select
          id={`${idPrefix}-availability`}
          className="ds-select"
          name="availability"
          defaultValue={values.availability}
        >
          <option value="">Any availability</option>
          <option value="today">Available today</option>
          <option value="tomorrow">Available tomorrow</option>
          <option value="this-week">Available this week</option>
          <option value="weekends">Available weekends</option>
        </select>
      </label>

      <label className="ds-field" htmlFor={`${idPrefix}-rating`}>
        Minimum rating
        <select
          id={`${idPrefix}-rating`}
          className="ds-select"
          name="min_rating"
          defaultValue={values.minRating}
          disabled={!hasRealReviews}
          aria-label="Minimum rating"
        >
          {hasRealReviews ? (
            <>
              <option value="">Any rating</option>
              <option value="4">4.0+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </>
          ) : (
            <option value="">Ratings unlock after real reviews exist</option>
          )}
        </select>
      </label>

      <label className="ds-field" htmlFor={`${idPrefix}-sort`}>
        Sort by
        <select id={`${idPrefix}-sort`} className="ds-select" name="sort" defaultValue={values.sort}>
          <option value="newest">Recently added</option>
          <option value="price">Lowest starting price</option>
          <option value="price_desc">Highest starting price</option>
        </select>
      </label>

      <div style={{ display: 'grid', gap: 10 }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <input type="checkbox" name="verified" value="1" defaultChecked={values.verifiedOnly} />
          <span>Verified providers only</span>
        </label>
        <div className="ds-filter-actions">
          <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit">
            Apply filters
          </button>
          <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/browse">
            Clear all
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="ds-area-strip" aria-label="Quick Kenyan location filters">
        {QUICK_AREA_FILTERS.map((area) => {
          const isCurrent =
            (!area.value && !values.location) ||
            (area.value && values.location.toLowerCase().includes(area.value.toLowerCase()));
          return (
            <Link
              key={area.label}
              href={areaHref(area.value)}
              className={`ds-chip ${isCurrent ? 'is-active' : ''}`}
            >
              {area.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop Filter Form */}
      <form className="ds-card ds-filter-bar ds-filter-bar-desktop" action="/browse" method="get">
        {renderFilterFields('desktop')}
      </form>

      {/* Mobile Filter Trigger */}
      <div className="ds-mobile-filter-bar">
        <button
          type="button"
          className="ds-btn ds-btn-secondary ds-btn-sm"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          Filter &amp; Sort
          {activeChips.length > 0 ? ` (${activeChips.length})` : ''}
        </button>
        {activeChips.length > 0 && (
          <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/browse">
            Clear filters
          </Link>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="ds-active-filters" aria-label="Active filters">
          {activeChips.map((chip) => (
            <Link key={chip.label} href={chip.removeHref} className="ds-chip is-active">
              <span>{chip.label}</span>
              <X size={13} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="ds-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setDrawerOpen(false);
            }}
          >
            <motion.div
              className="ds-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Filter services"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22 }}
            >
              <div className="ds-drawer-head">
                <h2 style={{ fontSize: '1.2rem' }}>Filter &amp; Sort</h2>
                <button
                  type="button"
                  className="ds-icon-btn"
                  aria-label="Close filters"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <form action="/browse" method="get" style={{ display: 'grid', gap: 14 }}>
                {renderFilterFields('mobile')}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
