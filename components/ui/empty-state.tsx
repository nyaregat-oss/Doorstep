import type { ReactNode } from 'react';
import Link from 'next/link';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ds-empty">
      <div className="ds-empty-icon" aria-hidden="true">
        {icon || <Inbox size={22} />}
      </div>
      <h3>{title}</h3>
      <p className="ds-muted" style={{ maxWidth: '44ch', fontSize: '0.93rem' }}>
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link className="ds-btn ds-btn-primary ds-btn-sm" href={actionHref}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" className="ds-btn ds-btn-primary ds-btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
