export default function ProviderProfileLoading() {
  return (
    <main className="ds-container ds-profile-page" aria-busy="true" aria-label="Loading professional profile">
      <div className="ds-skeleton" style={{ height: 18, width: 140, marginBottom: 18 }} />
      <div className="ds-card" style={{ padding: 24, marginBottom: 24 }}>
        <div className="ds-skeleton" style={{ height: 76, width: '70%' }} />
      </div>
      <div className="ds-profile-layout">
        <div className="ds-profile-main">
          <div className="ds-card ds-profile-block">
            <div className="ds-skeleton" style={{ height: 140, width: '100%' }} />
          </div>
          <div className="ds-card ds-profile-block">
            <div className="ds-skeleton" style={{ height: 220, width: '100%' }} />
          </div>
        </div>
        <div className="ds-card ds-profile-block">
          <div className="ds-skeleton" style={{ height: 340, width: '100%' }} />
        </div>
      </div>
    </main>
  );
}
