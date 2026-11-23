import "../preferences.css";
import SettingsPanel from "./settings-panel";

export default function WorkspaceSettingsPage() {
  return (
    <main className="workspace-settings-main">
      <section className="workspace-settings-intro">
        <p className="workspace-settings-eyebrow">PERSONALISE YOUR WORKSPACE</p>
        <h1>Settings & preferences</h1>
        <p>Adjust how PropertyOS AI looks and feels. Your choices are saved in this browser and applied across your landlord workspace.</p>
      </section>
      <SettingsPanel />
    </main>
  );
}
