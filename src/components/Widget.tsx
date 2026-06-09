import { ProfileBadge } from "./ProfileBadge";
import type { ActiveIdentityState, GitProfile } from "../types";

interface WidgetProps {
  identity: ActiveIdentityState | null;
  profiles: GitProfile[];
  loading: boolean;
  switchingId: string | null;
  error: string;
  onSwitch: (profileId: string) => void;
  onExpand: () => void;
}

export function Widget({
  identity,
  profiles,
  loading,
  switchingId,
  error,
  onSwitch,
  onExpand,
}: WidgetProps) {
  const activeProfile = identity?.activeProfile;
  const global = identity?.global;

  return (
    <>
      <div className="crt" aria-hidden="true" />
      <div className="widget-shell">
        <header className="widget-head">
          <div className="widget-brand">
            <span className="widget-title">git-switch</span>
            <span className="widget-flag">[ widget ]</span>
          </div>
          <button type="button" className="btn btn-compact" onClick={onExpand}>
            [ expand ]
          </button>
        </header>

        <section className="widget-active">
          <p className="widget-label">// active account</p>
          {loading ? (
            <p className="widget-value">
              loading
              <span className="term-cursor" aria-hidden="true" />
            </p>
          ) : (
            <div className="widget-active-row">
              {activeProfile ? <ProfileBadge profile={activeProfile} size="sm" /> : null}
              <div>
                <p className="widget-value">
                  {activeProfile?.name ?? "unmatched"}
                </p>
                <p className="widget-meta">
                  {global?.userEmail ?? "not set"}
                </p>
              </div>
            </div>
          )}
        </section>

        {error ? <p className="widget-error">{error}</p> : null}

        <section className="widget-switch">
          <p className="widget-label">// quick switch</p>
          {profiles.length === 0 ? (
            <p className="widget-meta">no profiles saved</p>
          ) : (
            <div className="widget-switch-list">
              {profiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;
                const isSwitching = switchingId === profile.id;

                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`widget-switch-item ${isActive ? "active" : ""}`}
                    disabled={isSwitching}
                    onClick={() => onSwitch(profile.id)}
                  >
                    <ProfileBadge profile={profile} size="sm" />
                    <span className="widget-switch-name">{profile.name}</span>
                    <span className="widget-switch-state">
                      {isSwitching ? "..." : isActive ? "[on]" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
