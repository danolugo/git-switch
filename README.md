# git-switch

A small Windows desktop app for switching between multiple Git identities. Built with **Tauri 2** and **React**.

## Features (v0.1)

- Save Git profiles (name, username, email, optional SSH/GPG/host)
- Show current global Git identity
- Detect which saved profile matches the active config
- One-click global identity switching
- Apply a profile to a specific repository (local config)
- Persist profiles in a local JSON file

## Screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Current identity + quick switch |
| Profiles | Add, edit, delete accounts |
| Repository | Apply identity to one repo |
| Settings | Git executable path and future options |

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/)
- Git for Windows available on `PATH` (or set a custom path in Settings)

## Development

```powershell
npm install
npm run tauri dev
```

## Build

```powershell
npm run tauri build
```

Installer output is written under `src-tauri/target/release/bundle/`.

## Data storage

Profiles are stored at:

`%APPDATA%\com.gitswitch.app\profiles.json`

## Verify switching

After switching in the app:

```powershell
git config --global user.name
git config --global user.email
```

## Roadmap

- **v0.2:** System tray, repo auto-detection, better errors
- **v0.3:** SSH key switching, host presets, import existing config

See [docs/plans/2026-06-09-git-switch-implementation.md](docs/plans/2026-06-09-git-switch-implementation.md) for the full plan.
