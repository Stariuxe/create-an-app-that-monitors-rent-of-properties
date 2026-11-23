"use client";

import { useEffect, useState } from "react";

type Preferences = {
  theme: "emerald" | "midnight" | "light";
  density: "comfortable" | "compact";
  textSize: "standard" | "large";
  reducedMotion: boolean;
};

const defaults: Preferences = {
  theme: "emerald",
  density: "comfortable",
  textSize: "standard",
  reducedMotion: false,
};

function applyPreferences(value: Preferences) {
  const root = document.documentElement;
  root.dataset.propertyosTheme = value.theme;
  root.dataset.propertyosDensity = value.density;
  root.dataset.propertyosText = value.textSize;
  root.dataset.propertyosMotion = value.reducedMotion ? "reduced" : "full";
}

export default function SettingsPanel() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("Notifications are off.");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("propertyos-workspace-preferences");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences>;
        const next = {
          theme: ["emerald", "midnight", "light"].includes(String(parsed.theme)) ? parsed.theme! : defaults.theme,
          density: ["comfortable", "compact"].includes(String(parsed.density)) ? parsed.density! : defaults.density,
          textSize: ["standard", "large"].includes(String(parsed.textSize)) ? parsed.textSize! : defaults.textSize,
          reducedMotion: typeof parsed.reducedMotion === "boolean" ? parsed.reducedMotion : defaults.reducedMotion,
        } as Preferences;
        setPreferences(next);
        applyPreferences(next);
      } else {
        applyPreferences(defaults);
      }
    } catch {
      applyPreferences(defaults);
    }
    const notificationsOn = window.localStorage.getItem("propertyos-notifications-enabled") === "true";
    setNotificationsEnabled(notificationsOn);
    if (!("Notification" in window)) setNotificationMessage("This browser does not support desktop notifications.");
    else if (Notification.permission === "denied") setNotificationMessage("Notifications are blocked in this browser. Change site permissions in your browser to allow them.");
    else if (notificationsOn && Notification.permission === "granted") setNotificationMessage("Allowed. PropertyOS will alert you about overdue rent and urgent property issues while your workspace is open.");
    else setNotificationMessage("Off. Turn this on to receive alerts about items needing your attention.");
    setReady(true);
  }, []);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    applyPreferences(next);
    try {
      window.localStorage.setItem("propertyos-workspace-preferences", JSON.stringify(next));
    } catch {
      // The current page still receives the selected preference if storage is unavailable.
    }
  }

  async function updateNotifications(enabled: boolean) {
    if (!enabled) {
      setNotificationsEnabled(false);
      setNotificationMessage("Notifications are off.");
      window.localStorage.setItem("propertyos-notifications-enabled", "false");
      window.dispatchEvent(new Event("propertyos-notification-preference-change"));
      return;
    }
    if (!("Notification" in window)) {
      setNotificationsEnabled(false);
      setNotificationMessage("This browser does not support desktop notifications.");
      return;
    }
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") {
      setNotificationsEnabled(false);
      setNotificationMessage(permission === "denied" ? "Permission was blocked. Allow notifications for this website in your browser settings, then try again." : "Permission was not granted. Notifications remain off.");
      window.localStorage.setItem("propertyos-notifications-enabled", "false");
      window.dispatchEvent(new Event("propertyos-notification-preference-change"));
      return;
    }
    setNotificationsEnabled(true);
    setNotificationMessage("Allowed. PropertyOS will alert you about overdue rent and urgent property issues while your workspace is open.");
    window.localStorage.setItem("propertyos-notifications-enabled", "true");
    window.dispatchEvent(new Event("propertyos-notification-preference-change"));
  }

  function reset() {
    setPreferences(defaults);
    applyPreferences(defaults);
    try {
      window.localStorage.setItem("propertyos-workspace-preferences", JSON.stringify(defaults));
    } catch {}
  }

  return (
    <div className="workspace-settings-grid" aria-busy={!ready}>
      <section className="workspace-settings-card">
        <div className="workspace-settings-card-heading"><span>01</span><div><h2>Appearance</h2><p>Choose the atmosphere of your workspace.</p></div></div>
        <div className="workspace-settings-options">
          {([
            ["emerald", "Emerald glass", "The existing PropertyOS dark-green workspace."],
            ["midnight", "Midnight", "A deeper, low-glare dark appearance."],
            ["light", "Light", "A bright, clean workspace for daytime use."],
          ] as const).map(([value, label, description]) => (
            <label className={`workspace-choice workspace-theme-choice ${preferences.theme === value ? "is-selected" : ""}`} key={value}>
              <input type="radio" name="theme" value={value} checked={preferences.theme === value} onChange={() => update("theme", value)} />
              <span className={`workspace-theme-swatch swatch-${value}`} aria-hidden="true" />
              <span><b>{label}</b><small>{description}</small></span>
            </label>
          ))}
        </div>
      </section>

      <section className="workspace-settings-card">
        <div className="workspace-settings-card-heading"><span>02</span><div><h2>Layout density</h2><p>Choose how much information fits on screen.</p></div></div>
        <div className="workspace-settings-options two">
          <label className={`workspace-choice ${preferences.density === "comfortable" ? "is-selected" : ""}`}>
            <input type="radio" name="density" checked={preferences.density === "comfortable"} onChange={() => update("density", "comfortable")} />
            <span><b>Comfortable</b><small>More breathing room between sections.</small></span>
          </label>
          <label className={`workspace-choice ${preferences.density === "compact" ? "is-selected" : ""}`}>
            <input type="radio" name="density" checked={preferences.density === "compact"} onChange={() => update("density", "compact")} />
            <span><b>Compact</b><small>Tighter spacing for information-dense work.</small></span>
          </label>
        </div>
      </section>

      <section className="workspace-settings-card">
        <div className="workspace-settings-card-heading"><span>03</span><div><h2>Reading & motion</h2><p>Make the workspace easier to read and use.</p></div></div>
        <div className="workspace-settings-options two">
          <label className={`workspace-choice ${preferences.textSize === "standard" ? "is-selected" : ""}`}>
            <input type="radio" name="text-size" checked={preferences.textSize === "standard"} onChange={() => update("textSize", "standard")} />
            <span><b>Standard text</b><small>Default text sizing.</small></span>
          </label>
          <label className={`workspace-choice ${preferences.textSize === "large" ? "is-selected" : ""}`}>
            <input type="radio" name="text-size" checked={preferences.textSize === "large"} onChange={() => update("textSize", "large")} />
            <span><b>Larger text</b><small>Increase workspace text for readability.</small></span>
          </label>
        </div>
        <label className="workspace-toggle-row">
          <span><b>Reduce motion</b><small>Limit decorative transitions and animations.</small></span>
          <input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => update("reducedMotion", event.target.checked)} />
        </label>
      </section>

      <section className="workspace-settings-card">
        <div className="workspace-settings-card-heading"><span>04</span><div><h2>Attention notifications</h2><p>Choose whether PropertyOS can alert you when something needs your attention.</p></div></div>
        <label className="workspace-toggle-row">
          <span><b>Allow landlord notifications</b><small>Overdue rent charges and high or urgent unresolved maintenance items.</small></span>
          <input type="checkbox" checked={notificationsEnabled} onChange={(event) => void updateNotifications(event.target.checked)} disabled={!ready} />
        </label>
        <p className="workspace-notification-status" role="status" aria-live="polite">{notificationMessage}</p>
        <p className="workspace-notification-note">Notifications use this browser's permission and appear while your PropertyOS workspace is open. You can turn them off here at any time.</p>
      </section>

      <section className="workspace-settings-card workspace-settings-help">
        <div><h2>Preferences on this device</h2><p>These appearance choices are stored locally in this browser. They do not change rent records, payments, account permissions or other users’ settings.</p></div>
        <button type="button" className="workspace-reset-button" onClick={reset}>Restore defaults</button>
      </section>
    </div>
  );
}
