import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = { title: 'Marketplace Terms & Information | Doorstep' };

export default function TermsPage() {
  return (
    <main className="ds-container ds-prose-wrap">
      <Link className="ds-back-link" href="/">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Doorstep
      </Link>

      <section className="ds-card ds-prose-card">
        <span className="ds-eyebrow">
          <FileText size={14} aria-hidden="true" />
          Marketplace information · pre-launch draft
        </span>
        <h1>Before you make a service agreement</h1>
        <p className="ds-muted">
          This page describes the current Doorstep prototype and is not Doorstep&apos;s final customer or provider
          agreement. Kenyan legal counsel must approve final marketplace roles, consumer disclosures, cancellation and
          refund policies, and worker terms before live commercial jobs begin.
        </p>

        <div className="ds-prose-section">
          <h2>Quotes and job scope</h2>
          <p>
            A starting price shown on a service listing is an estimate, not a final binding price. Before confirming
            work, customers and providers should confirm task scope, parts and labour, total KES amount, any additional
            fees, timing, and rescheduling expectations inside their request thread.
          </p>
        </div>

        <div className="ds-prose-section">
          <h2>Requests, payments &amp; cancellation</h2>
          <p>
            Submitting a booking or quotation request does not charge your account or M-Pesa wallet. Customers may cancel
            pending or accepted requests from their customer workspace. Doorstep does not currently process payments,
            hold escrow, or issue refunds.
          </p>
        </div>

        <div className="ds-prose-section">
          <h2>Provider independence &amp; responsibility</h2>
          <p>
            The &ldquo;provider&rdquo; account type identifies service sellers on the platform and does not create an
            employment or agency relationship. Doorstep does not guarantee service outcomes or professional competence;
            verified badges appear only where compliance staff have approved submitted credentials.
          </p>
        </div>

        <div className="ds-prose-section">
          <h2>Safety &amp; reporting</h2>
          <p>
            Never proceed with work beyond your licence, training, or safe working conditions. Stop work immediately if
            an environmental or electrical hazard arises. Use our{' '}
            <Link href="/report" style={{ textDecoration: 'underline', fontWeight: 600 }}>
              safety report centre
            </Link>{' '}
            to log concerns — for immediate emergencies, contact local Kenyan emergency services first.
          </p>
        </div>

        <div className="ds-actions-row" style={{ paddingTop: 8 }}>
          <Link className="ds-btn ds-btn-secondary ds-btn-sm" href="/privacy">
            Read privacy information
          </Link>
          <Link className="ds-btn ds-btn-ghost ds-btn-sm" href="/browse">
            Explore services
          </Link>
        </div>
      </section>
    </main>
  );
}
