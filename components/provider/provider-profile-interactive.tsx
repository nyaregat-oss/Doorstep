'use client';

import { useState, type ReactNode } from 'react';
import { ServiceCard } from '@/components/cards/service-card';
import { RequestServiceForm } from '@/app/providers/[id]/request-service-form';
import { SampleBookingForm } from '@/app/providers/[id]/sample-booking-form';

export type ProfileServiceItem = {
  id: string;
  name: string;
  description?: string;
  starting_price: number | string;
  currency: string;
};

export function ProviderProfileInteractive({
  mode,
  category,
  location,
  services,
  mainBeforeBooking,
  asideAboveBooking,
  asideBelowBooking,
}: {
  mode: 'live' | 'sample';
  category: string;
  location: string;
  services: ProfileServiceItem[];
  mainBeforeBooking?: ReactNode;
  asideAboveBooking?: ReactNode;
  asideBelowBooking?: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(services[0]?.id || '');
  const [selectedName, setSelectedName] = useState(services[0]?.name || '');

  function selectService(item: ProfileServiceItem) {
    setSelectedId(item.id);
    setSelectedName(item.name);
    const form = document.getElementById('request-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return (
    <div className="ds-profile-layout">
      <div className="ds-profile-main">
        {mainBeforeBooking}

        <section className="ds-card ds-profile-block">
          <div>
            <h2>Services &amp; starting prices</h2>
            <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              Select a service below to pre-fill your booking or quotation request.
            </p>
          </div>

          {services.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  name={service.name}
                  description={service.description}
                  price={service.starting_price}
                  currency={service.currency}
                  category={category}
                  location={location}
                  selected={selectedId === service.id}
                  onSelect={() => selectService(service)}
                />
              ))}
            </div>
          ) : (
            <p className="ds-muted">No published services at the moment.</p>
          )}
        </section>

        {asideBelowBooking}
      </div>

      <aside className="ds-profile-aside">
        {asideAboveBooking}

        <section className="ds-card-elevated ds-profile-block">
          <div>
            <h2>{mode === 'sample' ? 'Preview a request' : 'Request this professional'}</h2>
            <p className="ds-muted" style={{ fontSize: '0.88rem', marginTop: 4 }}>
              Book a preferred slot or request a written KES quotation.
            </p>
          </div>
          {mode === 'live' ? (
            <RequestServiceForm services={services} selectedServiceId={selectedId} />
          ) : (
            <SampleBookingForm
              services={services.map((s) => ({
                name: s.name,
                price: Number(s.starting_price),
                currency: s.currency,
              }))}
              selectedServiceName={selectedName}
            />
          )}
        </section>
      </aside>
    </div>
  );
}
