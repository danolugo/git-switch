use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostPreset {
    pub id: String,
    pub label: String,
    pub host: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfilePresets {
    pub colors: Vec<String>,
    pub icons: Vec<String>,
}

pub fn host_presets() -> Vec<HostPreset> {
    vec![
        HostPreset {
            id: "github".to_string(),
            label: "GitHub".to_string(),
            host: "github.com".to_string(),
        },
        HostPreset {
            id: "gitlab".to_string(),
            label: "GitLab".to_string(),
            host: "gitlab.com".to_string(),
        },
        HostPreset {
            id: "bitbucket".to_string(),
            label: "Bitbucket".to_string(),
            host: "bitbucket.org".to_string(),
        },
        HostPreset {
            id: "azure".to_string(),
            label: "Azure DevOps".to_string(),
            host: "ssh.dev.azure.com".to_string(),
        },
    ]
}

pub fn profile_presets() -> ProfilePresets {
    ProfilePresets {
        colors: vec![
            "#33ff00".to_string(),
            "#ffb000".to_string(),
            "#00d4ff".to_string(),
            "#ff6b6b".to_string(),
            "#b388ff".to_string(),
            "#ff79c6".to_string(),
        ],
        icons: vec![
            "gh".to_string(),
            "gl".to_string(),
            "w".to_string(),
            "p".to_string(),
            "bb".to_string(),
            "go".to_string(),
        ],
    }
}

pub fn default_color_for_index(index: usize) -> String {
    let presets = profile_presets();
    presets.colors[index % presets.colors.len()].clone()
}

pub fn default_icon_for_name(name: &str) -> String {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return "id".to_string();
    }

    trimmed
        .chars()
        .take(2)
        .collect::<String>()
        .to_lowercase()
}
