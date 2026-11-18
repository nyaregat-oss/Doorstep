'use client';

import { FormEvent, useState } from 'react';
import { useTheme } from './theme-provider';
import { categories } from '@/lib/catalog';
const people = ['Sample provider 01', 'Sample provider 02', 'Sample provider 03', 'Sample provider 04'];

function Header() {
  const { dark, toggle } = useTheme();
  return <header><a className="logo" href="#top"><i />Doorstep</a><nav aria-label="Main navigation">
    <a className="hide" href="#top">Home</a><a className="hide" href="/browse">Explore Services</a><a className="hide" href="#how">How It Works</a><a className="hide" href="#providers">Become a Provider</a><a className="hide" href="#about">About</a><a className="hide" href="/login">Login</a><a className="btn small" href="/register">Get Started</a>
    <button className="icon-btn" id="theme-toggle" type="button" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={toggle}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg></button>
  </nav></header>;
}

function Footer() { return <footer><div className="wrap"><div className="fgrid">
  <div><a className="logo footer-logo" href="#top"><i/>Doorstep</a><p>Every service. One connection.</p></div>
  <div><h4>Explore</h4><a href="/browse">Services</a><a href="/browse">Professionals</a><a href="#how">How it works</a></div>
  <div><h4>Company</h4><a href="#about">About</a><a href="#trust">Trust and safety</a><a href="#providers">Become a provider</a><a href="/dashboard/customer">Customer dashboard</a><a href="/dashboard/provider">Provider dashboard</a></div>
  <div><h4>Support</h4><a href="#faq">FAQ</a><a href="#join">Contact</a><span>Contact details will be published before launch.</span></div>
  </div><div className="legal"><span>© 2026 Doorstep</span><span>Sample content shown for demonstration.</span></div></div></footer>; }

