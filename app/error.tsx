"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PropertyOS application error:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#102624", color: "#132c2a" }}>
      <section style={{ width: "100%", maxWidth: 620, padding: 32, borderRadius: 12, background: "#f3f2ec" }}>
        <p style={{ color: "#638a7e", fontSize: 11, letterSpacing: 2 }}>PROPERTYOS AI · RECOVERY</p>
        <h1 style={{ fontSize: 30 }}>This page could not be loaded.</h1>
        <p style={{ color: "#687573", lineHeight: 1.7 }}>Your request may not have completed. Please try again. If the issue continues, contact support and share this reference: {error.digest ?? "not available"}.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button onClick={() => reset()} style={{ padding: "12px 18px", border: 0, borderRadius: 6, background: "#183b32", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Try again</button>
          <a href="/login" style={{ padding: "12px 18px", borderRadius: 6, background: "#e2e7df", color: "#183b32", textDecoration: "none", fontWeight: 700 }}>Return to sign in</a>
        </div>
      </section>
    </main>
  );
}
