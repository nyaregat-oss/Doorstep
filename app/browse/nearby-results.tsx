'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { roundToApproximate } from '@/lib/location';

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

export function NearbyResults({ configured, query, location, category, maxPrice, availability }: {
  configured: boolean;
  query: string;
  location: string;
  category: string;
  maxPrice?: number;
  availability: string;
}) {
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
      setMessage('Location rounded to an approximate area for this search. It is not saved in your profile.');
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
      (position) => { void search(position.coords.latitude, position.coords.longitude); },
      () => {
        setBusy(false);
        setMessage('Location was not shared. Use the manual area filter; GPS is optional.');
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    );
  }

  const formatPrice = (price: number | string, currency: string) => {
    try { return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price)); }
    catch { return `${currency} ${Number(price).toLocaleString('en-KE')}`; }
  };

  return <section className="browse-results-section nearby-section" aria-labelledby="nearby-heading">
    <div className="panel-heading"><div><h2 id="nearby-heading">Nearby recommendations</h2><p className="muted">Optional: use your location to rank providers by distance. Doorstep sends coordinates rounded to an approximate area for this search and does not save them in marketplace tables.</p></div></div>
    <div className="nearby-controls">
      <label>Search radius<select value={radius} onChange={(event) => { setRadius(Number(event.target.value)); setResults([]); setSearched(false); }}><option value={5}>5 km</option><option value={10}>10 km</option><option value={25}>25 km</option><option value={50}>50 km</option></select></label>
      <button className="btn" type="button" onClick={useLocation} disabled={busy}>{busy ? 'Finding nearby services…' : 'Use my location'}</button>
    </div>
    {message && <p className="note" role="status">{message}</p>}
    {searched && results.length === 0 && <p className="card browse-empty">No eligible live providers with a service-area center were found within {radius} km. Keep using the manual area search above.</p>}
    {results.length > 0 && <div className="browse-grid">{results.map((item) => <article className="card browse-card" key={item.service_id}>
      <div className="browse-card-heading"><div className="av" aria-hidden="true">{item.business_name.trim().slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">{item.category}</p><h3>{item.business_name}</h3></div></div>
      <p className="browse-service-title">{item.service_name}</p>
      {item.description && <p className="muted">{item.description}</p>}
      <p className="browse-location">{item.location} · {Number(item.distance_km).toFixed(1)} km away</p>
      <p className="browse-price">From {formatPrice(item.starting_price, item.currency)}</p>
      <div className="browse-card-foot"><span className="tag">Provider listing</span><a className="btn ghost small" href={`/providers/${item.provider_id}`}>View profile</a></div>
    </article>)}</div>}
  </section>;
}
