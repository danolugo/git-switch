export interface GitProfile {
  id: string;
  name: string;
  userName: string;
  userEmail: string;
  sshKey?: string;
  gpgKey?: string;
  host?: string;
  color?: string;
  icon?: string;
}

export interface HostPreset {
  id: string;
  label: string;
  host: string;
}

export interface ProfilePresets {
  colors: string[];
  icons: string[];
}

export interface GlobalConfigImport {
  userName?: string;
  userEmail?: string;
  suggestedName: string;
  suggestedHost: string;
  suggestedSshKey?: string;
  suggestedColor: string;
  suggestedIcon: string;
}

export interface AuthStatus {
  sshSwitchingEnabled: boolean;
  sshConfigApplied: boolean;
  activeSshKey?: string;
  activeHost?: string;
}

export interface AppSettings {
  gitExecutable: string;
  sshSwitchingEnabled: boolean;
  startMinimized: boolean;
}

export interface AppData {
  profiles: GitProfile[];
  activeProfileId?: string;
  settings: AppSettings;
}

export interface GitIdentity {
  userName?: string;
  userEmail?: string;
}

export interface ActiveIdentityState {
  global: GitIdentity;
  activeProfile?: GitProfile;
  matchedByConfig: boolean;
}

export interface DetectedRepo {
  repoPath?: string;
  identity?: GitIdentity;
  searchedFrom: string;
}

export type ViewName = "dashboard" | "profiles" | "repository" | "settings";

export interface ProfileFormValues {
  name: string;
  userName: string;
  userEmail: string;
  sshKey: string;
  gpgKey: string;
  host: string;
  color: string;
  icon: string;
}
