import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/business-tools/", "/api/", "/auth/"],
    },
    sitemap: "https://propertyosai.cc.cd/sitemap.xml",
    host: "https://propertyosai.cc.cd",
  };
}
