export function CardSkeleton() {
  return (
    <div className="ds-card" style={{ overflow: 'hidden' }} aria-hidden="true">
      <div className="ds-skeleton" style={{ width: '100%', aspectRatio: '16 / 10', borderRadius: 0 }} />
      <div style={{ padding: 18, display: 'grid', gap: 10 }}>
        <div className="ds-skeleton" style={{ height: 12, width: '40%' }} />
        <div className="ds-skeleton" style={{ height: 20, width: '75%' }} />
        <div className="ds-skeleton" style={{ height: 14, width: '90%' }} />
        <div className="ds-skeleton" style={{ height: 14, width: '55%' }} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="ds-container ds-dash-shell" aria-busy="true" aria-label="Loading workspace">
      <div className="ds-card ds-dash-sidebar" style={{ gap: 12 }}>
        <div className="ds-skeleton" style={{ height: 40, width: '80%' }} />
        <div className="ds-skeleton" style={{ height: 36, width: '100%' }} />
        <div className="ds-skeleton" style={{ height: 36, width: '100%' }} />
        <div className="ds-skeleton" style={{ height: 36, width: '100%' }} />
        <div className="ds-skeleton" style={{ height: 36, width: '100%' }} />
      </div>
      <div className="ds-dash-main">
        <div className="ds-skeleton" style={{ height: 42, width: 280 }} />
        <div className="ds-kpi-grid">
          {[1, 2, 3, 4].map((key) => (
            <div className="ds-card ds-kpi-card" key={key}>
              <div className="ds-skeleton" style={{ height: 14, width: '55%' }} />
              <div className="ds-skeleton" style={{ height: 28, width: '40%' }} />
            </div>
          ))}
        </div>
        <div className="ds-card ds-panel">
          <div className="ds-skeleton" style={{ height: 120, width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
