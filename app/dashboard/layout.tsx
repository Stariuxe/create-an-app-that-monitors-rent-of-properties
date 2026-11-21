import "./dashboard-shell.css";

const links = [
  { label: "Workspace overview", href: "/dashboard/overview", icon: "◫" },
  { label: "Properties", href: "/dashboard/operations#add-property", icon: "⌂" },
  { label: "Units", href: "/dashboard/operations#add-unit", icon: "▦" },
  { label: "Tenants", href: "/dashboard/operations#add-tenant", icon: "♙" },
  { label: "Leases", href: "/dashboard/operations#create-lease", icon: "▤" },
  { label: "Rent & charges", href: "/dashboard/operations#raise-rent-charge", icon: "◷" },
  { label: "Payments", href: "/dashboard/operations#workspace-payments", icon: "↗" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <a className="workspace-brand" href="/">PropertyOS <span>AI</span></a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="workspace-nav" aria-label="Workspace navigation">
          {links.map((item, index) => (
            <a className={index === 0 ? "workspace-nav-link workspace-nav-primary" : "workspace-nav-link"} href={item.href} key={item.label}>
              <span className="workspace-nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="workspace-sidebar-insight">
          <div className="workspace-insight-icon">✦</div>
          <strong>Portfolio insights</strong>
          <p>Track rent collection, occupancy and property activity from your workspace overview.</p>
          <a href="/dashboard/overview#workspace-charts">View insights →</a>
        </div>
        <a className="workspace-sidebar-home" href="/">← Back to PropertyOS AI</a>
      </aside>
      <div className="workspace-main">{children}</div>
    </div>
  );
}
