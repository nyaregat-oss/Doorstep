import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Marketplace information | Doorstep' };

export default function TermsPage() {
  return <main className="wrap auth-wrap">
    <a className="logo" href="/"><i/>Doorstep</a>
    <section className="card auth-card">
      <p className="eyebrow">Marketplace information · pre-launch draft</p>
      <h1>Before you make a service agreement</h1>
      <p>This page describes the current prototype and is not Doorstep’s final customer or provider agreement. Kenyan counsel must approve the marketplace roles, provider terms, cancellation and refund rules, consumer disclosures, and worker relationship before live jobs begin.</p>
      <h2>Quotes and scope</h2>
      <p>A starting price is an estimate from a listing, not a final price. Before agreeing to work, the customer and provider should record the task scope, parts and labour, total price and any taxes or additional fees, timing, materials, and cancellation/rescheduling terms.</p>
      <h2>Requests and cancellation in this prototype</h2>
      <p>A booking or quotation request is not a payment. The customer may cancel a pending or accepted request from the customer workspace. The current prototype does not collect money, issue refunds, or provide escrow. It has no final cancellation or refund policy for work that has started; that policy must be approved before launch.</p>
      <h2>Provider roles and responsibility</h2>
      <p>The “provider” account type is a marketplace role in the prototype. It does not determine whether a person is an employee, independent provider, agent, or another legal category. Doorstep does not guarantee a service outcome, professional licence, insurance cover, or safety. Category and licence checks are not yet approved for live work.</p>
      <h2>Safety and complaints</h2>
      <p>Do not accept work beyond your training, licence, or safe working conditions. Stop work if an immediate hazard arises. Use the <a href="/report">report form</a> to record a safety issue or complaint; it is not an emergency response service.</p>
      <p className="note">This draft must not be used as a substitute for final platform terms or consumer disclosures. Doorstep remains in development and live service categories are disabled until compliance review is recorded.</p>
      <a className="auth-link" href="/privacy">Read the pre-launch privacy information</a>
    </section>
  </main>;
}
