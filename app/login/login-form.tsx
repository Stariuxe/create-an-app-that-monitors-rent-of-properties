"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = { initialMode?: "signin" | "signup" };

export default function LoginForm({ initialMode = "signin" }: LoginFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [busy, setBusy] = useState(false);

  function feedback(type: "success" | "error" | "info", text: string) {
    setMessageType(type);
    setMessage(text);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", "/auth/complete");

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: callback.toString(),
          },
        });
        if (error) throw error;
        if (data.session) {
          feedback("success", "Your account is ready. Opening your landlord workspace…");
          window.location.replace("/auth/complete");
          return;
        }
        feedback("info", "Your account has been created. Check your email and confirm your address to securely activate your workspace, then sign in here. If you do not see the email, check your spam folder.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      feedback("success", "Signed in. Opening your landlord workspace…");
      window.location.replace("/auth/complete");
    } catch (error) {
      feedback("error", error instanceof Error ? error.message : "We could not complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    if (busy || !email.trim()) {
      feedback("error", "Enter your email address first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", "/auth/complete");
      const { error } = await createClient().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callback.toString(), shouldCreateUser: false },
      });
      if (error) throw error;
      feedback("success", "If an account exists for that email, a secure sign-in link has been sent. Check your inbox.");
    } catch (error) {
      feedback("error", error instanceof Error ? error.message : "We could not send a sign-in link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = { width: "100%", padding: "13px 14px", border: "1px solid #cfd9d0", borderRadius: 6, background: "#fff", color: "#132c2a", marginTop: 7, marginBottom: 16 };

  return (
    <form onSubmit={submit} aria-busy={busy}>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <button type="button" onClick={() => { setMode("signin"); setMessage(""); }} style={{ flex: 1, padding: 11, border: 0, borderRadius: 6, background: mode === "signin" ? "#183b32" : "#e2e7df", color: mode === "signin" ? "#fff" : "#183b32" }}>Sign in</button>
        <button type="button" onClick={() => { setMode("signup"); setMessage(""); }} style={{ flex: 1, padding: 11, border: 0, borderRadius: 6, background: mode === "signup" ? "#183b32" : "#e2e7df", color: mode === "signup" ? "#fff" : "#183b32" }}>Create account</button>
      </div>
      {mode === "signup" && <><label htmlFor="fullName" style={{ fontSize: 12, color: "#53665c" }}>Full name</label><input id="fullName" autoComplete="name" required value={fullName} onChange={e => setFullName(e.target.value)} style={field} /></>}
      <label htmlFor="email" style={{ fontSize: 12, color: "#53665c" }}>Email address</label>
      <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={field} />
      <label htmlFor="password" style={{ fontSize: 12, color: "#53665c" }}>Password</label>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} style={{ ...field, marginBottom: 0, paddingRight: 48 }} />
        <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} style={{ position: "absolute", right: 8, top: 12, width: 36, height: 36, border: 0, background: "transparent", color: "#53665c", cursor: "pointer" }}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      <button disabled={busy} type="submit" style={{ width: "100%", padding: 14, border: 0, borderRadius: 6, background: "#183b32", color: "#fff", fontWeight: 700, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}>{busy ? "Please wait…" : mode === "signin" ? "Sign in securely →" : "Create landlord account →"}</button>
      {mode === "signin" && <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 14, fontSize: 12 }}>
        <a href="/forgot-password" style={{ color: "#183b32", fontWeight: 700 }}>Forgot password?</a>
        <button type="button" onClick={sendMagicLink} disabled={busy} style={{ border: 0, padding: 0, background: "transparent", color: "#183b32", fontWeight: 700, cursor: "pointer" }}>Email me a sign-in link</button>
      </div>}
      {message && <p role={messageType === "error" ? "alert" : "status"} aria-live="polite" style={{ marginTop: 16, padding: 12, borderRadius: 6, fontSize: 13, lineHeight: 1.6, color: messageType === "error" ? "#8a3829" : "#315c49", background: messageType === "error" ? "#f9e8e2" : "#e7eee7" }}>{message}</p>}
      <p style={{ marginTop: 20, fontSize: 11, lineHeight: 1.6, color: "#7a8780" }}>Your account is protected by secure sign-in. Use a strong, unique password.</p>
    </form>
  );
}
