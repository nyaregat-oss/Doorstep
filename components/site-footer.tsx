import Link from 'next/link';
import { Globe, Mail, Share2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

export function SiteFooter() {
  return (
    <footer className="ds-footer">
      <div className="ds-container">
        <div className="ds-footer-grid">
          <div className="ds-footer-brand">
            <BrandLogo variant="dark" />
            <p>
              Find trusted professionals. Get things done. Right at your doorstep. Built for Kenya&apos;s skilled
              trades and everyday home &amp; business needs.
            </p>
            <div className="ds-footer-socials" aria-label="Social and contact channels">
              <Link className="ds-footer-social-link" href="/#about" aria-label="Doorstep community">
                <Globe size={16} aria-hidden="true" />
              </Link>
              <Link className="ds-footer-social-link" href="/#faq" aria-label="Help Centre">
                <Share2 size={16} aria-hidden="true" />
              </Link>
              <Link className="ds-footer-social-link" href="/report" aria-label="Support and reports">
                <Mail size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="ds-footer-col">
            <h4>Marketplace</h4>
            <ul>
              <li>
                <Link href="/browse">Explore Services</Link>
              </li>
              <li>
                <Link href="/browse?sort=newest">Find Professionals</Link>
              </li>
              <li>
                <Link href="/#how-it-works">How It Works</Link>
              </li>
              <li>
                <Link href="/register?role=provider">Become a Provider</Link>
              </li>
            </ul>
          </div>

          <div className="ds-footer-col">
            <h4>Account &amp; Support</h4>
            <ul>
              <li>
                <Link href="/#about">About Doorstep</Link>
              </li>
              <li>
                <Link href="/#faq">Help Centre</Link>
              </li>
              <li>
                <Link href="/dashboard">My Workspace</Link>
              </li>
              <li>
                <Link href="/report">Contact &amp; Safety Report</Link>
              </li>
            </ul>
          </div>

          <div className="ds-footer-col">
            <h4>Trust &amp; Legal</h4>
            <ul>
              <li>
                <Link href="/terms">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/report">Report a Concern</Link>
              </li>
              <li>
                <Link href="/dashboard/compliance">Staff Compliance</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="ds-footer-bottom">
          <span>© 2026 Doorstep Marketplace · Kenya</span>
          <span>Sample listings are clearly labeled for preview purposes; live ratings &amp; checks require real records.</span>
        </div>
      </div>
    </footer>
  );
}
