'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';
import { categories } from '@/lib/catalog';
import { KENYAN_LOCATIONS } from '@/lib/kenya';

export function SearchBar({
  defaultService = '',
  defaultLocation = '',
  compact = false,
}: {
  defaultService?: string;
  defaultLocation?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [service, setService] = useState(defaultService);
  const [location, setLocation] = useState(defaultLocation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (service.trim()) query.set('q', service.trim());
    if (location.trim()) query.set('location', location.trim());
    const qs = query.toString();
    router.push(`/browse${qs ? `?${qs}` : ''}`);
  }

  return (
    <form className="ds-search-bar" onSubmit={handleSubmit} role="search" aria-label="Search local services">
      <div className="ds-search-field">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor={compact ? 'search-service-compact' : 'search-service'}>
          What service do you need?
        </label>
        <input
          id={compact ? 'search-service-compact' : 'search-service'}
          name="service"
          list="ds-service-suggestions"
          placeholder="What service do you need?"
          value={service}
          onChange={(event) => setService(event.target.value)}
        />
        <datalist id="ds-service-suggestions">
          {categories.map(([name]) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>
      <div className="ds-search-field ds-search-divider">
        <MapPin size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor={compact ? 'search-location-compact' : 'search-location'}>
          Your location
        </label>
        <input
          id={compact ? 'search-location-compact' : 'search-location'}
          name="location"
          list="ds-kenya-locations"
          placeholder="Your location (e.g. Westlands, Nairobi)"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <datalist id="ds-kenya-locations">
          {KENYAN_LOCATIONS.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
      </div>
      <button className="ds-btn ds-btn-amber" type="submit">
        Search
      </button>
    </form>
  );
}