export default function Home() {
  const [service, setService] = useState('Plumbing');
  const [signupMessage, setSignupMessage] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    const term = String(form.get('service') || '').trim();
    const area = String(form.get('location') || '').trim();
    const maxPrice = String(form.get('max_price') || '0');
    if (term) query.set('q', term);
    if (area) query.set('location', area);
    if (maxPrice !== '0') query.set('max_price', maxPrice);
    const serialized = query.toString();
    window.location.assign(`/browse${serialized ? `?${serialized}` : ''}`);
  }
  function submitSignup(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSignupMessage('Thanks. This is a preview, so nothing was saved or sent.'); }
  return <><div className="wrap"><Header/><main id="top">
    <div className="hero"><div><p className="eyebrow">Kenya's local services marketplace</p><h1>Find the Right Professional. Get Things Done.</h1><p className="lead">Discover local service providers, compare clear starting prices, and connect with the right people to get your work done.</p><div className="cta"><a className="btn" href="/browse">Find a professional</a><a className="btn alt" href="/register?role=provider">Offer your services</a></div></div>
      <div className="card match"><h3>Search professionals</h3><form className="fields" onSubmit={submitSearch} autoComplete="off"><label className="full">What do you need?<input name="service" list="services" placeholder="Plumbing, cleaning, photography…" value={service} onChange={(e) => setService(e.target.value)}/><datalist id="services">{categories.map(([name]) => <option key={name}>{name}</option>)}</datalist></label><label>County, town, or area<input name="location" placeholder="e.g. Westlands, Nairobi"/></label><label>Budget (optional)<select name="max_price" defaultValue="0"><option value="0">Any budget</option><option value="5000">Up to KSh 5,000</option><option value="10000">Up to KSh 10,000</option><option value="25000">Up to KSh 25,000</option><option value="50000">Up to KSh 50,000</option></select></label><button className="btn full" type="submit">Search</button></form>
      <div className="chips"><span>Popular:</span>{['Plumbing','Cleaning','Photography','IT support'].map((name) => <button className="chip" key={name} onClick={() => setService(name)}>{name}</button>)}</div>{service && <><p className="res-head">Sample matches <span className="tag">Sample</span></p>{people.slice(0,2).map((name, index) => <div className="pro" key={name}><div className="av" aria-hidden="true">{name.split(' ').map(x => x[0]).join('')}</div><div className="info"><strong>{name}’s {service} Pro{index ? ' Works' : ''}</strong><span>Illustrative profile · From KSh {3_500 + index * 700} · Availability is sample data</span></div><a className="btn small" href={`/browse?q=${encodeURIComponent(service)}`}>View matches</a></div>)}<p className="note">Sample results for demonstration. Location isn’t used for ranking yet.</p></>}
      <a className="btn ghost small browse-link" href="/browse">Browse all providers</a></div>
    </div>
    <section id="how"><h2>How it works</h2><ol className="steps"><li><h3>Discover</h3><p>Find the service you need and see who offers it nearby.</p></li><li><h3>Connect</h3><p>Compare starting prices, business details, and portfolios, then contact providers.</p></li><li><h3>Get it done</h3><p>Agree on the scope and time, then track the request as the provider responds.</p></li></ol></section>
    <section id="providers"><div className="split"><div className="side cust"><h2>For customers</h2><ul><li>Find professionals easily</li><li>Compare starting prices side by side</li><li>Request a booking or written quotation</li><li>Message the provider about your request</li><li>Track provider responses and status updates</li></ul><a className="btn" href="/browse">Browse providers</a></div><div className="side prov"><h2>For providers</h2><ul><li>Reach more customers in your area</li><li>Showcase your work and expertise</li><li>Manage weekly availability</li><li>Respond to service requests and send quotes</li><li>Keep conversations attached to each request</li></ul><a className="btn" href="/register?role=provider">Create your profile</a></div></div></section>
    <section id="explore"><h2>Popular service categories</h2><p className="sub">Choose a category to see sample professionals in the search above.</p><div className="cats">{categories.map(([name, desc]) => <button className="card cat" key={name} onClick={() => {setService(name); window.scrollTo({top:0,behavior:'smooth'});}}><span className="m" aria-hidden="true">{name[0]}</span><strong>{name}</strong><span>{desc}</span></button>)}</div></section>
    <section id="featured"><h2>Featured professionals</h2><p className="sub">Sample profiles for illustration. Real professionals will appear here once they join.</p><div className="feat">{people.map((name, i) => <div className="card" key={name}><div className="av">{name.split(' ').map(x=>x[0]).join('')}</div><h3>{name}</h3><p>{categories[[0,2,7,12][i]][0]}</p><p>Illustrative price: KSh {(3_500+i*1_500).toLocaleString('en-KE')}</p><span className="tag sample-tag">Sample</span></div>)}</div></section>
    <section id="trust"><h2>Built for trust and safety</h2><div className="trust"><div><h3>Verification status</h3><p>Doorstep does not currently verify provider identity or professional licences, so no verification badge is shown.</p></div><div><h3>Reviews with context</h3><p>Reviews are planned after completed service interactions; they are not available in this preview.</p></div><div><h3>Clear pricing</h3><p>See provider starting prices and request a written quote before you commit.</p></div><div><h3>Request-based messages</h3><p>Keep messages attached to the service request so the agreed details are easy to find.</p></div></div><p className="note">Trust and safety tools are being built alongside the marketplace.</p></section>
    <section id="about"><h2>Every service. One connection.</h2><p className="sub">Doorstep is designed to make finding and offering reliable local services simpler.</p><div className="trust"><div><h3>Find the right help</h3><p>Browse service categories and compare clear starting prices.</p></div><div><h3>Showcase your work</h3><p>Build a professional profile and explain what each service includes.</p></div><div><h3>Keep details clear</h3><p>Share the location, timing, and scope of the work before agreeing to a booking.</p></div></div></section>
    <section id="faq"><h2>Frequently asked questions</h2><div className="faq">{[['Is Doorstep live yet?','Doorstep is in development. Directory results on this page are sample content. Account registration is enabled when Supabase is configured.'],['What does it cost customers?','The plan is for searching, comparing, and requesting quotes to be free. Pricing details will be shared before launch.'],['What verification does Doorstep perform?','Doorstep is not currently verifying provider identity or professional licences. Listings should not be treated as verified.'],['Can I add a service that isn’t listed?','Yes. Categories are configurable, so new ones can be added as providers ask for them.'],['How do bookings work?','Customers can request a booking or quotation from a live provider profile. Providers can accept, decline, or propose another date, and both sides can message through the request.']].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section id="join"><div className="final"><div><h2>Ready to get started?</h2><p className="sub">Tell us who you are and what you do or need. We’ll be in touch when Doorstep opens in your area.</p></div><div className="card formcard"><div className="tabs" role="tablist" aria-label="I am a"><button role="tab" aria-selected={role==='customer'} onClick={() => setRole('customer')}>I need a service</button><button role="tab" aria-selected={role==='provider'} onClick={() => setRole('provider')}>I offer a service</button></div>{signupMessage ? <p className="ok" role="status">{signupMessage}</p> : <form onSubmit={submitSignup}><label>Full name<input required autoComplete="name"/></label><label>Email<input type="email" required autoComplete="email"/></label>{role==='provider' && <label>Business name<input autoComplete="organization"/></label>}<label>{role==='customer'?'Service you need':'Main service you offer'}<select>{categories.map(([name])=><option key={name}>{name}</option>)}</select></label><button className="btn" type="submit">{role==='customer'?'Notify me':'Notify me as a provider'}</button><p className="note">Preview only: nothing you enter here is saved or sent yet.</p></form>}</div></div></section>
  </main></div><Footer/></>;
}
