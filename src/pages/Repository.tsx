import { useState } from "react";
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
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

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
      </header>

      <TerminalWindow title="repository identity" flag="--local">
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

        {error ? <div className="banner banner-error">{error}</div> : null}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={applying}
            onClick={handleApply}
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
