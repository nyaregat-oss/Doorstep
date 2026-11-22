'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, LayoutDashboard, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { useTheme } from '@/app/theme-provider';
import { logoutAction } from '@/app/auth-actions';

export type HeaderSession = {
  signedIn: boolean;
  dashboardHref: string;
  unreadNotifications: number;
  label?: string;
};

const NAV_ITEMS = [
  { label: 'Explore Services', href: '/browse' },
  { label: 'Find Professionals', href: '/browse?sort=newest' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Become a Provider', href: '/register?role=provider' },
];

export function SiteHeaderClient({ session }: { session: HeaderSession }) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="ds-header">
      <div className="ds-container ds-header-inner">
        <BrandLogo />

        <nav className="ds-nav-links" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/browse' && pathname.startsWith('/browse');
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`ds-nav-link ${active ? 'is-active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ds-header-actions">
          <button
            type="button"
            id="theme-toggle"
            className="ds-icon-btn"
            aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
            onClick={toggle}
          >
            {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>

          {session.signedIn ? (
            <div className="ds-desktop-auth ds-actions-row">
              <Link className="ds-icon-btn" href={session.dashboardHref} aria-label="Notifications and workspace">
                <Bell size={18} aria-hidden="true" />
                {session.unreadNotifications > 0 && <span className="ds-unread-dot" aria-hidden="true" />}
              </Link>
              <Link className="ds-btn ds-btn-primary ds-btn-sm" href={session.dashboardHref}>
                <LayoutDashboard size={15} aria-hidden="true" />
                Dashboard
              </Link>
              <form action={logoutAction}>
                <button className="ds-btn ds-btn-ghost ds-btn-sm" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="ds-desktop-auth ds-actions-row">
              <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/login">
                Sign In
              </Link>
              <Link className="ds-btn ds-btn-primary ds-btn-sm" href="/register">
                Get Started
              </Link>
            </div>
          )}

          <button
            type="button"
            className="ds-icon-btn ds-mobile-toggle"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="ds-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setMenuOpen(false);
            }}
          >
            <motion.div
              className="ds-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ds-drawer-head">
                <BrandLogo />
                <button
                  type="button"
                  className="ds-icon-btn"
                  aria-label="Close navigation menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="ds-drawer-nav" aria-label="Mobile navigation">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={pathname === item.href ? 'is-active' : ''}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
                <Link href="/report" onClick={() => setMenuOpen(false)}>
                  <span>Report a Concern</span>
                </Link>
              </nav>

              <div className="ds-drawer-actions">
                {session.signedIn ? (
                  <>
                    <Link
                      className="ds-btn ds-btn-primary ds-btn-full"
                      href={session.dashboardHref}
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} aria-hidden="true" />
                      Open Workspace
                      {session.unreadNotifications > 0 ? ` (${session.unreadNotifications})` : ''}
                    </Link>
                    <form action={logoutAction}>
                      <button className="ds-btn ds-btn-ghost ds-btn-full" type="submit">
                        <LogOut size={16} aria-hidden="true" />
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      className="ds-btn ds-btn-primary ds-btn-full"
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                    <Link
                      className="ds-btn ds-btn-secondary ds-btn-full"
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
