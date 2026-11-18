"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  initialMode?: "signin" | "signup";
  initialMessage?: string;
};

export default function LoginForm({
  initialMode = "signin",
  initialMessage = "",
}: LoginFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    initialMessage ? "error" : "info"
  );
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
          },
        });
        if (error) throw error;

        if (data.session) {
          setMessageType("success");
          setMessage("Your account is ready. Opening your landlord workspace…");
          window.location.replace("/dashboard");
          return;
        }

        // Hosted Supabase projects commonly require email confirmation.
        // Never tell users to disable verification just to bypass this security step.
        setMessageType("info");
        setMessage(
          "Your request has been received. If this email can be registered, check your inbox (and spam folder) for a confirmation link. Open that link to verify your email, then return here and sign in to create your landlord workspace."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessageType("success");
        setMessage("Signed in. Opening your landlord workspace…");
        window.location.replace("/dashboard");
        return;
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not complete that request. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #cfd9d0",
    borderRadius: 6,
    background: "#fff",
    color: "#132c2a",
    marginTop: 7,
    marginBottom: 16,
  };

  return (
    <form onSubmit={submit} aria-busy={busy}>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <button
          type="button"
          onClick={() => { setMode("signin"); setMessage(""); }}
          style={{
            flex: 1, padding: 11, border: 0, borderRadius: 6,
            background: mode === "signin" ? "#183b32" : "#e2e7df",
            color: mode === "signin" ? "#fff" : "#183b32",
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode("signup"); setMessage(""); }}
          style={{
            flex: 1, padding: 11, border: 0, borderRadius: 6,
            background: mode === "signup" ? "#183b32" : "#e2e7df",
            color: mode === "signup" ? "#fff" : "#183b32",
          }}
        >
          Create account
        </button>
      </div>
      {mode === "signup" && (
        <>
          <label htmlFor="fullName" style={{ fontSize: 12, color: "#53665c" }}>
            Full name
          </label>
          <input
            id="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={field}
          />
        </>
      )}
      <label htmlFor="email" style={{ fontSize: 12, color: "#53665c" }}>
        Email address
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={field}
      />
      <label htmlFor="password" style={{ fontSize: 12, color: "#53665c" }}>
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={field}
      />
      <button
        disabled={busy}
        type="submit"
        style={{
          width: "100%", padding: 14, border: 0, borderRadius: 6,
          background: "#183b32", color: "#fff", fontWeight: 700,
          cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Please wait…" : mode === "signin" ? "Sign in securely →" : "Create landlord account →"}
      </button>
      {message && (
        <p
          role={messageType === "error" ? "alert" : "status"}
          aria-live="polite"
          style={{
            marginTop: 16, padding: 12, borderRadius: 6, fontSize: 13, lineHeight: 1.6,
            color: messageType === "error" ? "#8a3829" : "#315c49",
            background: messageType === "error" ? "#f9e8e2" : "#e7eee7",
          }}
        >
          {message}
        </p>
      )}
      <p style={{ marginTop: 20, fontSize: 11, lineHeight: 1.6, color: "#7a8780" }}>
        Your account is protected by secure sign-in. Use a strong, unique password.
        Email verification may be required before your first sign-in.
      </p>
    </form>
  );
}
