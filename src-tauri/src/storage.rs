use std::fs;
use std::path::PathBuf;

use tauri::{Manager, Runtime};

use crate::models::{AppData, AppSettings, GitProfile};
use crate::ssh;

pub fn data_file_path<R: Runtime>(app_handle: &tauri::AppHandle<R>) -> Result<PathBuf, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| format!("Could not resolve app data directory: {error}"))?;

    fs::create_dir_all(&dir)
        .map_err(|error| format!("Could not create app data directory: {error}"))?;

    Ok(dir.join("profiles.json"))
}

pub fn load_app_data<R: Runtime>(app_handle: &tauri::AppHandle<R>) -> Result<AppData, String> {
    let path = data_file_path(app_handle)?;

    if !path.exists() {
        return Ok(AppData {
            profiles: Vec::new(),
            active_profile_id: None,
            settings: AppSettings::defaults(),
        });
    }

    let contents = fs::read_to_string(&path)
        .map_err(|error| format!("Could not read profiles file: {error}"))?;

    let mut data: AppData = serde_json::from_str(&contents)
        .map_err(|error| format!("Could not parse profiles file: {error}"))?;

    if migrate_app_data(&mut data) {
        save_app_data(app_handle, &data)?;
    }

    Ok(data)
}

fn migrate_app_data(data: &mut AppData) -> bool {
    let mut changed = false;

    for profile in &mut data.profiles {
        let normalized_host = profile
            .host
            .as_deref()
            .map(ssh::normalize_host)
            .unwrap_or_else(|| "github.com".to_string());

        if profile.host.as_deref() != Some(normalized_host.as_str()) {
            profile.host = Some(normalized_host);
            changed = true;
        }

        let has_explicit_key = profile
            .ssh_key
            .as_ref()
            .map(|value| !value.trim().is_empty())
            .unwrap_or(false);

        if !has_explicit_key {
            if let Some(detected) = ssh::resolve_ssh_key_path(profile) {
                profile.ssh_key = Some(detected);
                changed = true;
            }
        }
    }

    if !data.settings.ssh_switching_enabled {
        let has_keys = data
            .profiles
            .iter()
            .any(|profile| ssh::resolve_ssh_key_path(profile).is_some());

        if has_keys {
            data.settings.ssh_switching_enabled = true;
            changed = true;
        }
    }

    changed
}

pub fn save_app_data<R: Runtime>(
    app_handle: &tauri::AppHandle<R>,
    data: &AppData,
) -> Result<(), String> {
    let path = data_file_path(app_handle)?;
    let contents = serde_json::to_string_pretty(data)
        .map_err(|error| format!("Could not serialize profiles: {error}"))?;

    fs::write(&path, contents).map_err(|error| format!("Could not write profiles file: {error}"))
}

pub fn find_profile<'a>(data: &'a AppData, profile_id: &str) -> Option<&'a GitProfile> {
    data.profiles.iter().find(|profile| profile.id == profile_id)
}

pub fn profile_matches_identity(profile: &GitProfile, user_name: &str, user_email: &str) -> bool {
    profile.user_name == user_name && profile.user_email == user_email
}
