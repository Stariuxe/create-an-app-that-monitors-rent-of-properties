import type { Metadata } from "next";
import "./globals.css";
import "./dashboard/preferences.css";
import PropertyAssistant from "@/components/property-assistant";
import PwaRegister from "@/components/pwa-register";

const siteUrl = "https://propertyosai.cc.cd";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "PropertyOS AI | Property Management & Rent Collection Software in Kenya", template: "%s | PropertyOS AI" },
  description: "Manage rental properties in Kenya with PropertyOS AI. Organise tenants, leases, rent charges and payment records in one property management workspace built for landlords and property managers.",
  applicationName: "PropertyOS AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "PropertyOS AI" },
  alternates: { canonical: "/" },
  icons: { icon: "/brand/propertyos-app-icon.webp", shortcut: "/brand/propertyos-app-icon.webp", apple: "/brand/propertyos-app-icon.webp" },
  keywords: ["property management software Kenya", "rental property management Kenya", "rent collection software Kenya", "landlord software Kenya", "property management Nairobi", "tenant management system", "rent tracking", "lease management", "PropertyOS AI"],
  openGraph: { title: "PropertyOS AI | Property Management Software for Kenya", description: "A clearer way for Kenyan landlords and property managers to organise properties, tenants, leases and rent workflows.", url: siteUrl, siteName: "PropertyOS AI", locale: "en_KE", type: "website" },
  twitter: { card: "summary_large_image", title: "PropertyOS AI | Property Management Software for Kenya", description: "Manage rental properties, tenants, leases and rent workflows in one workspace." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": siteUrl + "/#organization", name: "PropertyOS AI", url: siteUrl, logo: siteUrl + "/brand/propertyos-logo.webp", description: "Property management software being developed for landlords and property managers in Kenya.", address: { "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" }, parentOrganization: { "@type": "Organization", name: "Stariuxe Enterprises" } },
    { "@type": "SoftwareApplication", "@id": siteUrl + "/#software", name: "PropertyOS AI", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: siteUrl, description: "A property management workspace for organising rental properties, tenants, leases and rent workflows.", publisher: { "@id": siteUrl + "/#organization" }, inLanguage: "en-KE" },
    { "@type": "WebSite", "@id": siteUrl + "/#website", url: siteUrl, name: "PropertyOS AI", publisher: { "@id": siteUrl + "/#organization" }, inLanguage: "en-KE" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-KE"><body>{children}<PropertyAssistant /><PwaRegister /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
