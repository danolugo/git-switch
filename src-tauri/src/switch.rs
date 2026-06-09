use tauri::{AppHandle, Emitter, Runtime};

use crate::git;
use crate::models::GitIdentity;
use crate::ssh;
use crate::storage::{find_profile, load_app_data, save_app_data};
use crate::tray;

pub fn perform_global_switch<R: Runtime>(
    app: &AppHandle<R>,
    profile_id: &str,
) -> Result<GitIdentity, String> {
    let mut data = load_app_data(app)?;
    let profile = find_profile(&data, profile_id)
        .ok_or_else(|| format!("Profile not found: {profile_id}"))?
        .clone();

    git::set_global_identity(
        &data.settings.git_executable,
        &profile.user_name,
        &profile.user_email,
    )?;

    ssh::apply_profile_auth(
        &data.settings.git_executable,
        &profile,
        data.settings.ssh_switching_enabled,
    )?;

    data.active_profile_id = Some(profile_id.to_string());
    save_app_data(app, &data)?;

    let identity = git::read_global_identity(&data.settings.git_executable)?;

    tray::refresh_tray_menu(app)?;
    app.emit("identity-changed", ())
        .map_err(|error| error.to_string())?;

    Ok(identity)
}

pub fn sync_active_profile_auth<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let data = load_app_data(app)?;

    let Some(active_id) = data.active_profile_id.as_deref() else {
        return ssh::clear_profile_auth(&data.settings.git_executable);
    };

    let profile = find_profile(&data, active_id)
        .ok_or_else(|| format!("Profile not found: {active_id}"))?
        .clone();

    ssh::apply_profile_auth(
        &data.settings.git_executable,
        &profile,
        data.settings.ssh_switching_enabled,
    )
}
