# git-switch

A small Windows desktop app for switching between multiple Git identities — name, email, and SSH authentication. Built with **Tauri 2** and **React**.

## Features

### v0.3 (current)

- **SSH auth switching** — writes a managed block in `~/.ssh/config` and rewrites `https://github.com/` to SSH per profile
- **Auto-detect SSH keys** — looks for `~/.ssh/id_ed25519_<profile-name>` on startup and in the profile form
- **Host presets** — GitHub, GitLab, Bitbucket, Azure DevOps (plus custom host)
- **Import from global Git config** — create a profile from your current `git config --global user.*`
- **Profile colors and icons** — visual badges on dashboard and profile cards
- **Auth status on dashboard** — shows whether SSH config is applied for the active profile

### v0.2

- System tray with quick profile switching
- Close window hides to tray; optional start minimized
- Repository auto-detection from folder picker
- Error banners with retry

### v0.1

- Save Git profiles (name, username, email)
- Show current global Git identity
- Detect which saved profile matches the active config
- One-click global identity switching
- Apply a profile to a specific repository (local config)
- Persist profiles in a local JSON file

## Screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Current identity, SSH auth status, quick switch |
| Profiles | Add, edit, delete, import accounts |
| Repository | Apply identity to one repo |
| Settings | Git executable path, SSH switching, start minimized |

## SSH setup (recommended)

For each profile, save a private key as:

```
%USERPROFILE%\.ssh\id_ed25519_<profile-name>
```

Example for a profile named `goat`:

```powershell
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\id_ed25519_goat" -C "you@company.com"
```

Add the `.pub` file to the matching GitHub/GitLab account, then switch to that profile in git-switch.

Enable **SSH authentication switching** in Settings (on by default when keys are detected).

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

SSH config is managed in:

`%USERPROFILE%\.ssh\config` (between `# BEGIN git-switch managed` markers)

## Verify switching

After switching in the app:

```powershell
git config --global user.name
git config --global user.email
ssh -T git@github.com
```

## Roadmap

- **v0.4:** GPG signing key switching, per-repo profile memory, Windows installer polish

See [docs/plans/2026-06-09-git-switch-implementation.md](docs/plans/2026-06-09-git-switch-implementation.md) for the full plan.
