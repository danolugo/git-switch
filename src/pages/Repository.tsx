import { useState } from "react";
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
      <header className="page-header">
        <div>
          <h1>Repository mode</h1>
          <p>Apply a profile only to a specific local repository.</p>
        </div>
      </header>

      <article className="card">
        <div className="form-grid">
          <label>
            Repository folder
            <input
              value={repoPath}
              onChange={(event) => setRepoPath(event.target.value)}
              placeholder="C:\\code\\my-project"
            />
          </label>

          <label>
            Profile
            <select
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
            >
              <option value="">Select a profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="form-actions">
          <button type="button" disabled={applying} onClick={handleApply}>
            {applying ? "Applying..." : "Apply to repository"}
          </button>
        </div>
      </article>

      {repoIdentity ? (
        <article className="card">
          <h3>Repository identity updated</h3>
          <p>{repoIdentity.userName ?? "Not set"}</p>
          <p className="muted">{repoIdentity.userEmail ?? "Not set"}</p>
        </article>
      ) : null}
    </section>
  );
}
