# git-switch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a lightweight Windows desktop app that lets users save Git identity profiles, see the active identity, and switch global or repo-specific config with one click.

**Architecture:** Tauri 2 + React frontend for UI; Rust backend invokes `git config` and persists profiles in `%APPDATA%/com.gitswitch.app/profiles.json`. View-based navigation (no router dependency). Tray, SSH, and host presets ship in later versions.

**Tech Stack:** Tauri 2, React 19, TypeScript, Rust, Git CLI

---

## Version Roadmap

### v0.1 (MVP) — current scaffold

- [x] Tauri + React project setup
- [x] Local JSON storage for profiles and settings
- [x] Read global Git identity
- [x] CRUD for profiles
- [x] One-click global switching
- [x] Active profile detection by stored ID + config match
- [x] Dashboard, Profiles, Repository, Settings screens
- [ ] Windows installer polish
- [ ] Manual verification on machine with Rust + Git installed

### v0.2

- [x] System tray icon and menu
- [x] Quick switch from tray
- [x] Repo auto-detection from current directory
- [x] Startup minimized option
- [x] Better error surfaces and retry flows

### v0.3

- [x] SSH config generation/switching
- [x] GitHub/GitLab host presets
- [x] Import from existing global Git config
- [x] Profile colors/icons

---

## Milestone Breakdown

### Milestone 1: Project setup

**Status:** Done

- Tauri + React + TypeScript scaffold
- App branding (`git-switch`)
- Sidebar navigation across four views
- `profiles.json` storage in app data directory

### Milestone 2: Git integration

**Status:** Done

Rust commands:

| Command | Purpose |
|---------|---------|
| `get_active_identity` | Read global `user.name` / `user.email`, resolve active profile |
| `get_repo_identity` | Read local repo config |
| `switch_global_profile` | `git config --global user.name/email` |
| `switch_repo_profile` | `git config --local user.name/email` |

### Milestone 3: Profile management

**Status:** Done

- Create, edit, delete profiles
- Optional `sshKey`, `gpgKey`, `host` fields stored for v0.3

### Milestone 4: Switching logic

**Status:** Done

- Dashboard quick-switch buttons
- Persist `activeProfileId` after switch
- Fallback match when global config equals a saved profile

### Milestone 5: Windows polish

**Status:** Pending

- Tray plugin (`tauri-plugin-tray` or built-in tray APIs)
- App icon and NSIS/MSI bundle
- Start minimized
- Folder picker for repository mode (`@tauri-apps/plugin-dialog`)

---

## Data Model

```json
{
  "profiles": [
    {
      "id": "uuid",
      "name": "Work",
      "userName": "Your Name",
      "userEmail": "user@example.com",
      "sshKey": "C:\\path\\to\\private_key"
    }
  ],
  "activeProfileId": "uuid",
  "settings": {
    "gitExecutable": "git",
    "sshSwitchingEnabled": false,
    "startMinimized": false
  }
}
```

---

## Success Criteria (v0.1)

1. User can add two profiles (Work, Personal)
2. Dashboard shows current global Git identity
3. One click runs equivalent of:
   - `git config --global user.name "..."`
   - `git config --global user.email "..."`
4. Active profile label updates after switch
5. Profiles survive app restart

**Verification commands:**

```powershell
git config --global user.name
git config --global user.email
```

---

## Prerequisites (Windows)

1. [Rust toolchain](https://www.rust-lang.org/tools/install)
2. [Tauri prerequisites](https://tauri.app/start/prerequisites/)
3. Git for Windows in `PATH`

**Dev:**

```powershell
npm install
npm run tauri dev
```

**Build installer:**

```powershell
npm run tauri build
```

---

## Next Implementation Tasks

1. Install Rust on dev machine and run `npm run tauri dev`
2. Add `@tauri-apps/plugin-dialog` for repository folder picker
3. Implement tray menu (v0.2)
4. Add SSH config writer module guarded by `sshSwitchingEnabled`
5. Add smoke test script that creates profiles and asserts `git config` output
