import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  createProfile,
  deleteProfile,
  getActiveIdentity,
  getAuthStatus,
  listProfiles,
  switchGlobalProfile,
  switchRepoProfile,
  updateProfile,
  updateSettings,
} from "./api/gitSwitch";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Profiles } from "./pages/Profiles";
import { Repository } from "./pages/Repository";
import { Settings } from "./pages/Settings";
import type {
  ActiveIdentityState,
  AppSettings,
  AuthStatus,
  GitProfile,
  ProfileFormValues,
  ViewName,
} from "./types";
import { invokeErrorMessage } from "./utils/errors";
import "./App.css";

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isViewName(value: string): value is ViewName {
  return (
    value === "dashboard" ||
    value === "profiles" ||
    value === "repository" ||
    value === "settings"
  );
}

function App() {
  const [view, setView] = useState<ViewName>("dashboard");
  const [profiles, setProfiles] = useState<GitProfile[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    gitExecutable: "git",
    sshSwitchingEnabled: true,
    startMinimized: false,
  });
  const [identity, setIdentity] = useState<ActiveIdentityState | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [appData, activeIdentity, auth] = await Promise.all([
        listProfiles(),
        getActiveIdentity(),
        getAuthStatus(),
      ]);

      setProfiles(appData.profiles);
      setSettings(appData.settings);
      setIdentity(activeIdentity);
      setAuthStatus(auth);
    } catch (refreshError) {
      setError(invokeErrorMessage(refreshError, "Could not load Git identity."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const unlisteners: Array<Promise<() => void>> = [];

    unlisteners.push(
      listen<string>("navigate", (event) => {
        if (isViewName(event.payload)) {
          setView(event.payload);
        }
      }),
    );

    unlisteners.push(
      listen("identity-changed", () => {
        void refresh();
      }),
    );

    return () => {
      void Promise.all(unlisteners).then((stops) => {
        stops.forEach((stop) => stop());
      });
    };
  }, [refresh]);

  async function handleSwitch(profileId: string) {
    setSwitchingId(profileId);
    setError("");

    try {
      await switchGlobalProfile(profileId);
      await refresh();
    } catch (switchError) {
      setError(invokeErrorMessage(switchError, "Could not switch profile."));
    } finally {
      setSwitchingId(null);
    }
  }

  async function handleCreate(values: ProfileFormValues) {
    await createProfile({
      name: values.name,
      userName: values.userName,
      userEmail: values.userEmail,
      sshKey: optionalField(values.sshKey),
      gpgKey: optionalField(values.gpgKey),
      host: optionalField(values.host),
      color: optionalField(values.color),
      icon: optionalField(values.icon),
    });
    await refresh();
  }

  async function handleUpdate(profileId: string, values: ProfileFormValues) {
    await updateProfile({
      profileId,
      name: values.name,
      userName: values.userName,
      userEmail: values.userEmail,
      sshKey: optionalField(values.sshKey),
      gpgKey: optionalField(values.gpgKey),
      host: optionalField(values.host),
      color: optionalField(values.color),
      icon: optionalField(values.icon),
    });
    await refresh();
  }

  async function handleDelete(profileId: string) {
    await deleteProfile(profileId);
    await refresh();
  }

  async function handleSaveSettings(nextSettings: AppSettings) {
    const saved = await updateSettings(nextSettings);
    setSettings(saved);
    await refresh();
  }

  return (
    <Layout currentView={view} onNavigate={setView}>
      {view === "dashboard" ? (
        <Dashboard
          identity={identity}
          authStatus={authStatus}
          profiles={profiles}
          loading={loading}
          switchingId={switchingId}
          error={error}
          onRefresh={() => void refresh()}
          onSwitch={(profileId) => void handleSwitch(profileId)}
        />
      ) : null}

      {view === "profiles" ? (
        <Profiles
          profiles={profiles}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onImported={refresh}
        />
      ) : null}

      {view === "repository" ? (
        <Repository
          profiles={profiles}
          onApply={(repoPath, profileId) =>
            switchRepoProfile(repoPath, profileId)
          }
        />
      ) : null}

      {view === "settings" ? (
        <Settings settings={settings} onSave={handleSaveSettings} />
      ) : null}
    </Layout>
  );
}

export default App;
