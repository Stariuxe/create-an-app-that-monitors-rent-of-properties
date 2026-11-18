import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.stariuxe.propertyosai",
  appName: "PropertyOS AI",
  webDir: "www",
  server: {
    // The Android shell loads the secured production web app.
    // Keep the product backend and authentication on the existing HTTPS origin.
    url: "https://propertyosai.cc.cd",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
