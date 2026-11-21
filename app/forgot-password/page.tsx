"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage(""); setError(false);
    try {
      const redirectTo = new URL("/auth/callback?next=/update-password", window.location.origin).toString();
      const { error: requestError } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (requestError) throw requestError;
      setMessage("If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "We could not send the reset link. Please try again.");
    } finally { setBusy(false); }
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#102624"}}>
    <section style={{width:"100%",maxWidth:460,padding:36,background:"#f3f2ec",borderRadius:12}}>
      <a href="/login" style={{color:"#4d907f",fontWeight:700,fontSize:13}}>← Back to sign in</a>
      <p style={{color:"#638a7e",fontSize:11,letterSpacing:2,marginTop:32}}>PROPERTYOS AI / ACCOUNT RECOVERY</p>
      <h1 style={{fontSize:32,lineHeight:1.15,color:"#132c2a"}}>Reset your password.</h1>
      <p style={{color:"#687573",fontSize:14,lineHeight:1.6}}>Enter the email address on your landlord account. We’ll send a secure reset link if an account matches.</p>
      <form onSubmit={submit}>
        <label htmlFor="recovery-email" style={{fontSize:12,color:"#53665c"}}>Email address</label>
        <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:13,border:"1px solid #cfd9d0",borderRadius:6,marginTop:7,marginBottom:16}}/>
        <button disabled={busy} style={{width:"100%",padding:14,border:0,borderRadius:6,background:"#183b32",color:"#fff",fontWeight:700}}>{busy?"Sending…":"Send password reset link"}</button>
      </form>
      {message && <p role={error?"alert":"status"} style={{marginTop:16,padding:12,borderRadius:6,fontSize:13,lineHeight:1.6,color:error?"#8a3829":"#315c49",background:error?"#f9e8e2":"#e7eee7"}}>{message}</p>}
    </section>
  </main>;
}
