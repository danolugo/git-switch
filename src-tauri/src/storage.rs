use std::fs;
use std::path::PathBuf;

use tauri::Manager;

use crate::models::{AppData, AppSettings, GitProfile};

pub fn data_file_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| format!("Could not resolve app data directory: {error}"))?;

    fs::create_dir_all(&dir)
        .map_err(|error| format!("Could not create app data directory: {error}"))?;

    Ok(dir.join("profiles.json"))
}

pub fn load_app_data(app_handle: &tauri::AppHandle) -> Result<AppData, String> {
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

    serde_json::from_str(&contents)
        .map_err(|error| format!("Could not parse profiles file: {error}"))
}

pub fn save_app_data(app_handle: &tauri::AppHandle, data: &AppData) -> Result<(), String> {
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
