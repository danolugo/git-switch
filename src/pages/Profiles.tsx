import { useState } from "react";
import { ProfileForm } from "../components/ProfileForm";
import { TerminalWindow } from "../components/TerminalWindow";
import type { GitProfile, ProfileFormValues } from "../types";

interface ProfilesProps {
  profiles: GitProfile[];
  onCreate: (values: ProfileFormValues) => Promise<void>;
  onUpdate: (profileId: string, values: ProfileFormValues) => Promise<void>;
  onDelete: (profileId: string) => Promise<void>;
}

export function Profiles({
  profiles,
  onCreate,
  onUpdate,
  onDelete,
}: ProfilesProps) {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingProfile, setEditingProfile] = useState<GitProfile | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(profileId: string) {
    setError("");
    try {
      await onDelete(profileId);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete profile.",
      );
    }
  }

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title glitch">~/profiles</h1>
          <p className="page-sub">ls -la ~/.git-switch/profiles</p>
        </div>
        {mode === "list" ? (
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setMode("create");
                setEditingProfile(null);
              }}
            >
              [ + new profile ]
            </button>
          </div>
        ) : null}
      </header>

      {error ? <div className="banner banner-error">{error}</div> : null}

      {mode === "create" ? (
        <TerminalWindow title="new profile" flag="--create">
          <ProfileForm
            submitLabel="[ create ]"
            onCancel={() => setMode("list")}
            onSubmit={async (values) => {
              await onCreate(values);
              setMode("list");
            }}
          />
        </TerminalWindow>
      ) : null}

      {mode === "edit" && editingProfile ? (
        <TerminalWindow title={`edit: ${editingProfile.name}`} flag="--update">
          <ProfileForm
            initial={editingProfile}
            submitLabel="[ save ]"
            onCancel={() => {
              setMode("list");
              setEditingProfile(null);
            }}
            onSubmit={async (values) => {
              await onUpdate(editingProfile.id, values);
              setMode("list");
              setEditingProfile(null);
            }}
          />
        </TerminalWindow>
      ) : null}

      {mode === "list" ? (
        <div className="profile-grid">
          {profiles.length === 0 ? (
            <TerminalWindow title="empty" flag="--0-records" tone="amber">
              <p className="empty">// no profiles saved. create your first.</p>
            </TerminalWindow>
          ) : (
            profiles.map((profile) => (
              <TerminalWindow
                key={profile.id}
                title={profile.name}
                flag="--profile"
                className="profile-card"
              >
                <p className="kv">
                  <span className="key">name</span>
                  {profile.userName}
                </p>
                <p className="kv">
                  <span className="key">email</span>
                  {profile.userEmail}
                </p>
                {profile.sshKey ? (
                  <p className="kv">
                    <span className="key">ssh</span>
                    <span className="mono">{profile.sshKey}</span>
                  </p>
                ) : null}
                {profile.host ? (
                  <p className="kv">
                    <span className="key">host</span>
                    {profile.host}
                  </p>
                ) : null}

                <hr className="divider" />

                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setEditingProfile(profile);
                      setMode("edit");
                    }}
                  >
                    [ edit ]
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(profile.id)}
                  >
                    [ rm ]
                  </button>
                </div>
              </TerminalWindow>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
