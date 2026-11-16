import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertyOS AI — Every Property. Under Control.",
  description: "A clearer way to manage rental properties. Keep properties, tenants, leases and rent workflows organised in one workspace.",
  applicationName: "PropertyOS AI",
  icons: { icon: "/brand/propertyos-app-icon.webp", shortcut: "/brand/propertyos-app-icon.webp", apple: "/brand/propertyos-app-icon.webp" },
  keywords: ["property management", "rent collection", "landlords", "Kenya", "PropertyOS AI"],
  openGraph: {
    title: "PropertyOS AI — Every Property. Under Control.",
    description: "Bring your rental operations into one clear workspace.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
