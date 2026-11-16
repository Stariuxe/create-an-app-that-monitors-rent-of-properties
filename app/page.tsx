"use client";

import { useState } from "react";

const features = [
  { number: "01", title: "Property command centre", text: "See your properties and units in one organised view. Know what you manage without digging through scattered records.", icon: "⌂" },
  { number: "02", title: "Tenant & lease records", text: "Keep tenant details, lease terms and important dates connected to the right unit.", icon: "◫" },
  { number: "03", title: "Rent visibility", text: "Record rent charges and payments, then bring outstanding balances into focus for follow-up.", icon: "↗" },
  { number: "04", title: "Reports that make sense", text: "Build a clearer picture of rental performance with reporting designed around the questions landlords ask.", icon: "▤" },
];

const steps = [
  { n: "01", title: "Bring everything together", text: "Add your properties, units and the people connected to them." },
  { n: "02", title: "Stay on top of rent", text: "Keep rent charges and payment records in one consistent workflow." },
  { n: "03", title: "Know what needs attention", text: "Spot balances, missing information and follow-ups before they become bigger problems." },
];

function Brand() {
  return <a className="brand" href="#top" aria-label="PropertyOS AI home"><img src="/brand/propertyos-logo.webp" alt="PropertyOS AI Limited — Smarter Property Management. Greater Value." /></a>;
}

