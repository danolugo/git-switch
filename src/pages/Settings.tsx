import { useEffect, useState } from "react";
import type { AppSettings } from "../types";

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

export function Settings({ settings, onSave }: SettingsProps) {
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await onSave(draft);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure Git executable path and future tray behavior.</p>
        </div>
      </header>

      <article className="card">
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Git executable path
              <input
                value={draft.gitExecutable}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    gitExecutable: event.target.value,
                  }))
                }
                placeholder="git"
              />
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={draft.sshSwitchingEnabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sshSwitchingEnabled: event.target.checked,
                }))
              }
            />
            Enable SSH key switching (v0.3)
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={draft.startMinimized}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  startMinimized: event.target.checked,
                }))
              }
            />
            Start minimized to tray (v0.2)
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {saved ? <p className="success-text">Settings saved.</p> : null}

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
