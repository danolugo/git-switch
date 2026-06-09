use std::path::{Path, PathBuf};
use std::process::Command;

use crate::models::GitIdentity;

pub fn read_global_identity(git_executable: &str) -> Result<GitIdentity, String> {
    let user_name = read_config_value(git_executable, None, "user.name")?;
    let user_email = read_config_value(git_executable, None, "user.email")?;

    Ok(GitIdentity {
        user_name,
        user_email,
    })
}

pub fn read_repo_identity(git_executable: &str, repo_path: &str) -> Result<GitIdentity, String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err(format!("Repository path does not exist: {repo_path}"));
    }

    let user_name = read_config_value(git_executable, Some(repo_path), "user.name")?;
    let user_email = read_config_value(git_executable, Some(repo_path), "user.email")?;

    Ok(GitIdentity {
        user_name,
        user_email,
    })
}

pub fn find_repo_root(git_executable: &str, start: &Path) -> Result<Option<PathBuf>, String> {
    if !start.exists() {
        return Err(format!("Path does not exist: {}", start.display()));
    }

    let output = Command::new(git_executable)
        .args(["rev-parse", "--show-toplevel"])
        .current_dir(start)
        .output()
        .map_err(|error| format!("Failed to run git: {error}"))?;

    if output.status.success() {
        let root = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if root.is_empty() {
            Ok(None)
        } else {
            Ok(Some(PathBuf::from(root)))
        }
    } else if output.status.code() == Some(128) || output.status.code() == Some(1) {
        Ok(None)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("git rev-parse failed: {stderr}"))
    }
}

pub fn set_global_identity(
    git_executable: &str,
    user_name: &str,
    user_email: &str,
) -> Result<(), String> {
    set_config_value(git_executable, None, "user.name", user_name)?;
    set_config_value(git_executable, None, "user.email", user_email)?;
    Ok(())
}

pub fn set_repo_identity(
    git_executable: &str,
    repo_path: &str,
    user_name: &str,
    user_email: &str,
) -> Result<(), String> {
    set_config_value(git_executable, Some(repo_path), "user.name", user_name)?;
    set_config_value(git_executable, Some(repo_path), "user.email", user_email)?;
    Ok(())
}

fn read_config_value(
    git_executable: &str,
    repo_path: Option<&str>,
    key: &str,
) -> Result<Option<String>, String> {
    let mut command = Command::new(git_executable);
    command.arg("config");

    if let Some(path) = repo_path {
        command.args(["--local", "--get", key]).current_dir(path);
    } else {
        command.args(["--global", "--get", key]);
    }

    let output = command
        .output()
        .map_err(|error| format!("Failed to run git: {error}"))?;

    if output.status.success() {
        let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if value.is_empty() {
            Ok(None)
        } else {
            Ok(Some(value))
        }
    } else if output.status.code() == Some(1) {
        Ok(None)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("git config --get {key} failed: {stderr}"))
    }
}

pub fn set_global_config(git_executable: &str, key: &str, value: &str) -> Result<(), String> {
    set_config_value(git_executable, None, key, value)
}

pub fn unset_global_config(git_executable: &str, key: &str) -> Result<(), String> {
    let output = Command::new(git_executable)
        .args(["config", "--global", "--unset-all", key])
        .output()
        .map_err(|error| format!("Failed to run git: {error}"))?;

    if output.status.success() || output.status.code() == Some(5) {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("git config --unset-all {key} failed: {stderr}"))
    }
}

fn set_config_value(
    git_executable: &str,
    repo_path: Option<&str>,
    key: &str,
    value: &str,
) -> Result<(), String> {
    let mut command = Command::new(git_executable);
    command.arg("config");

    if let Some(path) = repo_path {
        command
            .args(["--local", key, value])
            .current_dir(path);
    } else {
        command.args(["--global", key, value]);
    }

    let output = command
        .output()
        .map_err(|error| format!("Failed to run git: {error}"))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("git config {key} failed: {stderr}"))
    }
}
