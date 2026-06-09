import { invoke } from "@tauri-apps/api/core";
import type {
  ActiveIdentityState,
  AppData,
  AppSettings,
  AuthStatus,
  DetectedRepo,
  GitIdentity,
  GitProfile,
  GlobalConfigImport,
  HostPreset,
  ProfilePresets,
} from "../types";

export function getActiveIdentity(): Promise<ActiveIdentityState> {
  return invoke<ActiveIdentityState>("get_active_identity");
}

export function getRepoIdentity(repoPath: string): Promise<GitIdentity> {
  return invoke<GitIdentity>("get_repo_identity", { repoPath });
}

export function detectGitRepo(startPath?: string): Promise<DetectedRepo> {
  return invoke<DetectedRepo>("detect_git_repo", { startPath });
}

export function detectSshKeyPath(
  profileName: string,
): Promise<string | null> {
  return invoke<string | null>("detect_ssh_key_path", { profileName });
}

export function getAuthStatus(): Promise<AuthStatus> {
  return invoke<AuthStatus>("get_auth_status");
}

export function getHostPresets(): Promise<HostPreset[]> {
  return invoke<HostPreset[]>("get_host_presets");
}

export function getProfilePresets(): Promise<ProfilePresets> {
  return invoke<ProfilePresets>("get_profile_presets");
}

export function importGlobalConfig(): Promise<GlobalConfigImport> {
  return invoke<GlobalConfigImport>("import_global_config");
}

export function importGlobalAsProfile(input: {
  name: string;
  host?: string;
  sshKey?: string;
  color?: string;
  icon?: string;
}): Promise<GitProfile> {
  return invoke<GitProfile>("import_global_as_profile", input);
}

export function listProfiles(): Promise<AppData> {
  return invoke<AppData>("list_profiles");
}

export function createProfile(input: {
  name: string;
  userName: string;
  userEmail: string;
  sshKey?: string;
  gpgKey?: string;
  host?: string;
  color?: string;
  icon?: string;
}): Promise<GitProfile> {
  return invoke<GitProfile>("create_profile", input);
}

export function updateProfile(input: {
  profileId: string;
  name: string;
  userName: string;
  userEmail: string;
  sshKey?: string;
  gpgKey?: string;
  host?: string;
  color?: string;
  icon?: string;
}): Promise<GitProfile> {
  return invoke<GitProfile>("update_profile", input);
}

export function deleteProfile(profileId: string): Promise<void> {
  return invoke<void>("delete_profile", { profileId });
}

export function switchGlobalProfile(profileId: string): Promise<GitIdentity> {
  return invoke<GitIdentity>("switch_global_profile", { profileId });
}

export function switchRepoProfile(
  repoPath: string,
  profileId: string,
): Promise<GitIdentity> {
  return invoke<GitIdentity>("switch_repo_profile", { repoPath, profileId });
}

export function updateSettings(input: {
  gitExecutable: string;
  sshSwitchingEnabled: boolean;
  startMinimized: boolean;
}): Promise<AppSettings> {
  return invoke<AppSettings>("update_settings", input);
}
