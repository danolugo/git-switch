import { invoke } from "@tauri-apps/api/core";
import type {
  ActiveIdentityState,
  AppData,
  AppSettings,
  GitIdentity,
  GitProfile,
} from "../types";

export function getActiveIdentity(): Promise<ActiveIdentityState> {
  return invoke<ActiveIdentityState>("get_active_identity");
}

export function getRepoIdentity(repoPath: string): Promise<GitIdentity> {
  return invoke<GitIdentity>("get_repo_identity", { repoPath });
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
