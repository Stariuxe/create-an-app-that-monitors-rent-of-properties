"use client";

import { useEffect } from "react";

type AttentionItem = { id: string; title: string; body: string; href: string };

export default function LandlordAttentionNotifications() {
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const preferenceKey = "propertyos-notifications-enabled";
    const seenKey = "propertyos-notification-seen";

    async function checkAttention() {
      if (!active || document.visibilityState !== "visible" ||
          window.localStorage.getItem(preferenceKey) !== "true" ||
          !("Notification" in window) || Notification.permission !== "granted") return;
      try {
        const response = await fetch("/api/landlord-attention", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const data = await response.json() as { items?: AttentionItem[] };
        if (!active || !Array.isArray(data.items)) return;
        let seen: string[] = [];
        try {
          const parsed = JSON.parse(window.localStorage.getItem(seenKey) ?? "[]");
          if (Array.isArray(parsed)) seen = parsed.filter((value): value is string => typeof value === "string");
        } catch {}
        const seenSet = new Set(seen);
        const fresh = data.items.filter((item) => item && typeof item.id === "string" && !seenSet.has(item.id));
        for (const item of fresh.slice(0, 8)) {
          const notification = new Notification(item.title, {
            body: item.body,
            tag: item.id,
            icon: "/brand/propertyos-app-icon.webp",
          });
          notification.onclick = () => {
            window.focus();
            window.location.href = item.href;
            notification.close();
          };
          seenSet.add(item.id);
        }
        window.localStorage.setItem(seenKey, JSON.stringify(Array.from(seenSet).slice(-200)));
      } catch {
        // A temporary network/browser notification failure must not break the workspace.
      }
    }

    function start() {
      if (timer) clearInterval(timer);
      void checkAttention();
      timer = setInterval(() => void checkAttention(), 5 * 60 * 1000);
    }
    function onPreferenceChange() { start(); }
    document.addEventListener("visibilitychange", start);
    window.addEventListener("propertyos-notification-preference-change", onPreferenceChange);
    start();
    return () => {
      active = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("propertyos-notification-preference-change", onPreferenceChange);
    };
  }, []);

  return null;
}
