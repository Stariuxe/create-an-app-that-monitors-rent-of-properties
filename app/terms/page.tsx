export const metadata = {
  title: "Terms of Use | PropertyOS AI",
  description: "Terms governing access to and use of PropertyOS AI.",
  robots: { index: true, follow: true },
};

const sections = [
  ["1. About the service", "PropertyOS AI is a property-management software product operated under Stariuxe Enterprises. The service is being developed and may be offered in early access or pilot form. Features, availability and interfaces may change."],
  ["2. Acceptance and eligibility", "By creating an account or using the service, you agree to these terms. You must be legally able to enter into a binding agreement and provide accurate account information. The service is intended for adults."],
  ["3. Accounts and security", "You are responsible for protecting your sign-in credentials, maintaining access to your email, and promptly reporting suspected unauthorised access. Never share passwords, M-Pesa PINs or OTPs with anyone, including support staff or the AI assistant."],
  ["4. Landlord and property-manager responsibilities", "You are responsible for the accuracy and lawfulness of property, tenant, lease, rent and payment information you submit. You must have authority and an appropriate legal basis to process tenant information, provide required notices, and respond to data-subject requests. You remain responsible for tenancy agreements, rent decisions, notices and compliance with applicable housing, tax and data-protection laws."],
  ["5. Payments and sandbox testing", "Sandbox payment functionality is for testing only and does not collect real rent. A payment must not be treated as completed until a verified payment-provider confirmation has been reconciled in the service. Do not enter your M-Pesa PIN into PropertyOS AI. Live payment processing is not offered unless separately announced and enabled."],
  ["6. Records, reports and AI guidance", "The service may display records, calculations, reports and AI-generated guidance. These are operational aids, not legal, tax, accounting, credit or investment advice. You must independently verify important figures and decisions. AI responses may be incomplete or incorrect."],
  ["7. Acceptable use", "You must not misuse the service, attempt to access another user's workspace, interfere with security controls, upload malicious code, submit unlawful or misleading content, reverse engineer protected components, or use the service to harass or unlawfully profile tenants."],
  ["8. Availability, changes and early access", "The service may be interrupted for maintenance, security, upgrades or events outside our control. Early-access features may be incomplete and may be changed or withdrawn. Do not rely on the service as the sole copy of critical tenancy, payment or accounting records; maintain appropriate independent records."],
  ["9. Intellectual property", "PropertyOS AI branding, software, interface and related materials are owned by or licensed to the operator. These terms grant you a limited, revocable right to use the service for its intended purpose and do not transfer ownership."],
  ["10. Suspension and termination", "Access may be restricted where necessary to protect users, comply with law, investigate misuse or secure the service. You may stop using the service and request account-related assistance through the published contact channel. Data handling on termination is subject to applicable law and the Privacy Policy."],
  ["11. Liability", "To the extent permitted by law, the service is provided during development and early access without a promise of uninterrupted or error-free operation. Nothing in these terms excludes liability that cannot lawfully be excluded, including rights or remedies that apply under Kenyan law."],
  ["12. Governing law and contact", "These terms are intended to be governed by the laws of Kenya, subject to mandatory consumer and other applicable protections. Questions may be sent to hello@propertyos.ai. These terms are a product draft and should receive Kenyan legal review before full commercial launch."]
];

export default function TermsPage() {
  return <main style={{minHeight:"100vh",background:"#f3f2ec",color:"#132c2a",padding:"32px 6%"}}>
    <article style={{maxWidth:850,margin:"0 auto",background:"#fff",padding:"clamp(24px,5vw,52px)",borderRadius:12,border:"1px solid #dce4dc"}}>
      <a href="/" style={{color:"#367762",fontWeight:700}}>← PropertyOS AI</a>
      <p style={{marginTop:36,color:"#6d9e8b",fontSize:11,letterSpacing:2}}>STARIUXE ENTERPRISES / PROPERTYOS AI</p>
      <h1 style={{fontSize:"clamp(34px,6vw,52px)",letterSpacing:-2,margin:"10px 0"}}>Terms of Use</h1>
      <p style={{color:"#687573",lineHeight:1.7}}>Effective date: 18 November 2026. These draft terms describe the intended conditions for using PropertyOS AI and require Kenyan legal review before full commercial launch.</p>
      {sections.map(([heading,body])=><section key={heading} style={{marginTop:28}}><h2 style={{fontSize:19}}>{heading}</h2><p style={{color:"#53645d",lineHeight:1.8,fontSize:14}}>{body}</p></section>)}
      <p style={{marginTop:40,borderTop:"1px solid #dce4dc",paddingTop:20,fontSize:12,color:"#687573"}}>PropertyOS AI · Smarter Property Management. Greater Value.</p>
    </article>
  </main>;
}
