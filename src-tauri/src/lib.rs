mod git;
mod import;
mod models;
mod presets;
mod ssh;
mod storage;
mod switch;
mod tray;

use std::path::PathBuf;

use import::{read_global_import, GlobalConfigImport};
use models::{ActiveIdentityState, AppData, AuthStatus, DetectedRepo, GitIdentity, GitProfile};
use presets::{host_presets, profile_presets, HostPreset, ProfilePresets};
use storage::{find_profile, load_app_data, profile_matches_identity, save_app_data};
use tauri::{Manager, Runtime, WindowEvent};
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
fn detect_git_repo(
    app: tauri::AppHandle,
    start_path: Option<String>,
) -> Result<DetectedRepo, String> {
    let data = load_app_data(&app)?;
    let start = match start_path {
        Some(path) => PathBuf::from(path),
        None => std::env::current_dir().map_err(|error| format!("Could not read cwd: {error}"))?,
    };

    let searched_from = start
        .to_str()
        .map(|value| value.to_string())
        .unwrap_or_else(|| start.display().to_string());

    let repo_root = git::find_repo_root(&data.settings.git_executable, &start)?;

    let Some(repo_path) = repo_root else {
        return Ok(DetectedRepo {
            repo_path: None,
            identity: None,
            searched_from,
        });
    };

    let repo_path = repo_path
        .to_str()
        .map(|value| value.to_string())
        .ok_or_else(|| "Repository path is not valid UTF-8".to_string())?;

    let identity =
        git::read_repo_identity(&data.settings.git_executable, &repo_path).ok();

    Ok(DetectedRepo {
        repo_path: Some(repo_path),
        identity,
        searched_from,
    })
}

#[tauri::command]
fn list_profiles(app: tauri::AppHandle) -> Result<AppData, String> {
    load_app_data(&app)
}

#[tauri::command]
fn get_host_presets() -> Vec<HostPreset> {
    host_presets()
}

#[tauri::command]
fn get_profile_presets() -> ProfilePresets {
    profile_presets()
}

#[tauri::command]
fn import_global_config(app: tauri::AppHandle) -> Result<GlobalConfigImport, String> {
    read_global_import(&app)
}

#[tauri::command]
fn import_global_as_profile(
    app: tauri::AppHandle,
    name: String,
    host: Option<String>,
    ssh_key: Option<String>,
    color: Option<String>,
    icon: Option<String>,
) -> Result<GitProfile, String> {
    import::import_global_as_profile(&app, name, host, ssh_key, color, icon)
}

#[tauri::command]
fn get_auth_status(app: tauri::AppHandle) -> Result<AuthStatus, String> {
    let data = load_app_data(&app)?;

    let active_profile = data
        .active_profile_id
        .as_deref()
        .and_then(|id| find_profile(&data, id))
        .cloned();

    let (active_ssh_key, active_host) = active_profile
        .as_ref()
        .map(|profile| {
            (
                ssh::resolve_ssh_key_path(profile),
                profile
                    .host
                    .as_deref()
                    .map(ssh::normalize_host)
                    .or(Some("github.com".to_string())),
            )
        })
        .unwrap_or((None, None));

    Ok(AuthStatus {
        ssh_switching_enabled: data.settings.ssh_switching_enabled,
        ssh_config_applied: ssh::managed_config_applied(),
        active_ssh_key,
        active_host,
    })
}

#[tauri::command]
fn detect_ssh_key_path(profile_name: String) -> Result<Option<String>, String> {
    let path = ssh::default_key_path_for_profile(&profile_name);
    if path.exists() {
        Ok(path.to_str().map(|value| value.to_string()))
    } else {
        Ok(None)
    }
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
    color: Option<String>,
    icon: Option<String>,
) -> Result<GitProfile, String> {
    let mut data = load_app_data(&app)?;
    let profile_index = data.profiles.len();

    let profile = GitProfile {
        id: Uuid::new_v4().to_string(),
        name: name.trim().to_string(),
        user_name: user_name.trim().to_string(),
        user_email: user_email.trim().to_string(),
        ssh_key,
        gpg_key,
        host: host.map(|value| ssh::normalize_host(&value)),
        color: color.or(Some(presets::default_color_for_index(profile_index))),
        icon: icon.or(Some(presets::default_icon_for_name(name.trim()))),
    };

    if profile.name.is_empty() || profile.user_name.is_empty() || profile.user_email.is_empty() {
        return Err("Profile name, username, and email are required.".to_string());
    }

    data.profiles.push(profile.clone());
    save_app_data(&app, &data)?;
    tray::refresh_tray_menu(&app)?;
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
    color: Option<String>,
    icon: Option<String>,
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
    profile.host = host.map(|value| ssh::normalize_host(&value));
    profile.color = color;
    profile.icon = icon;

    if profile.name.is_empty() || profile.user_name.is_empty() || profile.user_email.is_empty() {
        return Err("Profile name, username, and email are required.".to_string());
    }

    let updated = profile.clone();
    save_app_data(&app, &data)?;

    if data.active_profile_id.as_deref() == Some(profile_id.as_str()) {
        switch::sync_active_profile_auth(&app)?;
    }

    tray::refresh_tray_menu(&app)?;
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

    save_app_data(&app, &data)?;
    tray::refresh_tray_menu(&app)
}

#[tauri::command]
fn switch_global_profile(app: tauri::AppHandle, profile_id: String) -> Result<GitIdentity, String> {
    switch::perform_global_switch(&app, &profile_id)
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
    switch::sync_active_profile_auth(&app)?;
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

fn attach_close_to_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    let app_handle = app.clone();

    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.hide();
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            tray::setup_tray(app)?;
            attach_close_to_tray(app.handle())?;
            if let Err(error) = switch::sync_active_profile_auth(app.handle()) {
                eprintln!("auth sync on startup failed: {error}");
            }
            tray::apply_start_minimized(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_active_identity,
            get_repo_identity,
            detect_git_repo,
            detect_ssh_key_path,
            get_auth_status,
            get_host_presets,
            get_profile_presets,
            import_global_config,
            import_global_as_profile,
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
