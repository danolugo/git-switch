import type { ActiveIdentityState, GitProfile } from "../types";

interface DashboardProps {
  identity: ActiveIdentityState | null;
  profiles: GitProfile[];
  loading: boolean;
  switchingId: string | null;
  error: string;
  onRefresh: () => void;
  onSwitch: (profileId: string) => void;
}

export function Dashboard({
  identity,
  profiles,
  loading,
  switchingId,
  error,
  onRefresh,
  onSwitch,
}: DashboardProps) {
  const activeProfile = identity?.activeProfile;
  const global = identity?.global;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>See your active Git identity and switch with one click.</p>
        </div>
        <button type="button" className="secondary" onClick={onRefresh}>
          Refresh
        </button>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="dashboard-grid">
        <article className="card highlight-card">
          <p className="eyebrow">Currently using</p>
          {loading ? (
            <p>Loading identity...</p>
          ) : (
            <>
              <h2>{activeProfile?.name ?? "Unmatched profile"}</h2>
              <p className="identity-line">{global?.userName ?? "Not set"}</p>
              <p className="identity-line muted">
                {global?.userEmail ?? "Not set"}
              </p>
              {!activeProfile ? (
                <p className="hint">
                  Global Git config does not match any saved profile.
                </p>
              ) : null}
            </>
          )}
        </article>

        <article className="card">
          <h3>Quick switch</h3>
          {profiles.length === 0 ? (
            <p className="hint">Add profiles to enable one-click switching.</p>
          ) : (
            <div className="switch-list">
              {profiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;
                const isSwitching = switchingId === profile.id;

                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`switch-item ${isActive ? "active" : ""}`}
                    disabled={isSwitching}
                    onClick={() => onSwitch(profile.id)}
                  >
                    <span className="switch-name">
                      {isActive ? "✓ " : ""}
                      {profile.name}
                    </span>
                    <span className="switch-meta">{profile.userEmail}</span>
                    {isSwitching ? (
                      <span className="switch-status">Switching...</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
