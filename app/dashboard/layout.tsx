import Link from "next/link";

const sections = [
  { label: "Overview", href: "/dashboard/operations", icon: "◫" },
  { label: "Properties", href: "/dashboard/operations#add-property", icon: "⌂" },
  { label: "Units", href: "/dashboard/operations#add-unit", icon: "▦" },
  { label: "Tenants", href: "/dashboard/operations#add-tenant", icon: "♙" },
  { label: "Leases", href: "/dashboard/operations#create-lease", icon: "▤" },
  { label: "Rent & charges", href: "/dashboard/operations#raise-rent-charge", icon: "↗" },
  { label: "Payments", href: "/dashboard/operations#recent-payments", icon: "◎" },
  { label: "M-Pesa", href: "/dashboard/operations#mpesa", icon: "◉" },
  { label: "Portfolio intelligence", href: "/dashboard/portfolio", icon: "⌁" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="property-workspace-frame">
      <aside className="property-workspace-sidebar">
        <Link href="/dashboard/operations" className="workspace-brand">
          <span className="workspace-brand-mark">P</span>
          <span>PropertyOS <b>AI</b><small>BY STARIUXE ENTERPRISES</small></span>
        </Link>
        <div className="workspace-side-label">WORKSPACE</div>
        <nav className="workspace-side-nav" aria-label="Main workspace">
          {sections.map((item, index) => (
            <Link key={item.href} href={item.href} className={index === 0 ? "workspace-nav-link workspace-nav-primary" : "workspace-nav-link"}>
              <span className="workspace-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <span className="workspace-online-dot" />
          <span>Workspace protected</span>
          <small>KENYA · KES</small>
        </div>
      </aside>
      <div className="property-workspace-content">
        <div className="workspace-topbar">
          <div><span className="workspace-topbar-kicker">PROPERTY MANAGEMENT</span><strong>Landlord workspace</strong></div>
          <div className="workspace-topbar-actions">
            <span className="workspace-secure-pill"><i /> Secure workspace</span>
            <Link href="/dashboard" className="workspace-account-link">Account</Link>
          </div>
        </div>
        <div className="workspace-page-content">{children}</div>
      </div>
    </div>
  );
}
