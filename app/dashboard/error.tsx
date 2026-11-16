"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PropertyOS dashboard error:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", background: "#f3f2ec", color: "#132c2a", padding: "48px 6%" }}>
      <section style={{ maxWidth: 680, margin: "8vh auto", background: "#fff", border: "1px solid #dce4dc", borderRadius: 12, padding: 28 }}>
        <p style={{ color: "#6d9e8b", fontSize: 11, letterSpacing: 2 }}>PROPERTYOS AI · RECOVERABLE ERROR</p>
        <h1 style={{ fontSize: 30 }}>Your dashboard could not load.</h1>
        <p style={{ color: "#687573", lineHeight: 1.7 }}>
          Your saved property information has not been intentionally changed. Check your connection and try again.
          If the problem continues, contact support and share this reference: {error.digest ?? "not available"}.
        </p>
        <button onClick={() => reset()} style={{ padding: "12px 18px", border: 0, borderRadius: 7, background: "#183b32", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Try again
        </button>
        <p><a href="/login" style={{ color: "#28644e" }}>Return to sign in</a></p>
      </section>
    </main>
  );
}
