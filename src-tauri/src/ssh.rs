use std::fs;
use std::path::{Path, PathBuf};

use crate::git;
use crate::models::GitProfile;

const BEGIN_MARKER: &str = "# BEGIN git-switch managed";
const END_MARKER: &str = "# END git-switch managed";
const MIN_KEY_FILE_BYTES: u64 = 100;

pub fn normalize_host(host: &str) -> String {
    match host.trim().to_lowercase().as_str() {
        "" | "github" => "github.com".to_string(),
        other => other.to_string(),
    }
}

pub fn ssh_home_dir() -> Result<PathBuf, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|_| "Could not resolve home directory for SSH config".to_string())?;

    Ok(PathBuf::from(home).join(".ssh"))
}

pub fn default_key_path_for_profile(name: &str) -> PathBuf {
    let sanitized: String = name
        .to_lowercase()
        .chars()
        .map(|character| {
            if character.is_alphanumeric() || character == '-' || character == '_' {
                character
            } else {
                '_'
            }
        })
        .collect();

    ssh_home_dir()
        .unwrap_or_else(|_| PathBuf::from(".ssh"))
        .join(format!("id_ed25519_{sanitized}"))
}

pub fn resolve_ssh_key_path(profile: &GitProfile) -> Option<String> {
    if let Some(explicit) = profile
        .ssh_key
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
    {
        return Some(explicit.to_string());
    }

    let default_path = default_key_path_for_profile(&profile.name);
    if default_path.exists() {
        return default_path.to_str().map(|value| value.to_string());
    }

    None
}

pub fn apply_profile_auth(
    git_executable: &str,
    profile: &GitProfile,
    ssh_enabled: bool,
) -> Result<(), String> {
    if !ssh_enabled {
        return clear_profile_auth(git_executable);
    }

    let Some(ssh_key) = resolve_ssh_key_path(profile) else {
        return Err(
            "No SSH private key configured for this profile. \
             Set the key file path in Profiles, or save the key as \
             ~/.ssh/id_ed25519_<profile-name> (e.g. id_ed25519_goat)."
                .to_string(),
        );
    };

    if !looks_like_key_path(&ssh_key) {
        return Err(
            "Profile SSH key must be a private key file path \
             (e.g. C:\\Users\\you\\.ssh\\id_ed25519_goat)."
                .to_string(),
        );
    }

    validate_ssh_key_path(&ssh_key)?;

    let host = profile
        .host
        .as_deref()
        .map(normalize_host)
        .unwrap_or_else(|| "github.com".to_string());

    write_managed_ssh_block(&host, &ssh_key)?;
    apply_git_url_rewrite(git_executable, &host)
}

pub fn managed_config_applied() -> bool {
    ssh_config_path()
        .ok()
        .and_then(|path| fs::read_to_string(path).ok())
        .map(|content| content.contains(BEGIN_MARKER))
        .unwrap_or(false)
}

pub fn clear_profile_auth(git_executable: &str) -> Result<(), String> {
    remove_managed_ssh_block()?;
    remove_git_url_rewrite(git_executable, "github.com")?;
    Ok(())
}

pub fn looks_like_key_path(path: &str) -> bool {
    path.contains(['\\', '/'])
        || path.starts_with('~')
        || path.starts_with('.')
        || (path.len() >= 2 && path.chars().nth(1) == Some(':'))
}

pub fn validate_ssh_key_path(path: &str) -> Result<(), String> {
    if !looks_like_key_path(path) {
        return Err(
            "SSH key must be a path to your private key file \
             (e.g. C:\\Users\\you\\.ssh\\id_ed25519_goat), not key text."
                .to_string(),
        );
    }

    let key_path = Path::new(path);
    if !key_path.exists() {
        return Err(format!("SSH key file not found: {path}"));
    }

    if !key_path.is_file() {
        return Err(format!("SSH key path is not a file: {path}"));
    }

    let size = fs::metadata(key_path)
        .map_err(|error| format!("Could not read SSH key file metadata: {error}"))?
        .len();

    if size < MIN_KEY_FILE_BYTES {
        return Err(format!(
            "SSH key file looks invalid (only {size} bytes). \
             A real ed25519 private key is about 400 bytes. \
             Regenerate it with: ssh-keygen -t ed25519 -f \"{path}\""
        ));
    }

    Ok(())
}

fn ssh_config_path() -> Result<PathBuf, String> {
    Ok(ssh_home_dir()?.join("config"))
}

fn write_managed_ssh_block(host: &str, identity_file: &str) -> Result<(), String> {
    let config_path = ssh_config_path()?;

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Could not create .ssh directory: {error}"))?;
    }

    let identity = normalize_path_for_openssh(identity_file);
    let block = format!(
        "{BEGIN_MARKER}\nHost {host}\n  HostName {host}\n  User git\n  IdentityFile {identity}\n  IdentitiesOnly yes\n{END_MARKER}\n"
    );

    let existing = if config_path.exists() {
        fs::read_to_string(&config_path)
            .map_err(|error| format!("Could not read SSH config: {error}"))?
    } else {
        String::new()
    };

    let updated = replace_managed_block(&existing, &block);
    fs::write(&config_path, updated)
        .map_err(|error| format!("Could not write SSH config: {error}"))?;

    Ok(())
}

fn remove_managed_ssh_block() -> Result<(), String> {
    let config_path = ssh_config_path()?;
    if !config_path.exists() {
        return Ok(());
    }

    let existing = fs::read_to_string(&config_path)
        .map_err(|error| format!("Could not read SSH config: {error}"))?;

    if !existing.contains(BEGIN_MARKER) {
        return Ok(());
    }

    let updated = remove_managed_block(&existing);
    fs::write(&config_path, updated)
        .map_err(|error| format!("Could not write SSH config: {error}"))?;

    Ok(())
}

fn apply_git_url_rewrite(git_executable: &str, host: &str) -> Result<(), String> {
    let host = normalize_host(host);
    let ssh_prefix = format!("git@{host}:");
    let https_prefix = format!("https://{host}/");
    let config_key = format!("url.{ssh_prefix}.insteadOf");

    git::set_global_config(git_executable, &config_key, &https_prefix)
}

fn remove_git_url_rewrite(git_executable: &str, host: &str) -> Result<(), String> {
    let host = normalize_host(host);
    let ssh_prefix = format!("git@{host}:");
    let config_key = format!("url.{ssh_prefix}.insteadOf");
    git::unset_global_config(git_executable, &config_key)
}

fn replace_managed_block(content: &str, new_block: &str) -> String {
    if let Some(start) = content.find(BEGIN_MARKER) {
        if let Some(relative_end) = content[start..].find(END_MARKER) {
            let end_index = start + relative_end + END_MARKER.len();
            let mut result = String::new();
            result.push_str(&content[..start]);
            result.push_str(new_block);
            if end_index < content.len() {
                result.push_str(&content[end_index..]);
            }
            return result.trim_end().to_string() + "\n";
        }
    }

    let mut result = content.trim_end().to_string();
    if !result.is_empty() {
        result.push('\n');
    }
    result.push_str(new_block);
    result
}

fn remove_managed_block(content: &str) -> String {
    if let Some(start) = content.find(BEGIN_MARKER) {
        if let Some(relative_end) = content[start..].find(END_MARKER) {
            let end_index = start + relative_end + END_MARKER.len();
            let mut result = String::new();
            result.push_str(&content[..start]);
            result.push_str(&content[end_index..]);
            return result.trim_end().to_string() + "\n";
        }
    }

    content.to_string()
}

fn normalize_path_for_openssh(path: &str) -> String {
    path.replace('\\', "/")
}
