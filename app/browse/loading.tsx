import { CardSkeleton } from '@/components/ui/skeleton';

export default function BrowseLoading() {
  return (
    <main className="ds-container ds-browse-page" aria-busy="true" aria-label="Loading services">
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div className="ds-skeleton" style={{ height: 14, width: 160 }} />
        <div className="ds-skeleton" style={{ height: 38, width: 320 }} />
      </div>
      <div className="ds-card" style={{ padding: 18, marginBottom: 24 }}>
        <div className="ds-skeleton" style={{ height: 64, width: '100%' }} />
      </div>
      <div className="ds-pro-grid">
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <CardSkeleton key={key} />
        ))}
      </div>
    </main>
  );
}
