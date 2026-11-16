"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const starters = [
  "How do I add my first property?",
  "How do I add a tenant and lease?",
  "How do I record or test rent payments?",
  "Where can I see rent arrears?",
];

function MessageText({ content }: { content: string }) {
  const parts = content.split(/(\/dashboard\/operations|\/dashboard|\/login)/g);
  return <>{parts.map((part, index) => part.startsWith("/") ? <a key={index} href={part} style={{color:"#a7d9c4",textDecoration:"underline"}}>{part}</a> : <span key={index}>{part}</span>)}</>;
}

export default function PropertyAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm the PropertyOS AI guide. I can help you find your way around, set up a property, add tenants and leases, and understand rent collection. What would you like to do?" },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy, open]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setDraft("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.role !== "assistant" || messages.indexOf(m) >= 0).slice(-10) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant is unavailable.");
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <div style={{position:"fixed",right:20,bottom:20,zIndex:1000,fontFamily:"Arial,Helvetica,sans-serif"}}>
      {open && <section aria-label="PropertyOS AI customer assistant" style={{width:"min(370px,calc(100vw - 32px))",height:"min(570px,calc(100dvh - 105px))",display:"flex",flexDirection:"column",background:"#102a27",color:"#eef4ed",border:"1px solid #42685a",borderRadius:16,boxShadow:"0 18px 65px rgba(0,0,0,.28)",overflow:"hidden",marginBottom:12}}>
        <header style={{padding:"16px 17px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.13)"}}>
          <div><div style={{fontSize:14,fontWeight:800}}>PropertyOS AI Guide</div><div style={{fontSize:11,color:"#a8c8b8",marginTop:4}}>Here to help you find your way</div></div>
          <button onClick={() => setOpen(false)} aria-label="Close assistant" style={{background:"transparent",color:"#e8f1eb",border:0,fontSize:23,cursor:"pointer"}}>×</button>
        </header>
        <div aria-live="polite" style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:11}}>
          {messages.map((message,index)=><div key={index} style={{alignSelf:message.role==="user"?"flex-end":"flex-start",maxWidth:"88%",background:message.role==="user"?"#d0e7d8":"#1d4038",color:message.role==="user"?"#153329":"#edf4ed",padding:"10px 12px",borderRadius:12,fontSize:13,lineHeight:1.55,whiteSpace:"pre-wrap"}}><MessageText content={message.content}/></div>)}
          {busy && <div style={{alignSelf:"flex-start",background:"#1d4038",padding:"10px 12px",borderRadius:12,fontSize:12,color:"#c3d8cb"}}>Thinking…</div>}
          {error && <div role="alert" style={{fontSize:12,color:"#ffd0bd",padding:"4px 2px"}}>{error}</div>}
          {messages.length===1 && <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:5}}>{starters.map((item)=><button key={item} onClick={()=>void send(item)} style={{textAlign:"left",background:"transparent",border:"1px solid #527667",color:"#d5e9dc",borderRadius:9,padding:"9px 10px",fontSize:11,cursor:"pointer"}}>{item} →</button>)}</div>}
          <div ref={bottomRef}/>
        </div>
        <form onSubmit={submit} style={{display:"flex",gap:8,padding:12,borderTop:"1px solid rgba(255,255,255,.13)"}}>
          <input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Ask how to do something…" aria-label="Your message" maxLength={1800} style={{flex:1,minWidth:0,borderRadius:9,border:"1px solid #527667",background:"#f5f7f2",color:"#19372f",padding:"11px 12px",fontSize:13,outline:"none"}}/>
          <button type="submit" disabled={busy || !draft.trim()} style={{border:0,borderRadius:9,background:"#a6d2c2",color:"#17362d",fontWeight:800,padding:"0 14px",cursor:busy?"wait":"pointer",opacity:busy||!draft.trim()?.5:1}}>Send</button>
        </form>
      </section>}
      <button onClick={()=>setOpen((v)=>!v)} aria-label={open?"Close PropertyOS assistant":"Open PropertyOS assistant"} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:9,border:0,borderRadius:999,background:"#a6d2c2",color:"#14352d",padding:"13px 17px",fontWeight:800,fontSize:13,boxShadow:"0 7px 25px rgba(0,0,0,.2)",cursor:"pointer"}}>
        <span style={{fontSize:18}}>✦</span>{open?"Close guide":"Need help? Ask AI"}
      </button>
    </div>
  );
}
