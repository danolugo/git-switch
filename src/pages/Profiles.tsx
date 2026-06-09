import { useState } from "react";
import { ProfileForm } from "../components/ProfileForm";
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
      <header className="page-header">
        <div>
          <h1>Profiles</h1>
          <p>Create and manage saved Git identities.</p>
        </div>
        {mode === "list" ? (
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setEditingProfile(null);
            }}
          >
            Add profile
          </button>
        ) : null}
      </header>

      {error ? <p className="error-banner">{error}</p> : null}

      {mode === "create" ? (
        <article className="card">
          <h2>New profile</h2>
          <ProfileForm
            submitLabel="Create profile"
            onCancel={() => setMode("list")}
            onSubmit={async (values) => {
              await onCreate(values);
              setMode("list");
            }}
          />
        </article>
      ) : null}

      {mode === "edit" && editingProfile ? (
        <article className="card">
          <h2>Edit profile</h2>
          <ProfileForm
            initial={editingProfile}
            submitLabel="Save changes"
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
        </article>
      ) : null}

      {mode === "list" ? (
        <div className="profile-grid">
          {profiles.length === 0 ? (
            <article className="card empty-card">
              <p>No profiles yet. Add your first Git identity.</p>
            </article>
          ) : (
            profiles.map((profile) => (
              <article key={profile.id} className="card profile-card">
                <div className="profile-card-header">
                  <h2>{profile.name}</h2>
                  <div className="profile-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setEditingProfile(profile);
                        setMode("edit");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(profile.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p>{profile.userName}</p>
                <p className="muted">{profile.userEmail}</p>
                {profile.sshKey ? (
                  <p className="mono muted">{profile.sshKey}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
