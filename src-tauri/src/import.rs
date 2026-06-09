use serde::{Deserialize, Serialize};

use crate::git;
use crate::models::GitProfile;
use crate::presets;
use crate::ssh;
use crate::storage::{load_app_data, save_app_data};
use tauri::{AppHandle, Runtime};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalConfigImport {
    pub user_name: Option<String>,
    pub user_email: Option<String>,
    pub suggested_name: String,
    pub suggested_host: String,
    pub suggested_ssh_key: Option<String>,
    pub suggested_color: String,
    pub suggested_icon: String,
}

pub fn read_global_import<R: Runtime>(app: &AppHandle<R>) -> Result<GlobalConfigImport, String> {
    let data = load_app_data(app)?;
    let global = git::read_global_identity(&data.settings.git_executable)?;

    let suggested_name = suggest_profile_name(&global.user_name, data.profiles.len());
    let suggested_ssh_key = ssh::resolve_ssh_key_path(&GitProfile {
        id: String::new(),
        name: suggested_name.clone(),
        user_name: global.user_name.clone().unwrap_or_default(),
        user_email: global.user_email.clone().unwrap_or_default(),
        ssh_key: None,
        gpg_key: None,
        host: Some("github.com".to_string()),
        color: None,
        icon: None,
    });

    let suggested_icon = presets::default_icon_for_name(&suggested_name);

    Ok(GlobalConfigImport {
        user_name: global.user_name,
        user_email: global.user_email,
        suggested_name,
        suggested_host: "github.com".to_string(),
        suggested_ssh_key,
        suggested_color: presets::default_color_for_index(data.profiles.len()),
        suggested_icon,
    })
}

pub fn import_global_as_profile<R: Runtime>(
    app: &AppHandle<R>,
    name: String,
    host: Option<String>,
    ssh_key: Option<String>,
    color: Option<String>,
    icon: Option<String>,
) -> Result<GitProfile, String> {
    let import = read_global_import(app)?;

    let user_name = import
        .user_name
        .ok_or_else(|| "Global git user.name is not set.".to_string())?;
    let user_email = import
        .user_email
        .ok_or_else(|| "Global git user.email is not set.".to_string())?;

    let profile_name = name.trim().to_string();
    if profile_name.is_empty() {
        return Err("Profile name is required.".to_string());
    }

    let mut data = load_app_data(app)?;
    let host = host
        .map(|value| ssh::normalize_host(&value))
        .unwrap_or_else(|| import.suggested_host);

    let profile = GitProfile {
        id: Uuid::new_v4().to_string(),
        name: profile_name.clone(),
        user_name,
        user_email,
        ssh_key: ssh_key.or(import.suggested_ssh_key),
        gpg_key: None,
        host: Some(host),
        color: color.or(Some(presets::default_color_for_index(data.profiles.len()))),
        icon: icon.or(Some(presets::default_icon_for_name(&profile_name))),
    };

    data.profiles.push(profile.clone());
    save_app_data(app, &data)?;
    crate::tray::refresh_tray_menu(app)?;

    Ok(profile)
}

fn suggest_profile_name(user_name: &Option<String>, existing_count: usize) -> String {
    if let Some(name) = user_name {
        let token = name
            .split_whitespace()
            .next()
            .unwrap_or("imported")
            .to_lowercase()
            .chars()
            .filter(|character| character.is_alphanumeric())
            .collect::<String>();

        if !token.is_empty() {
            return token;
        }
    }

    if existing_count == 0 {
        "personal".to_string()
    } else {
        format!("profile{}", existing_count + 1)
    }
}
