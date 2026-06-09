import { useState } from "react";
import { importGlobalAsProfile, importGlobalConfig } from "../api/gitSwitch";
import { ErrorBanner } from "../components/ErrorBanner";
import { ProfileForm } from "../components/ProfileForm";
import { TerminalWindow } from "../components/TerminalWindow";
import type { GitProfile, ProfileFormValues } from "../types";
import { invokeErrorMessage } from "../utils/errors";

interface ProfilesProps {
  profiles: GitProfile[];
  onCreate: (values: ProfileFormValues) => Promise<void>;
  onUpdate: (profileId: string, values: ProfileFormValues) => Promise<void>;
  onDelete: (profileId: string) => Promise<void>;
  onImported: () => Promise<void>;
}

function profileBadge(profile: GitProfile) {
  const color = profile.color ?? "#33ff00";
  const icon = profile.icon ?? profile.name.slice(0, 2).toLowerCase();

  return (
    <span className="profile-badge" style={{ borderColor: color, color }}>
      {icon}
    </span>
  );
}

export function Profiles({
  profiles,
  onCreate,
  onUpdate,
  onDelete,
  onImported,
}: ProfilesProps) {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingProfile, setEditingProfile] = useState<GitProfile | null>(null);
  const [createSeed, setCreateSeed] = useState<ProfileFormValues | undefined>();
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleDelete(profileId: string) {
    setError("");
    try {
      await onDelete(profileId);
    } catch (deleteError) {
      setError(invokeErrorMessage(deleteError, "Could not delete profile."));
    }
  }

  async function handleImportQuick() {
    setImporting(true);
    setError("");

    try {
      const imported = await importGlobalConfig();
      if (!imported.userName || !imported.userEmail) {
        setError(
          "Global git user.name and user.email must be set before importing.",
        );
        return;
      }

      await importGlobalAsProfile({
        name: imported.suggestedName,
        host: imported.suggestedHost,
        sshKey: imported.suggestedSshKey,
        color: imported.suggestedColor,
        icon: imported.suggestedIcon,
      });
      await onImported();
    } catch (importError) {
      setError(invokeErrorMessage(importError, "Could not import profile."));
    } finally {
      setImporting(false);
    }
  }

  async function handleImportToForm() {
    setImporting(true);
    setError("");

    try {
      const imported = await importGlobalConfig();
      if (!imported.userName || !imported.userEmail) {
        setError(
          "Global git user.name and user.email must be set before importing.",
        );
        return;
      }

      setCreateSeed({
        name: imported.suggestedName,
        userName: imported.userName,
        userEmail: imported.userEmail,
        sshKey: imported.suggestedSshKey ?? "",
        gpgKey: "",
        host: imported.suggestedHost,
        color: imported.suggestedColor,
        icon: imported.suggestedIcon,
      });
      setMode("create");
      setEditingProfile(null);
    } catch (importError) {
      setError(invokeErrorMessage(importError, "Could not read global config."));
    } finally {
      setImporting(false);
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
              className="btn"
              disabled={importing}
              onClick={() => void handleImportToForm()}
            >
              {importing ? "...import" : "[ import config ]"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={importing}
              onClick={() => void handleImportQuick()}
            >
              {importing ? "...import" : "[ import quick ]"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCreateSeed(undefined);
                setMode("create");
                setEditingProfile(null);
              }}
            >
              [ + new profile ]
            </button>
          </div>
        ) : null}
      </header>

      {error ? <ErrorBanner message={error} /> : null}

      {mode === "create" ? (
        <TerminalWindow title="new profile" flag="--create">
          <ProfileForm
            seed={createSeed}
            submitLabel="[ create ]"
            onCancel={() => {
              setMode("list");
              setCreateSeed(undefined);
            }}
            onSubmit={async (values) => {
              await onCreate(values);
              setMode("list");
              setCreateSeed(undefined);
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
              <p className="empty">// no profiles saved. create or import one.</p>
            </TerminalWindow>
          ) : (
            profiles.map((profile) => (
              <TerminalWindow
                key={profile.id}
                title={profile.name}
                flag="--profile"
                className="profile-card"
              >
                <div className="profile-card-head">
                  {profileBadge(profile)}
                  <div>
                    <p className="kv">
                      <span className="key">name</span>
                      {profile.userName}
                    </p>
                    <p className="kv">
                      <span className="key">email</span>
                      {profile.userEmail}
                    </p>
                  </div>
                </div>
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
