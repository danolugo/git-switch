import { useEffect, useState } from "react";
import { ErrorBanner } from "../components/ErrorBanner";
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

  async function saveDraft() {
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await saveDraft();
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

          <p className="hint">
            // when enabled, switching profiles updates ~/.ssh/config and rewrites
            https://github.com/ to SSH using that profile&apos;s private key file
          </p>

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
            enable ssh authentication switching
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
            start minimized to tray
          </label>

          {error ? (
            <ErrorBanner
              message={error}
              onRetry={() => void saveDraft()}
            />
          ) : null}
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
