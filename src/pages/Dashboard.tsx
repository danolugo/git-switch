import { ErrorBanner } from "../components/ErrorBanner";
import { ProgressBar } from "../components/ProgressBar";
import { TerminalWindow } from "../components/TerminalWindow";
import { Typewriter } from "../components/Typewriter";
import type { ActiveIdentityState, AuthStatus, GitProfile } from "../types";

interface DashboardProps {
  identity: ActiveIdentityState | null;
  authStatus: AuthStatus | null;
  profiles: GitProfile[];
  loading: boolean;
  switchingId: string | null;
  error: string;
  onRefresh: () => void;
  onSwitch: (profileId: string) => void;
}

function statusChip(set: boolean) {
  return set ? (
    <span className="status status-ok">[OK]</span>
  ) : (
    <span className="status status-err">[ERR]</span>
  );
}

function profileBadge(profile: GitProfile) {
  const color = profile.color ?? "#33ff00";
  const icon = profile.icon ?? profile.name.slice(0, 2).toLowerCase();

  return (
    <span className="profile-badge sm" style={{ borderColor: color, color }}>
      {icon}
    </span>
  );
}

export function Dashboard({
  identity,
  authStatus,
  profiles,
  loading,
  switchingId,
  error,
  onRefresh,
  onSwitch,
}: DashboardProps) {
  const activeProfile = identity?.activeProfile;
  const global = identity?.global;
  const hasName = Boolean(global?.userName);
  const hasEmail = Boolean(global?.userEmail);
  const matched = Boolean(activeProfile);
  const sshReady = Boolean(
    authStatus?.sshSwitchingEnabled &&
      authStatus.sshConfigApplied &&
      authStatus.activeSshKey,
  );

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title glitch">~/dashboard</h1>
          <p className="page-sub">git config --global --get user.*</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={onRefresh}>
            [ refresh ]
          </button>
        </div>
      </header>

      {error ? (
        <ErrorBanner message={error} onRetry={onRefresh} />
      ) : null}

      <div className="dash-grid">
        <TerminalWindow
          title="active identity"
          flag={matched ? "--matched" : "--unmatched"}
          tone={matched ? "primary" : "amber"}
        >
          {loading ? (
            <p className="id-line">
              reading config
              <span className="term-cursor" aria-hidden="true" />
            </p>
          ) : (
            <div className="id-block">
              <div className="profile-card-head">
                {activeProfile ? profileBadge(activeProfile) : null}
                <div>
                  <p className="id-eyebrow">currently using</p>
                  <h2 className="id-name">
                    <Typewriter
                      text={activeProfile?.name ?? "unmatched profile"}
                    />
                  </h2>
                </div>
              </div>
              <p className="id-line">
                <span className="key">user.name </span>
                {global?.userName ?? "not set"}
              </p>
              <p className="id-line">
                <span className="key">user.email</span>
                {global?.userEmail ?? "not set"}
              </p>

              <hr className="divider" />

              <div className="checks">
                <div className="check-row">
                  <span className="label">user.name</span>
                  {statusChip(hasName)}
                </div>
                <div className="check-row">
                  <span className="label">user.email</span>
                  {statusChip(hasEmail)}
                </div>
                <div className="check-row">
                  <span className="label">profile match</span>
                  <ProgressBar value={matched ? 100 : 0} />
                </div>
                <div className="check-row">
                  <span className="label">ssh auth</span>
                  {statusChip(sshReady)}
                </div>
              </div>

              {authStatus?.sshSwitchingEnabled ? (
                <p className="hint mono">
                  // ssh: {authStatus.activeSshKey ?? "none"} @{" "}
                  {authStatus.activeHost ?? "github.com"}
                </p>
              ) : (
                <p className="hint">// ssh switching disabled in ~/settings</p>
              )}

              {!matched ? (
                <p className="hint">
                  // global config matches no saved profile
                </p>
              ) : null}
            </div>
          )}
        </TerminalWindow>

        <TerminalWindow title="quick switch" flag="--global">
          {profiles.length === 0 ? (
            <p className="hint">// no profiles. add one in ~/profiles</p>
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
                      {profileBadge(profile)}
                      <span aria-hidden="true">{isActive ? ">" : "$"}</span>
                      {profile.name}
                      <span className="switch-tag">
                        {isSwitching
                          ? "...exec"
                          : isActive
                            ? "[active]"
                            : ""}
                      </span>
                    </span>
                    <span className="switch-meta">{profile.userEmail}</span>
                  </button>
                );
              })}
            </div>
          )}
        </TerminalWindow>
      </div>
    </section>
  );
}
