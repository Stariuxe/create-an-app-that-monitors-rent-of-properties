"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("Verifying your secure recovery session…");
  const [error,setError]=useState(false);

  useEffect(()=>{
    const supabase=createClient();
    let active=true;
    supabase.auth.getSession().then(({data})=>{
      if(!active)return;
      setReady(Boolean(data.session));
      setMessage(data.session?"Choose a new password for your account.":"This reset link is invalid or has expired. Request a new password reset link.");
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(!active)return;
      if(event==="PASSWORD_RECOVERY" || session){setReady(true);setMessage("Choose a new password for your account.");}
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(password.length<8){setError(true);setMessage("Use at least 8 characters.");return;}
    if(password!==confirm){setError(true);setMessage("The passwords do not match.");return;}
    setBusy(true);setError(false);
    const {error:updateError}=await createClient().auth.updateUser({password});
    setBusy(false);
    if(updateError){setError(true);setMessage(updateError.message);return;}
    setMessage("Password updated. Taking you to your landlord workspace…");
    window.location.replace("/dashboard");
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#102624"}}>
    <section style={{width:"100%",maxWidth:460,padding:36,background:"#f3f2ec",borderRadius:12}}>
      <a href="/login" style={{color:"#4d907f",fontWeight:700,fontSize:13}}>← PropertyOS AI</a>
      <p style={{color:"#638a7e",fontSize:11,letterSpacing:2,marginTop:32}}>PROPERTYOS AI / SECURE PASSWORD</p>
      <h1 style={{fontSize:32,lineHeight:1.15,color:"#132c2a"}}>Choose a new password.</h1>
      {ready ? <form onSubmit={submit}>
        <label htmlFor="new-password" style={{fontSize:12,color:"#53665c"}}>New password</label>
        <input id="new-password" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:13,border:"1px solid #cfd9d0",borderRadius:6,marginTop:7,marginBottom:16}}/>
        <label htmlFor="confirm-password" style={{fontSize:12,color:"#53665c"}}>Confirm new password</label>
        <input id="confirm-password" type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} style={{width:"100%",padding:13,border:"1px solid #cfd9d0",borderRadius:6,marginTop:7,marginBottom:16}}/>
        <button disabled={busy} style={{width:"100%",padding:14,border:0,borderRadius:6,background:"#183b32",color:"#fff",fontWeight:700}}>{busy?"Updating…":"Update password"}</button>
      </form> : <p style={{color:"#687573",fontSize:14,lineHeight:1.6}}>{message}</p>}
      {message && <p role={error?"alert":"status"} style={{marginTop:16,fontSize:13,lineHeight:1.6,color:error?"#8a3829":"#315c49"}}>{message}</p>}
      {!ready && <a href="/forgot-password" style={{display:"inline-block",marginTop:12,color:"#183b32",fontWeight:700}}>Request another reset link</a>}
    </section>
  </main>;
}
