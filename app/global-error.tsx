"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en-KE">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f3f2ec", color: "#132c2a", fontFamily: "Arial, sans-serif" }}>
        <main style={{ width: "100%", maxWidth: 680, padding: 28, background: "#fff", border: "1px solid #dce4dc", borderRadius: 12 }}>
          <p style={{ color: "#6d9e8b", fontSize: 11, letterSpacing: 2 }}>PROPERTYOS AI · RECOVERABLE ERROR</p>
          <h1 style={{ fontSize: 30 }}>This page could not be displayed.</h1>
          <p style={{ color: "#687573", lineHeight: 1.7 }}>Your saved property information has not been intentionally changed. Refresh the page and try again. If the problem continues, contact support and share this reference: {error.digest ?? "not available"}.</p>
          <button onClick={() => reset()} style={{ padding: "12px 18px", border: 0, borderRadius: 7, background: "#183b32", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Try again</button>
          <p><a href="/login" style={{ color: "#28644e" }}>Return to sign in</a></p>
        </main>
      </body>
    </html>
  );
}
