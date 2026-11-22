'use client';

import type { ReactNode } from 'react';
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  ClipboardList,
  FolderKanban,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  UserCheck,
  FileWarning,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type DashboardIconName =
  | 'overview'
  | 'requests'
  | 'services'
  | 'portfolio'
  | 'availability'
  | 'reviews'
  | 'analytics'
  | 'settings'
  | 'messages'
  | 'saved'
  | 'shield'
  | 'verifications'
  | 'privacy'
  | 'reports';

const DASH_ICONS = {
  overview: LayoutDashboard,
  requests: ClipboardList,
  services: Briefcase,
  portfolio: FolderKanban,
  availability: CalendarClock,
  reviews: Star,
  analytics: BarChart3,
  settings: Settings,
  messages: MessageSquare,
  saved: Heart,
  shield: ShieldCheck,
  verifications: UserCheck,
  privacy: Lock,
  reports: FileWarning,
} as const;

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: DashboardIconName;
  badge?: number;
};

export function DashboardShell({
  roleLabel,
  userTitle,
  userSubtitle,
  items,
  activeTab,
  onSelectTab,
  headerActions,
  sidebarFooter,
  children,
}: {
  roleLabel: string;
  userTitle: string;
  userSubtitle?: string;
  items: DashboardNavItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ds-container ds-dash-shell">
      <aside className="ds-card ds-dash-sidebar" aria-label="Workspace navigation">
        <div className="ds-dash-user">
          <span className="ds-eyebrow" style={{ marginBottom: 4 }}>
            {roleLabel}
          </span>
          <strong>{userTitle}</strong>
          {userSubtitle && (
            <span className="ds-muted" style={{ fontSize: '0.84rem', overflowWrap: 'anywhere' }}>
              {userSubtitle}
            </span>
          )}
        </div>

        <nav className="ds-dash-nav">
          {items.map((item) => {
            const Icon = DASH_ICONS[item.icon] || LayoutDashboard;
            const active = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                className={`ds-dash-nav-btn ${active ? 'is-active' : ''}`}
                onClick={() => onSelectTab(item.id)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="ds-dash-nav-label">
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <Badge tone={active ? 'amber' : 'navy'}>{item.badge}</Badge>
                )}
              </button>
            );
          })}
        </nav>

        {sidebarFooter && (
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--line)', display: 'grid', gap: 8 }}>
            {sidebarFooter}
          </div>
        )}
      </aside>

      <div className="ds-dash-main">
        <div className="ds-mobile-dash-tabs" role="tablist" aria-label="Workspace sections">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === activeTab}
              className={`ds-chip ${item.id === activeTab ? 'is-active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && <strong>({item.badge})</strong>}
            </button>
          ))}
        </div>

        {headerActions}
        {children}
      </div>
    </div>
  );
}
