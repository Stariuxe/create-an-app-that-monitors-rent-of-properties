"use client";

import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string;
      reset?: (widgetId: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}



export default function PilotInterestForm() {
  const [siteKey, setSiteKey] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const widget = useRef<string | null>(null);
  const challenge = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/pilot-interest/config", { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Configuration unavailable")))
      .then(data => { if (active) setSiteKey(typeof data.siteKey === "string" ? data.siteKey : ""); })
      .catch(() => { if (active) setSiteKey(""); })
      .finally(() => { if (active) setConfigLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || !siteKey || !challenge.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(challenge.current, {
      sitekey: siteKey,
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
    return () => {
      if (widget.current && window.turnstile?.remove) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [ready]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!consent) {
      setStatus("Please confirm that we may contact you about the pilot.");
      return;
    }
    if (!token) {
      setStatus("Please complete the security check before submitting.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/pilot-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          consent,
          turnstileToken: token,
          companyWebsite: "",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not save your interest. Please try again.");
      setSuccess(true);
      setEmail("");
      setConsent(false);
      setToken("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "We could not save your interest. Please try again.");
      if (widget.current && window.turnstile?.reset) window.turnstile.reset(widget.current);
      setToken("");
    } finally {
      setBusy(false);
    }
  }

  if (configLoaded && !siteKey) {
    return (
      <div>
        <h3>Pilot applications opening soon.</h3>
        <p>We are completing secure registration before collecting contact details. You can create a landlord account to check access in the meantime.</p>
        <a className="button button-primary form-button" href="/signup">Create your account <span>↗</span></a>
        <small className="form-disclaimer">Pilot registration will open after security verification is configured.</small>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      {success ? (
        <div className="success-state" role="status" aria-live="polite">
          <div className="success-icon">✓</div>
          <h3>Thank you for your interest.</h3>
          <p>Your pilot enquiry has been received. We’ll contact you about the next steps.</p>
        </div>
      ) : (
        <>
          <h3>Get on the list.</h3>
          <p>Leave your email and we’ll contact you about the PropertyOS AI landlord pilot.</p>
          <form onSubmit={submit} aria-busy={busy}>
            <label htmlFor="pilot-email">WORK EMAIL</label>
            <input
              id="pilot-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@company.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
            <label style={{ display: "flex", gap: 9, alignItems: "flex-start", margin: "12px 0", textTransform: "none", letterSpacing: 0, lineHeight: 1.5 }}>
              <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required style={{ width: 16, minWidth: 16, marginTop: 3 }} />
              <span>I agree that PropertyOS AI may contact me about the landlord pilot. I can withdraw my interest later.</span>
            </label>
            <div ref={challenge} aria-label="Security verification" />
            <button className="button button-primary form-button" type="submit" disabled={busy || !ready || !token}>
              {busy ? "Submitting…" : "Register interest"} <span>↗</span>
            </button>
          </form>
          {status && <p role="alert" aria-live="polite">{status}</p>}
          <small className="form-disclaimer">We use your email only to respond to this pilot enquiry. Read our <a href="/privacy">Privacy Policy</a>.</small>
        </>
      )}
    </>
  );
}
