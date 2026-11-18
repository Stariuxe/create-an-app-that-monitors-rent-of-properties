export const metadata = {
  title: "Privacy Policy | PropertyOS AI",
  description: "How PropertyOS AI collects, uses, protects and retains information.",
  robots: { index: true, follow: true },
};

const sections = [
  ["1. Who operates PropertyOS AI", "PropertyOS AI is a product operated under Stariuxe Enterprises. The service is designed for landlords, property managers and tenants. The legal identity and contact details of the data controller will be shown in the service onboarding information before public tenant-data onboarding."],
  ["2. Information we may process", "Depending on the features used, information may include account details such as name and email; property, unit and lease information; tenant contact details supplied by a landlord; rent charges, payment status and transaction references; maintenance requests; support messages; and technical information such as device, browser, security and diagnostic logs. Do not submit passwords, PINs or one-time passcodes to support or the AI assistant."],
  ["3. How information is used", "Information is used to provide and secure accounts and workspaces; manage property, unit, tenant and lease records; record rent charges and payment status; support reminders, reports and maintenance workflows; answer navigation questions through the AI assistant; troubleshoot errors; prevent fraud and abuse; and meet applicable legal obligations."],
  ["4. Lawful handling and sharing", "We aim to process personal information on a lawful basis under Kenya's Data Protection Act, 2019 and applicable regulations, including where necessary to provide a requested service, comply with law, protect legitimate interests, or obtain consent. Data may be processed by infrastructure, database, hosting, AI and payment providers that support the service. We do not authorise those providers to use customer information for unrelated purposes."],
  ["5. Payments and M-Pesa", "A sandbox payment test is not a real collection of rent. Do not enter a personal M-Pesa PIN into PropertyOS AI. Where payment features are enabled, payment providers may process the information needed to initiate and reconcile a transaction. Payment status should only be treated as confirmed after a verified provider callback and reconciliation."],
  ["6. AI assistant", "Messages submitted to the in-app assistant may be processed by an AI service provider to generate a response. Do not enter passwords, M-Pesa PINs, OTPs, bank credentials, government identification numbers or sensitive tenant information into the assistant. AI responses are guidance and may be inaccurate; verify important decisions."],
  ["7. Security and retention", "We use technical and organisational safeguards intended to protect information, including access controls and database row-level security. No internet service can guarantee absolute security. Information is retained only for as long as reasonably necessary for the service, legal obligations, dispute resolution and security. Retention periods and deletion workflows will be specified as the service matures."],
  ["8. Your rights and choices", "Subject to applicable law, individuals may request access to, correction of, deletion of, or restriction of processing of their personal information, object to certain processing, or withdraw consent where consent is the basis. Landlords are responsible for ensuring they have an appropriate basis and authority to add tenant information and for responding to tenant requests concerning records they control."],
  ["9. Children and third-party information", "The service is intended for adults managing property and tenancy matters, not for children. Do not submit children's personal information unless strictly necessary and legally authorised."],
  ["10. Cross-border processing and updates", "Service providers may process information in locations outside Kenya. Where required, appropriate safeguards will be applied. We may update this notice as features and legal requirements change; the current version will be published on this page."],
  ["11. Contact", "For privacy questions or requests, contact hello@propertyos.ai and identify the relevant account or request without sending passwords, PINs or one-time codes. This notice is a product privacy statement and is not legal advice."]
];

export default function PrivacyPage() {
  return <main style={{minHeight:"100vh",background:"#f3f2ec",color:"#132c2a",padding:"32px 6%"}}>
    <article style={{maxWidth:850,margin:"0 auto",background:"#fff",padding:"clamp(24px,5vw,52px)",borderRadius:12,border:"1px solid #dce4dc"}}>
      <a href="/" style={{color:"#367762",fontWeight:700}}>← PropertyOS AI</a>
      <p style={{marginTop:36,color:"#6d9e8b",fontSize:11,letterSpacing:2}}>STARIUXE ENTERPRISES / PROPERTYOS AI</p>
      <h1 style={{fontSize:"clamp(34px,6vw,52px)",letterSpacing:-2,margin:"10px 0"}}>Privacy Policy</h1>
      <p style={{color:"#687573",lineHeight:1.7}}>Effective date: 18 November 2026. This notice describes the intended handling of information by the current PropertyOS AI service. It should be reviewed and approved by a Kenyan data-protection professional before onboarding real tenant information.</p>
      {sections.map(([heading,body])=><section key={heading} style={{marginTop:28}}><h2 style={{fontSize:19}}>{heading}</h2><p style={{color:"#53645d",lineHeight:1.8,fontSize:14}}>{body}</p></section>)}
      <p style={{marginTop:40,borderTop:"1px solid #dce4dc",paddingTop:20,fontSize:12,color:"#687573"}}>PropertyOS AI · Smarter Property Management. Greater Value.</p>
    </article>
  </main>;
}
