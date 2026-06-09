export interface GitProfile {
  id: string;
  name: string;
  userName: string;
  userEmail: string;
  sshKey?: string;
  gpgKey?: string;
  host?: string;
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
}
