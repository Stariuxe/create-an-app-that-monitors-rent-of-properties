import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessToolsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login?next=%2Fbusiness-tools");
  return <main style={{ minHeight: "100vh", background: "#f3f2ec", color: "#142c27", padding: "36px 7%" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d8e0d8", paddingBottom: 20 }}>
      <a href="/dashboard" style={{ fontWeight: 800, color: "#173d34" }}>← PropertyOS AI workspace</a>
      <span style={{ fontSize: 10, letterSpacing: 2, color: "#638b79" }}>STARIUXE ENTERPRISES</span>
    </header>
    <section style={{ maxWidth: 1000, margin: "70px auto" }}>
      <p style={{ color: "#679783", fontSize: 10, letterSpacing: 2 }}>INTERNAL BUSINESS TOOLS</p>
      <h1 style={{ fontSize: "clamp(38px,6vw,64px)", letterSpacing: -3, margin: "16px 0" }}>One workspace.<br/><span style={{ color: "#639b86" }}>Better business.</span></h1>
      <p style={{ maxWidth: 600, color: "#687573", lineHeight: 1.8 }}>A growing collection of practical tools for Stariuxe Enterprises and its products. Your account must be signed in to access this area.</p>
      <article style={{ marginTop: 40, padding: 28, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12, maxWidth: 620 }}>
        <p style={{ color: "#6b9b87", fontSize: 10, letterSpacing: 2 }}>COMMUNICATION / 01</p>
        <h2 style={{ fontSize: 26, margin: "12px 0" }}>Email Signature Studio</h2>
        <p style={{ color: "#687573", fontSize: 13, lineHeight: 1.7 }}>Create consistent signatures for Stariuxe Enterprises and PropertyOS AI. Preview, copy HTML or plain text, and download a portable signature file.</p>
        <a href="/business-tools/email-signatures" style={{ display: "inline-block", marginTop: 12, padding: "13px 18px", background: "#173d34", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>Open Signature Studio →</a>
      </article>
    </section>
  </main>;
}
