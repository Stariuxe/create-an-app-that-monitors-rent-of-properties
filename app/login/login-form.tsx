"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account created. Check your email for the confirmation link, then return here to sign in.");
        } else {
          window.location.assign("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const next = searchParams.get("next");
        window.location.assign(next && next.startsWith("/") ? next : "/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete authentication.");
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = { width: "100%", padding: "13px 14px", border: "1px solid #cfd9d0", borderRadius: 6, background: "#fff", color: "#132c2a", marginTop: 7, marginBottom: 16 };

  return (
    <form onSubmit={submit}>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <button type="button" onClick={() => { setMode("signin"); setMessage(""); }} style={{ flex: 1, padding: 11, border: 0, borderRadius: 6, background: mode === "signin" ? "#183b32" : "#e2e7df", color: mode === "signin" ? "#fff" : "#183b32" }}>Sign in</button>
        <button type="button" onClick={() => { setMode("signup"); setMessage(""); }} style={{ flex: 1, padding: 11, border: 0, borderRadius: 6, background: mode === "signup" ? "#183b32" : "#e2e7df", color: mode === "signup" ? "#fff" : "#183b32" }}>Create account</button>
      </div>
      {mode === "signup" && <><label htmlFor="fullName" style={{ fontSize: 12, color: "#53665c" }}>Full name</label><input id="fullName" autoComplete="name" required value={fullName} onChange={e => setFullName(e.target.value)} style={field} /></>}
      <label htmlFor="email" style={{ fontSize: 12, color: "#53665c" }}>Email address</label>
      <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={field} />
      <label htmlFor="password" style={{ fontSize: 12, color: "#53665c" }}>Password</label>
      <input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} style={field} />
      <button disabled={busy} type="submit" style={{ width: "100%", padding: 14, border: 0, borderRadius: 6, background: "#183b32", color: "#fff", fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>{busy ? "Please wait…" : mode === "signin" ? "Sign in securely →" : "Create landlord account →"}</button>
      {message && <p role="status" style={{ marginTop: 16, fontSize: 13, lineHeight: 1.6, color: "#496b5a" }}>{message}</p>}
      <p style={{ marginTop: 20, fontSize: 11, lineHeight: 1.6, color: "#7a8780" }}>Use a strong, unique password. Email confirmation may be required before your first sign-in.</p>
    </form>
  );
}
