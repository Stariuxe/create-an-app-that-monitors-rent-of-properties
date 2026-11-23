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

      <section className="workspace-settings-card workspace-settings-help">
        <div><h2>Preferences on this device</h2><p>These appearance choices are stored locally in this browser. They do not change rent records, payments, account permissions or other users’ settings.</p></div>
        <button type="button" className="workspace-reset-button" onClick={reset}>Restore defaults</button>
      </section>
    </div>
  );
}