function BuildingScene() {
  return (
    <div className="building-scene" aria-hidden="true">
      <div className="scene-orb" />
      <div className="scene-grid" />
      <div className="scene-building building-back"><span /><span /><span /><span /><span /><span /></div>
      <div className="scene-building building-mid"><span /><span /><span /><span /><span /><span /><span /><span /></div>
      <div className="scene-building building-front"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
      <div className="scene-ground" />
      <div className="scene-glow" />
      <div className="scene-caption"><span className="caption-dot" /> BUILT FOR THE WAY YOU MANAGE</div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-shell">
      <div className="dashboard-top"><div className="dash-brand"><span className="mini-mark">P</span> PropertyOS <span className="dash-beta">PREVIEW</span></div><div className="dash-avatar">JD</div></div>
      <div className="dashboard-body">
        <aside className="dash-sidebar"><div className="side-active">▦ <span>Overview</span></div><div>⌂ <span>Properties</span></div><div>♙ <span>Tenants</span></div><div>↗ <span>Payments</span></div><div>▤ <span>Reports</span></div></aside>
        <div className="dash-main">
          <div className="dash-welcome"><div><span className="eyebrow">MONDAY, 16 NOVEMBER</span><h3>Your portfolio at a glance.</h3></div><span className="dash-filter">This month⌄</span></div>
          <div className="metric-grid">
            <div className="metric-card"><span>PORTFOLIO UNITS</span><strong>128</strong><small>Across 8 properties</small></div>
            <div className="metric-card"><span>RENT COLLECTED</span><strong>KES 2.4M</strong><small className="positive">↑ 8.2% this month</small></div>
            <div className="metric-card"><span>OUTSTANDING</span><strong>KES 184K</strong><small>12 accounts to review</small></div>
          </div>
          <div className="dash-lower">
            <div className="chart-card"><div className="chart-heading"><b>Collection overview</b><span>Illustrative data</span></div><div className="chart-total">KES 2,416,800 <small>of KES 2.6M expected</small></div><div className="chart-bars">{[42,58,50,76,62,88,72,96,81,68,91,100].map((h,i)=><i key={i} style={{height:h+"%"}} />)}</div><div className="chart-months"><span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span></div></div>
            <div className="attention-card"><div className="attention-title"><b>Needs attention</b><span className="alert-count">3</span></div><div className="attention-row"><i className="status-dot amber" /><div><b>Rent follow-up</b><small>4 balances to review</small></div></div><div className="attention-row"><i className="status-dot blue" /><div><b>Lease renewals</b><small>2 dates approaching</small></div></div><div className="attention-row"><i className="status-dot green" /><div><b>Records to complete</b><small>1 tenant profile</small></div></div></div>
          </div>
        </div>
      </div>
      <div className="dash-footnote"><span className="live-dot" /> PRODUCT CONCEPT PREVIEW <span>Sample figures · Not live customer data</span></div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  function submitInterest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <main id="top">
      <div className="announcement"><span className="announcement-pill">EARLY ACCESS</span> We’re preparing our first landlord pilot. <a href="#pilot">Join the interest list <span>↗</span></a></div>
      <header className="site-header">
        <Brand />
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}><span /><span /></button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <a href="#platform" onClick={closeMenu}>Platform</a><a href="#how-it-works" onClick={closeMenu}>How it works</a><a href="#why-propertyos" onClick={closeMenu}>Why PropertyOS</a><a href="#faq" onClick={closeMenu}>FAQs</a>
          <a className="nav-cta" href="#pilot" onClick={closeMenu}>Request early access <span>↗</span></a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="kicker"><span className="kicker-line" /> PROPERTY MANAGEMENT, REIMAGINED</div>
          <h1>Own the details.<br /><em>See the bigger</em> <span>picture.</span></h1>
          <p className="hero-description">A clearer way to manage your rental portfolio. Bring properties, tenants, leases and rent workflows into one intelligent workspace.</p>
          <div className="hero-actions"><a className="button button-primary" href="#pilot">Explore early access <span>↗</span></a><a className="text-link" href="#platform">Discover the platform <span>↓</span></a></div>
          <div className="hero-proof"><div className="proof-avatars"><i>✦</i><i>⌂</i><i>◈</i></div><div><b>Made for modern landlords</b><small>Designed with rental operations in mind</small></div></div>
        </div>
        <BuildingScene />
        <div className="hero-bottom"><span>01 / A BETTER WAY TO MANAGE</span><span>SCROLL TO EXPLORE ↓</span><span>KENYA · BUILT FOR GROWTH</span></div>
      </section>

      <section className="intro-band" id="why-propertyos">
        <div className="section-index">[ THE BIGGER PICTURE ]</div>
        <div className="intro-content"><h2>Less chasing.<br /><span>More knowing.</span></h2><div><p>Rental operations shouldn’t depend on scattered spreadsheets, forgotten messages and end-of-month guesswork.</p><p>PropertyOS AI is being built to give landlords a more connected view of the details that keep a portfolio moving.</p><a className="underlined-link" href="#how-it-works">A more considered way to manage <span>↗</span></a></div></div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-heading"><div><div className="section-index">[ THE PLATFORM ]</div><h2>One workspace.<br /><em>Every moving part.</em></h2></div><p>From the first unit to the monthly numbers, bring the essential parts of property management into clearer view.</p></div>
        <DashboardPreview />
        <div className="dashboard-note"><span className="note-line" /> A look at the experience we’re building. Figures shown are illustrative, not live data.</div>
        <div className="feature-grid">{features.map((f)=><article className="feature-card" key={f.number}><div className="feature-top"><span>{f.number} / 04</span><span className="feature-icon">{f.icon}</span></div><h3>{f.title}</h3><p>{f.text}</p><a href="#pilot" aria-label={"Ask about "+f.title}>Explore capability <span>↗</span></a></article>)}</div>
      </section>

      <section className="workflow-section" id="how-it-works">
        <div className="workflow-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><span className="orbit-mark">P</span><b>PROPERTYOS</b><small>ONE CONNECTED VIEW</small></div><div className="orbit-node node-a">⌂<small>PROPERTY</small></div><div className="orbit-node node-b">♙<small>TENANT</small></div><div className="orbit-node node-c">↗<small>RENT</small></div><div className="orbit-node node-d">▤<small>INSIGHTS</small></div></div>
        <div className="workflow-copy"><div className="section-index">[ A SIMPLE FLOW ]</div><h2>From scattered<br />to <em>in sync.</em></h2><p className="workflow-lead">A more consistent rhythm for the everyday work behind your rental portfolio.</p>
          <div className="steps">{steps.map(s=><div className="step" key={s.n}><span>{s.n}</span><div><h3>{s.title}</h3><p>{s.text}</p></div><b>↗</b></div>)}</div>
        </div>
      </section>

      <section className="statement-section"><div className="statement-glow" /><div className="section-index">[ THE PROPERTYOS POINT OF VIEW ]</div><h2>Your properties<br />are an investment.<br /><em>Your systems should<br />work like one.</em></h2><p>Every property. Every tenant. Every detail — in a clearer picture.</p><a className="button button-light" href="#pilot">Be part of what’s next <span>↗</span></a><div className="statement-coordinate">01°17′S 36°49′E <span>NAIROBI, KENYA</span></div></section>

      <section className="pilot-section" id="pilot">
        <div className="pilot-copy"><div className="section-index">[ FIRST ACCESS ]</div><h2>Help shape the<br /><em>future of renting.</em></h2><p>We’re inviting a small group of landlords and property managers to explore the early product, share their workflows and help us build what matters most.</p><div className="pilot-points"><span>✳ Early product access</span><span>✳ Direct feedback channel</span><span>✳ Help shape the roadmap</span></div></div>
        <div className="pilot-form-card"><div className="form-eyebrow">PROPERTYOS AI / PILOT PROGRAMME</div>{submitted ? <div className="success-state"><div className="success-icon">✓</div><h3>You’re on our radar.</h3><p>Thanks for your interest. This demo form has recorded your entry in this page session only. Connect a form service or backend before collecting real enquiries.</p><button onClick={()=>{setSubmitted(false);setEmail("");}}>Add another email ↗</button></div> : <><h3>Get on the list.</h3><p>Leave your email and we’ll be in touch when pilot applications open.</p><form onSubmit={submitInterest}><label htmlFor="pilot-email">WORK EMAIL</label><input id="pilot-email" type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required /><button className="button button-primary form-button" type="submit">Register interest <span>↗</span></button></form><small className="form-disclaimer">By submitting, you agree to be contacted about the PropertyOS AI pilot. Add a privacy notice and connected form backend before publishing.</small></>}</div>
      </section>

      <section className="faq-section" id="faq"><div className="faq-intro"><div className="section-index">[ GOOD TO KNOW ]</div><h2>Questions,<br /><em>considered.</em></h2><p>A few things to know as we prepare the first release.</p></div><div className="faq-list">{[
        ["Is PropertyOS AI available now?","PropertyOS AI is in development and preparing for an early pilot. Join the interest list to hear when applications open."],
        ["Who is it designed for?","The first release is being shaped for individual landlords, property managers and owners of residential rental portfolios."],
        ["Can tenants pay rent through the platform?","A tenant payment portal and payment integrations are planned. They should not be treated as live until released and tested."],
        ["Does it send automatic rent reminders?","Automated reminders are part of the planned product direction. Availability will be confirmed when the feature is ready."],
        ["How will my information be protected?","Security and privacy controls are a release requirement. We will publish the relevant privacy information and safeguards before onboarding real tenant data."]
      ].map(([q,a],i)=><div className={faqOpen===i?"faq-item faq-active":"faq-item"} key={q}><button onClick={()=>setFaqOpen(faqOpen===i?null:i)} aria-expanded={faqOpen===i}><span>{q}</span><i>{faqOpen===i?"−":"+"}</i></button>{faqOpen===i&&<p>{a}</p>}</div>)}</div></section>

      <footer className="footer"><div className="footer-top"><div><Brand /><p>Property operations,<br />in a clearer perspective.</p></div><div className="footer-links"><div><b>EXPLORE</b><a href="#platform">Platform</a><a href="#how-it-works">How it works</a><a href="#faq">FAQs</a></div><div><b>GET IN TOUCH</b><a href="#pilot">Pilot programme</a><a href="mailto:hello@propertyos.ai">hello@propertyos.ai</a></div></div></div><div className="footer-bottom"><span>© 2026 PROPERTYOS AI. ALL RIGHTS RESERVED.</span><span>EVERY PROPERTY. UNDER CONTROL.</span><span>NAIROBI, KENYA</span></div><p className="legal-note">PropertyOS AI Limited is a proposed company name pending registration approval. Product features described as planned or in development are not represented as currently available.</p></footer>
    </main>
  );
}
