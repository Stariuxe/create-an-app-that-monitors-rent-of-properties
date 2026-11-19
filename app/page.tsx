"use client";

import { useState } from "react";
import InstallAppButton from "@/components/install-app-button";

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
      <div className="scene-float scene-float-top"><span className="float-icon">↗</span><span><b>Portfolio overview</b><small>Every property in view</small></span></div>
      <div className="scene-float scene-float-bottom"><span className="float-pulse" /><span><b>Rent visibility</b><small>Track what needs attention</small></span></div>
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
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main id="top">
      <div className="announcement"><span className="announcement-pill">LANDLORD ONBOARDING</span> PropertyOS AI is welcoming landlords for guided product introductions. <a href="#pilot">Talk to our team <span>↗</span></a></div>
      <header className="site-header">
        <Brand />
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}><span /><span /></button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <a href="#platform" onClick={closeMenu}>Platform</a><a href="#how-it-works" onClick={closeMenu}>How it works</a><a href="#why-propertyos" onClick={closeMenu}>Why PropertyOS</a><a href="#faq" onClick={closeMenu}>FAQs</a>
          <a href="/login" onClick={closeMenu}>Sign in</a><InstallAppButton /><a className="nav-cta" href="/signup" onClick={closeMenu}>Create account <span>↗</span></a>
        </nav>
      </header>

      <div id="main-content" tabIndex={-1}>
      <section className="hero">
        <div className="hero-copy">
          <div className="kicker"><span className="kicker-line" /> PROPERTY MANAGEMENT, REIMAGINED</div>
          <h1>Run your rentals<br /><em>with clarity.</em> <span>and control.</span></h1>
          <p className="hero-description">Bring your property records, units, tenants, leases and rent charges into one organised workspace. See the details that matter and spend less time piecing information together.</p>
          <div className="hero-actions"><a className="button button-primary" href="#pilot">Talk to our team <span>↗</span></a><a className="text-link" href="#platform">Explore the platform <span>↓</span></a></div>
          <div className="hero-proof"><div className="proof-avatars"><i>✦</i><i>⌂</i><i>◈</i></div><div><b>Designed for Kenyan rental operations</b><small>Practical tools for landlords and property managers</small></div></div>
        </div>
        <BuildingScene />
        <div className="hero-bottom"><span>01 / A BETTER WAY TO MANAGE</span><span>SCROLL TO EXPLORE ↓</span><span>KENYA · BUILT FOR GROWTH</span></div>
      </section>

      <section className="intro-band" id="why-propertyos">
        <div className="section-index">[ THE BIGGER PICTURE ]</div>
        <div className="intro-content"><h2>Less chasing.<br /><span>More knowing.</span></h2><div><p>Rental operations are easier to manage when the important details are organised in one place.</p><p>PropertyOS AI brings property, unit, tenant, lease and rent-charge records into a connected workspace—helping landlords keep clearer records and follow up with greater confidence.</p><a className="underlined-link" href="#how-it-works">A more considered way to manage <span>↗</span></a></div></div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-heading"><div><div className="section-index">[ THE PLATFORM ]</div><h2>One workspace.<br /><em>Every moving part.</em></h2></div><p>Keep the essential records of your rental portfolio connected—from properties and units to tenants, leases and rent charges.</p></div>
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

      <section className="statement-section"><div className="statement-glow" /><div className="section-index">[ THE PROPERTYOS POINT OF VIEW ]</div><h2>Your properties<br />are an investment.<br /><em>Your systems should<br />work like one.</em></h2><p>Every property. Every tenant. Every detail — in a clearer picture.</p><a className="button button-light" href="#pilot">Speak with PropertyOS AI <span>↗</span></a><div className="statement-coordinate">01°17′S 36°49′E <span>NAIROBI, KENYA</span></div></section>

      <section className="pilot-section" id="pilot">
        <div className="pilot-copy"><div className="section-index">[ LET’S TALK PROPERTY ]</div><h2>Make your rental<br /><em>operations clearer.</em></h2><p>See how PropertyOS AI can help you organise your portfolio, maintain connected tenant and lease records, and keep rent charges visible. Contact our team for a guided introduction and onboarding conversation.</p><div className="pilot-points"><span>✳ One organised property workspace</span><span>✳ Clearer rent-charge records</span><span>✳ Guided product introduction</span></div></div>
        <div className="pilot-form-card"><div className="form-eyebrow">PROPERTYOS AI / SALES ENQUIRIES</div><h3>Let’s discuss your portfolio.</h3><p>Tell us about your rental operations and arrange a guided introduction to PropertyOS AI.</p><a className="button button-primary form-button" href="mailto:hello@propertyos.ai?subject=PropertyOS%20AI%20Sales%20Enquiry">Contact our team <span>↗</span></a><small className="form-disclaimer">Email us to discuss product access, onboarding and current feature availability. We’ll explain what is available today and what is on the roadmap.</small></div>
      </section>

      <section className="faq-section" id="faq"><div className="faq-intro"><div className="section-index">[ GOOD TO KNOW ]</div><h2>Questions,<br /><em>considered.</em></h2><p>A few things to know as we prepare the first release.</p></div><div className="faq-list">{[
        ["Can I explore PropertyOS AI now?","Yes. We are welcoming landlord enquiries and guided product introductions. Contact our team to discuss access, onboarding and the capabilities currently available."],
        ["Who should choose PropertyOS AI?","Individual landlords and property managers who want connected property, unit, tenant, lease and rent-charge records in one workspace, with a product direction focused on the needs of Kenyan rental operations."],
        ["Can tenants pay rent through the platform?","Payment collection integrations are being developed and tested separately. Contact us to confirm the current payment options; do not assume in-app M-Pesa collection is live."],
        ["Does it send automatic rent reminders?","Automated reminders are on the product roadmap. Today, landlords can organise rent-charge records and use the workspace to review what needs follow-up."],
        ["How will my information be protected?","We take data handling seriously. Review our Privacy Policy and Terms before using the service, use a strong unique password, and never enter M-Pesa PINs or OTPs. We will explain the current data-handling arrangements during onboarding."]
      ].map(([q,a],i)=><div className={faqOpen===i?"faq-item faq-active":"faq-item"} key={q}><button onClick={()=>setFaqOpen(faqOpen===i?null:i)} aria-expanded={faqOpen===i}><span>{q}</span><i>{faqOpen===i?"−":"+"}</i></button>{faqOpen===i&&<p>{a}</p>}</div>)}</div></section>

      <footer className="footer"><div className="footer-top"><div><Brand /><p>Property operations,<br />in a clearer perspective.</p></div><div className="footer-links"><div><b>EXPLORE</b><a href="#platform">Platform</a><a href="#how-it-works">How it works</a><a href="#faq">FAQs</a></div><div><b>GET STARTED</b><a href="/signup">Create account</a><a href="/login">Sign in</a><a href="#pilot">Pilot programme</a><a href="mailto:hello@propertyos.ai">hello@propertyos.ai</a></div><div><b>LEGAL</b><a href="/privacy">Privacy policy</a><a href="/terms">Terms of use</a></div></div></div><div className="footer-bottom"><span>© 2026 PROPERTYOS AI. ALL RIGHTS RESERVED.</span><span>EVERY PROPERTY. UNDER CONTROL.</span><span>NAIROBI, KENYA</span></div><p className="legal-note">PropertyOS AI is a product initiative under Stariuxe Enterprises. The name PropertyOS AI Limited remains subject to the relevant registration process. Product capabilities and payment integrations are described according to their current availability; contact us for a guided demonstration.</p></footer>
      </div>
      </main>
    </>
  );
}
