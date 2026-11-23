"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Method = "document_upload" | "korapay";
type DocumentType = "national_id" | "passport";

export default function VerificationPage() {
  const [method, setMethod] = useState<Method>("document_upload");
  const [documentType, setDocumentType] = useState<DocumentType>("national_id");
  const [file, setFile] = useState<File | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Not submitted");
  const [role, setRole] = useState("account");

  useEffect(() => {
    setRole(new URLSearchParams(window.location.search).get("role") || "account");
    const supabase = createClient();
    supabase.from("identity_verification_requests")
      .select("status, method").order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => { if (data?.[0]) setStatus(data[0].status.replace("_", " ")); });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Please sign in again before submitting verification.");
      if (!consent) throw new Error("Please confirm that you consent to identity verification.");

      if (method === "document_upload") {
        if (!file) throw new Error("Choose a clear photo or PDF of your ID or passport.");
        const allowed = ["image/jpeg", "image/png", "application/pdf"];
        if (!allowed.includes(file.type)) throw new Error("Only JPG, PNG or PDF files are accepted.");
        if (file.size > 5 * 1024 * 1024) throw new Error("The file must be 5 MB or smaller.");
        const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
        const path = auth.user.id + "/" + crypto.randomUUID() + "." + extension;
        const { error: uploadError } = await supabase.storage.from("identity-documents").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error } = await supabase.from("identity_verification_requests").insert({
          user_id: auth.user.id, method, document_type: documentType, document_path: path, status: "pending",
        });
        if (error) {
          await supabase.storage.from("identity-documents").remove([path]);
          throw error;
        }
        setStatus("pending review");
        setMessage("Your document was uploaded to private storage and submitted for review. It is not publicly accessible.");
      } else {
        if (!documentNumber.trim()) throw new Error("Enter your ID or passport number.");
        const response = await fetch("/api/identity/korapay", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentType, documentNumber: documentNumber.trim(), consent: true }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "The identity provider could not start verification.");
        setStatus("processing");
        setMessage("The identity check has been submitted. PropertyOS will not mark it verified until the provider result is confirmed.");
        setDocumentNumber("");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not submit verification. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = { width: "100%", padding: 12, border: "1px solid #cfd9d0", borderRadius: 7, marginTop: 7, marginBottom: 16, boxSizing: "border-box" };
  return (
    <main style={{ minHeight: "100vh", padding: 24, background: "#102624", display: "grid", placeItems: "center" }}>
      <section style={{ width: "100%", maxWidth: 620, background: "#f3f2ec", padding: 32, borderRadius: 12, color: "#132c2a" }}>
        <a href="/" style={{ color: "#387768" }}>← PropertyOS AI</a>
        <p style={{ color: "#638a7e", letterSpacing: 2, fontSize: 11, marginTop: 28 }}>ACCOUNT SECURITY / IDENTITY</p>
        <h1 style={{ fontSize: 30, margin: "8px 0" }}>Confirm your identity</h1>
        <p style={{ color: "#687573", lineHeight: 1.6 }}>Your account type: <strong>{role.replace("_", " ")}</strong>. Verification helps protect landlords, tenants and property records. Property access still requires an authorised invitation or membership.</p>
        <p style={{ padding: 12, background: "#e4ebe3", borderRadius: 7 }}>Verification status: <strong>{status}</strong></p>
        <form onSubmit={submit}>
          <label htmlFor="method">Choose a verification method</label>
          <select id="method" value={method} onChange={e => setMethod(e.target.value as Method)} style={field}>
            <option value="document_upload">Upload National ID or passport for secure review</option>
            <option value="korapay">Verify through Kora identity service</option>
          </select>
          <label htmlFor="documentType">Document type</label>
          <select id="documentType" value={documentType} onChange={e => setDocumentType(e.target.value as DocumentType)} style={field}>
            <option value="national_id">Kenyan National ID</option>
            <option value="passport">Passport</option>
          </select>
          {method === "document_upload" ? <>
            <label htmlFor="documentFile">ID / passport image or PDF (maximum 5 MB)</label>
            <input id="documentFile" type="file" accept="image/jpeg,image/png,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} style={field} />
            <p style={{ color: "#687573", fontSize: 12, lineHeight: 1.5 }}>Your file is stored in a private bucket. Only your account can access its uploaded file through the current policy. A reviewer workflow still needs to be assigned before manual review can be completed.</p>
          </> : <>
            <label htmlFor="documentNumber">National ID / passport number</label>
            <input id="documentNumber" autoComplete="off" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} style={field} />
            <p style={{ color: "#687573", fontSize: 12, lineHeight: 1.5 }}>The number is sent directly from the server to KoraPay over HTTPS and is not saved in the PropertyOS verification table. Provider access must be enabled and configured by the account owner.</p>
          </>}
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.5, margin: "8px 0 20px" }}>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
            I consent to the selected identity check and understand that my verification status will be stored by PropertyOS AI.
          </label>
          <button disabled={busy} type="submit" style={{ width: "100%", padding: 14, border: 0, borderRadius: 7, background: "#183b32", color: "#fff", fontWeight: 700, opacity: busy ? .65 : 1 }}>{busy ? "Submitting securely…" : "Submit identity check"}</button>
        </form>
        {message && <p role="status" aria-live="polite" style={{ padding: 12, background: "#e4ebe3", borderRadius: 7, lineHeight: 1.5 }}>{message}</p>}
        <p style={{ color: "#687573", fontSize: 11, lineHeight: 1.5, marginTop: 20 }}>Do not email identity documents. Never share your password or one-time security codes. Verification does not by itself grant access to any property.</p>
      </section>
    </main>
  );
}
