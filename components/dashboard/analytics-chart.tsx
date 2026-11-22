export type ChartDatum = {
  label: string;
  value: number;
};

export function AnalyticsChart({
  title,
  subtitle,
  data,
  emptyLabel = 'No activity recorded yet.',
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  emptyLabel?: string;
}) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const hasAnyValue = data.some((item) => item.value > 0);

  return (
    <section className="ds-card ds-panel">
      <div>
        <h3>{title}</h3>
        {subtitle && (
          <p className="ds-muted" style={{ fontSize: '0.88rem', marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>

      {!hasAnyValue ? (
        <p className="ds-muted" style={{ fontSize: '0.92rem' }}>
          {emptyLabel}
        </p>
      ) : (
        <div className="ds-chart-wrap">
          <svg
            viewBox={`0 0 ${Math.max(420, data.length * 76)} 180`}
            role="img"
            aria-label={title}
            style={{ width: '100%', minWidth: 320, height: 180, display: 'block' }}
          >
            {data.map((item, idx) => {
              const barWidth = 36;
              const spacing = Math.max(64, Math.floor(420 / Math.max(data.length, 1)));
              const x = 28 + idx * spacing;
              const barMaxHeight = 112;
              const barHeight = Math.max(4, Math.round((item.value / maxValue) * barMaxHeight));
              const y = 132 - barHeight;
              return (
                <g key={item.label}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={item.value > 0 ? 'var(--amber)' : 'var(--line)'}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="var(--ink)"
                  >
                    {item.value}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={156}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--muted)"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
