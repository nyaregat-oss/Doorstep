import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

type BadgeTone = 'neutral' | 'navy' | 'amber' | 'success' | 'warning' | 'danger';

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return <span className={`ds-badge ds-badge-${tone} ${className}`}>{children}</span>;
}

export function VerifiedBadge() {
  return (
    <Badge tone="success">
      <ShieldCheck size={13} aria-hidden="true" />
      Verified
    </Badge>
  );
}
