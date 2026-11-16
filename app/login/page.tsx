import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#102624" }}>
      <div style={{ width: "100%", maxWidth: 460, padding: 36, background: "#f3f2ec", borderRadius: 12 }}>
        <a href="/" style={{ color: "#4d907f", fontWeight: 700, fontSize: 13 }}>← PropertyOS AI</a>
        <p style={{ color: "#638a7e", fontSize: 11, letterSpacing: 2, marginTop: 32 }}>PROPERTYOS AI / ACCOUNT</p>
        <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: "12px 0", color: "#132c2a" }}>Your property workspace.</h1>
        <p style={{ color: "#687573", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Sign in or create your landlord account to continue.</p>
        <LoginForm />
      </div>
    </main>
  );
}
