'use client';

import { useState } from 'react';
import { Compass, MapPin, Navigation } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { roundToApproximate } from '@/lib/location';
import { ProfessionalCard } from '@/components/cards/professional-card';

type NearbyService = {
  service_id: string;
  provider_id: string;
  business_name: string;
  service_name: string;
  description: string;
  location: string;
  category: string;
  starting_price: number | string;
  currency: string;
  distance_km: number | string;
};

export function NearbyResults({
  configured,
  query,
  location,
  category,
  maxPrice,
  availability,
}: {
  configured: boolean;
  query: string;
  location: string;
  category: string;
  maxPrice?: number;
  availability: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [radius, setRadius] = useState(10);
  const [results, setResults] = useState<NearbyService[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (!configured) return null;

  async function search(latitude: number, longitude: number) {
    setResults([]);
    setSearched(false);
    const approximateLatitude = roundToApproximate(latitude, -90, 90);
    const approximateLongitude = roundToApproximate(longitude, -180, 180);
    if (approximateLatitude === null || approximateLongitude === null) {
      setMessage('We could not read a valid location. Use the manual area filter instead.');
      setBusy(false);
      return;
    }
    try {
      const client = createBrowserSupabaseClient();
      const { data, error } = await client.rpc('nearby_provider_services', {
        p_latitude: approximateLatitude,
        p_longitude: approximateLongitude,
        p_radius_km: radius,
        p_query: query || null,
        p_location: location || null,
        p_category: category || null,
        p_max_price: maxPrice ?? null,
        p_availability: availability || null,
        p_limit: 50,
      });
      if (error) throw error;
      setResults((data || []) as NearbyService[]);
      setSearched(true);
      setMessage('Location rounded to an approximate area for this search and never saved in Doorstep tables.');
    } catch {
      setMessage('Nearby results are unavailable. Apply the nearby-discovery migration and try again.');
    } finally {
      setBusy(false);
    }
  }

  function useLocation() {
    setMessage('');
    setBusy(true);
    if (!navigator.geolocation) {
      setBusy(false);
      setMessage('This browser does not support location. Use the manual area filter instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void search(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setBusy(false);
        setMessage('Location was not shared. Use the manual area filter; GPS is optional.');
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    );
  }

  return (
    <section className="ds-card ds-nearby-box" aria-labelledby="nearby-heading">
      <div className="ds-nearby-head">
        <div>
          <span className="ds-eyebrow" style={{ marginBottom: 4 }}>
            <Compass size={14} aria-hidden="true" />
            Optional proximity discovery
          </span>
          <h2 id="nearby-heading" style={{ fontSize: '1.25rem' }}>
            Find services near your current area
          </h2>
          <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
            Coordinates are rounded to an approximate ~1 km grid before querying and are not stored.
          </p>
        </div>
        <button
          type="button"
          className="ds-btn ds-btn-secondary ds-btn-sm"
          onClick={() => setExpanded((value) => !value)}
        >
          <MapPin size={15} aria-hidden="true" />
          {expanded ? 'Hide area distance tool' : 'Open distance & radius view'}
        </button>
      </div>

      {expanded && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="ds-nearby-controls">
            <label className="ds-field" style={{ minWidth: 160 }}>
              Search radius
              <select
                className="ds-select"
                value={radius}
                onChange={(event) => {
                  setRadius(Number(event.target.value));
                  setResults([]);
                  setSearched(false);
                }}
              >
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
              </select>
            </label>
            <button className="ds-btn ds-btn-amber" type="button" onClick={useLocation} disabled={busy}>
              <Navigation size={15} aria-hidden="true" />
              {busy ? 'Finding nearby services…' : 'Use my location'}
            </button>
          </div>

          {message && (
            <p className="ds-muted" style={{ fontSize: '0.88rem' }} role="status">
              {message}
            </p>
          )}

          {searched && results.length === 0 && (
            <p className="ds-alert ds-alert-info">
              No eligible live providers with an approximate service-area center were found within {radius} km.
            </p>
          )}

          {results.length > 0 && (
            <div className="ds-pro-grid">
              {results.map((item) => (
                <ProfessionalCard
                  key={item.service_id}
                  item={{
                    id: item.service_id,
                    providerId: item.provider_id,
                    businessName: item.business_name,
                    serviceName: item.service_name,
                    description: item.description,
                    location: item.location,
                    category: item.category,
                    price: Number(item.starting_price),
                    currency: item.currency,
                    source: 'live',
                    distanceKm: Number(item.distance_km),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
