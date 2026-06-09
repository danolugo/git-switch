import { useCallback, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { detectGitRepo } from "../api/gitSwitch";
import { ErrorBanner } from "../components/ErrorBanner";
import { TerminalWindow } from "../components/TerminalWindow";
import type { GitIdentity, GitProfile } from "../types";

interface RepositoryProps {
  profiles: GitProfile[];
  onApply: (repoPath: string, profileId: string) => Promise<GitIdentity>;
}

export function Repository({ profiles, onApply }: RepositoryProps) {
  const [repoPath, setRepoPath] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [repoIdentity, setRepoIdentity] = useState<GitIdentity | null>(null);
  const [detectedFrom, setDetectedFrom] = useState("");
  const [error, setError] = useState("");
  const [detecting, setDetecting] = useState(true);
  const [applying, setApplying] = useState(false);

  const runDetect = useCallback(async () => {
    setDetecting(true);
    setError("");

    try {
      const detected = await detectGitRepo();
      setDetectedFrom(detected.searchedFrom);

      if (detected.repoPath) {
        setRepoPath(detected.repoPath);
        if (detected.identity) {
          setRepoIdentity(detected.identity);
        }
      }
    } catch (detectError) {
      setError(
        detectError instanceof Error
          ? detectError.message
          : "Could not detect repository.",
      );
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    void runDetect();
  }, [runDetect]);

  async function handleBrowse() {
    setError("");

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select repository folder",
      });

      if (typeof selected === "string") {
        setRepoPath(selected);
        const detected = await detectGitRepo(selected);
        setDetectedFrom(detected.searchedFrom);
        if (detected.repoPath) {
          setRepoPath(detected.repoPath);
          setRepoIdentity(detected.identity ?? null);
        } else {
          setRepoIdentity(null);
          setError("// selected folder is not inside a git repository");
        }
      }
    } catch (browseError) {
      setError(
        browseError instanceof Error
          ? browseError.message
          : "Could not open folder picker.",
      );
    }
  }

  async function handleApply() {
    if (!repoPath.trim()) {
      setError("Enter a repository folder path.");
      return;
    }

    if (!selectedProfileId) {
      setError("Select a profile to apply.");
      return;
    }

    setApplying(true);
    setError("");

    try {
      const identity = await onApply(repoPath.trim(), selectedProfileId);
      setRepoIdentity(identity);
    } catch (applyError) {
      setRepoIdentity(null);
      setError(
        applyError instanceof Error
          ? applyError.message
          : "Could not apply repo identity.",
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title glitch">~/repo</h1>
          <p className="page-sub">git config --local user.* &lt;repo&gt;</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn"
            disabled={detecting}
            onClick={() => void runDetect()}
          >
            {detecting ? "...scan" : "[ detect ]"}
          </button>
        </div>
      </header>

      {error ? (
        <ErrorBanner message={error} onRetry={() => void runDetect()} />
      ) : null}

      <TerminalWindow title="repository identity" flag="--local">
        {detecting ? (
          <p className="hint">
            // scanning cwd for .git
            <span className="term-cursor" aria-hidden="true" />
          </p>
        ) : detectedFrom ? (
          <p className="hint">// scanned from: {detectedFrom}</p>
        ) : null}

        <div className="form-grid">
          <label className="field">
            <span className="field-label">repository folder</span>
            <span className="input-wrap">
              <span className="prompt" aria-hidden="true">
                path&gt;
              </span>
              <input
                className="input"
                value={repoPath}
                onChange={(event) => setRepoPath(event.target.value)}
                placeholder="C:\\code\\my-project"
              />
            </span>
          </label>

          <label className="field">
            <span className="field-label">profile</span>
            <span className="input-wrap">
              <span className="prompt" aria-hidden="true">
                use&gt;
              </span>
              <select
                className="select"
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
              >
                <option value="">-- select --</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => void handleBrowse()}>
            [ browse ]
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={applying}
            onClick={() => void handleApply()}
          >
            {applying ? "...exec" : "[ apply to repo ]"}
          </button>
        </div>
      </TerminalWindow>

      {repoIdentity ? (
        <TerminalWindow title="config written" flag="--ok">
          <p className="id-line">
            <span className="key">user.name </span>
            {repoIdentity.userName ?? "not set"}
          </p>
          <p className="id-line">
            <span className="key">user.email</span>
            {repoIdentity.userEmail ?? "not set"}
          </p>
          <p className="success-text">[OK] local identity applied</p>
        </TerminalWindow>
      ) : null}
    </section>
  );
}
