import { useEffect, useState } from "react";
import { TerminalWindow } from "../components/TerminalWindow";
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
      <header className="page-head">
        <div>
          <h1 className="page-title glitch">~/settings</h1>
          <p className="page-sub">cat ~/.git-switch/config</p>
        </div>
      </header>

      <TerminalWindow title="configuration" flag="--env">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">git executable path</span>
            <span className="input-wrap">
              <span className="prompt" aria-hidden="true">
                bin&gt;
              </span>
              <input
                className="input"
                value={draft.gitExecutable}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    gitExecutable: event.target.value,
                  }))
                }
                placeholder="git"
              />
            </span>
          </label>

          <hr className="divider" />

          <label className="check-line">
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
            <span className="check-box" aria-hidden="true" />
            enable ssh key switching <span className="muted">// v0.3</span>
          </label>

          <label className="check-line">
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
            <span className="check-box" aria-hidden="true" />
            start minimized to tray <span className="muted">// v0.2</span>
          </label>

          {error ? <div className="banner banner-error">{error}</div> : null}
          {saved ? <div className="banner banner-ok">settings saved</div> : null}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "...saving" : "[ save config ]"}
            </button>
          </div>
        </form>
      </TerminalWindow>
    </section>
  );
}
