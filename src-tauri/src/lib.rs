mod git;
mod models;
mod storage;

use models::{ActiveIdentityState, AppData, GitIdentity, GitProfile};
use storage::{find_profile, load_app_data, profile_matches_identity, save_app_data};
use uuid::Uuid;

#[tauri::command]
fn get_active_identity(app: tauri::AppHandle) -> Result<ActiveIdentityState, String> {
    let data = load_app_data(&app)?;
    let global = git::read_global_identity(&data.settings.git_executable)?;

    let active_profile = resolve_active_profile(&data, &global);

    Ok(ActiveIdentityState {
        global,
        active_profile,
        matched_by_config: true,
    })
}

#[tauri::command]
fn get_repo_identity(app: tauri::AppHandle, repo_path: String) -> Result<GitIdentity, String> {
    let data = load_app_data(&app)?;
    git::read_repo_identity(&data.settings.git_executable, &repo_path)
}

#[tauri::command]
fn list_profiles(app: tauri::AppHandle) -> Result<AppData, String> {
    load_app_data(&app)
}

#[tauri::command]
fn create_profile(
    app: tauri::AppHandle,
    name: String,
    user_name: String,
    user_email: String,
    ssh_key: Option<String>,
    gpg_key: Option<String>,
    host: Option<String>,
) -> Result<GitProfile, String> {
    let mut data = load_app_data(&app)?;

    let profile = GitProfile {
        id: Uuid::new_v4().to_string(),
        name: name.trim().to_string(),
        user_name: user_name.trim().to_string(),
        user_email: user_email.trim().to_string(),
        ssh_key,
        gpg_key,
        host,
    };

    if profile.name.is_empty() || profile.user_name.is_empty() || profile.user_email.is_empty() {
        return Err("Profile name, username, and email are required.".to_string());
    }

    data.profiles.push(profile.clone());
    save_app_data(&app, &data)?;
    Ok(profile)
}

#[tauri::command]
fn update_profile(
    app: tauri::AppHandle,
    profile_id: String,
    name: String,
    user_name: String,
    user_email: String,
    ssh_key: Option<String>,
    gpg_key: Option<String>,
    host: Option<String>,
) -> Result<GitProfile, String> {
    let mut data = load_app_data(&app)?;

    let profile = data
        .profiles
        .iter_mut()
        .find(|profile| profile.id == profile_id)
        .ok_or_else(|| format!("Profile not found: {profile_id}"))?;

    profile.name = name.trim().to_string();
    profile.user_name = user_name.trim().to_string();
    profile.user_email = user_email.trim().to_string();
    profile.ssh_key = ssh_key;
    profile.gpg_key = gpg_key;
    profile.host = host;

    if profile.name.is_empty() || profile.user_name.is_empty() || profile.user_email.is_empty() {
        return Err("Profile name, username, and email are required.".to_string());
    }

    let updated = profile.clone();
    save_app_data(&app, &data)?;
    Ok(updated)
}

#[tauri::command]
fn delete_profile(app: tauri::AppHandle, profile_id: String) -> Result<(), String> {
    let mut data = load_app_data(&app)?;
    let original_len = data.profiles.len();
    data.profiles.retain(|profile| profile.id != profile_id);

    if data.profiles.len() == original_len {
        return Err(format!("Profile not found: {profile_id}"));
    }

    if data.active_profile_id.as_deref() == Some(profile_id.as_str()) {
        data.active_profile_id = None;
    }

    save_app_data(&app, &data)
}

#[tauri::command]
fn switch_global_profile(app: tauri::AppHandle, profile_id: String) -> Result<GitIdentity, String> {
    let mut data = load_app_data(&app)?;
    let profile = find_profile(&data, &profile_id)
        .ok_or_else(|| format!("Profile not found: {profile_id}"))?
        .clone();

    git::set_global_identity(
        &data.settings.git_executable,
        &profile.user_name,
        &profile.user_email,
    )?;

    data.active_profile_id = Some(profile_id);
    save_app_data(&app, &data)?;

    git::read_global_identity(&data.settings.git_executable)
}

#[tauri::command]
fn switch_repo_profile(
    app: tauri::AppHandle,
    repo_path: String,
    profile_id: String,
) -> Result<GitIdentity, String> {
    let data = load_app_data(&app)?;
    let profile = find_profile(&data, &profile_id)
        .ok_or_else(|| format!("Profile not found: {profile_id}"))?
        .clone();

    git::set_repo_identity(
        &data.settings.git_executable,
        &repo_path,
        &profile.user_name,
        &profile.user_email,
    )?;

    git::read_repo_identity(&data.settings.git_executable, &repo_path)
}

#[tauri::command]
fn update_settings(
    app: tauri::AppHandle,
    git_executable: String,
    ssh_switching_enabled: bool,
    start_minimized: bool,
) -> Result<models::AppSettings, String> {
    let mut data = load_app_data(&app)?;

    let executable = git_executable.trim();
    if executable.is_empty() {
        return Err("Git executable path cannot be empty.".to_string());
    }

    data.settings.git_executable = executable.to_string();
    data.settings.ssh_switching_enabled = ssh_switching_enabled;
    data.settings.start_minimized = start_minimized;

    save_app_data(&app, &data)?;
    Ok(data.settings)
}

fn resolve_active_profile(data: &AppData, global: &GitIdentity) -> Option<GitProfile> {
    let user_name = global.user_name.as_deref()?;
    let user_email = global.user_email.as_deref()?;

    if let Some(active_id) = data.active_profile_id.as_deref() {
        if let Some(profile) = find_profile(data, active_id) {
            if profile_matches_identity(profile, user_name, user_email) {
                return Some(profile.clone());
            }
        }
    }

    data.profiles
        .iter()
        .find(|profile| profile_matches_identity(profile, user_name, user_email))
        .cloned()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_active_identity,
            get_repo_identity,
            list_profiles,
            create_profile,
            update_profile,
            delete_profile,
            switch_global_profile,
            switch_repo_profile,
            update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
