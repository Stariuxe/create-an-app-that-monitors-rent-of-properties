import LoginForm from "@/app/login/login-form";

export const metadata = {
  title: "Create your landlord account",
  description: "Create a PropertyOS AI account to organise your rental property portfolio.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#102624" }}>
      <div style={{ width: "100%", maxWidth: 480, padding: 36, background: "#f3f2ec", borderRadius: 12 }}>
        <a href="/" style={{ color: "#4d907f", fontWeight: 700, fontSize: 13 }}>← PropertyOS AI home</a>
        <p style={{ color: "#638a7e", fontSize: 11, letterSpacing: 2, marginTop: 32 }}>PROPERTYOS AI / GET STARTED</p>
        <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: "12px 0", color: "#132c2a" }}>Create your landlord account.</h1>
        <p style={{ color: "#687573", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Create your account and continue to your landlord workspace.</p>
        <LoginForm initialMode="signup" />
        <p style={{ marginTop: 20, fontSize: 13, color: "#687573" }}>Already have an account? <a href="/login" style={{ color: "#183b32", fontWeight: 700 }}>Sign in</a></p>
      </div>
    </main>
  );
}
