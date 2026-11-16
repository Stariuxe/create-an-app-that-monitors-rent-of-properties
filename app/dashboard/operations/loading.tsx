export default function OperationsLoading() {
  return <main role="status" aria-live="polite" style={{minHeight:"100vh",background:"#f3f2ec",color:"#132c2a",padding:"32px 6%"}}>
    <div style={{maxWidth:1180,margin:"36px auto"}}>
      <p style={{color:"#6d9e8b",fontSize:11,letterSpacing:2}}>PROPERTYOS AI</p>
      <h1 style={{fontSize:32}}>Loading your workspace…</h1>
      <p style={{color:"#687573"}}>Your property records are being loaded. Please keep this page open.</p>
      <div aria-hidden="true" style={{height:8,maxWidth:420,background:"#dce4dc",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:"45%",background:"#6d9e8b",borderRadius:20}} /></div>
    </div>
  </main>;
}
