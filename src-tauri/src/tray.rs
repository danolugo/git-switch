use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuBuilder, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, Runtime,
};

use crate::storage::load_app_data;

pub const TRAY_ID: &str = "main-tray";

struct TrayMenuResources<R: Runtime> {
    _items: Vec<MenuItem<R>>,
    menu: Menu<R>,
}

pub struct TrayMenuState<R: Runtime>(Mutex<TrayMenuResources<R>>);

pub fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> Result<(), String> {
    let handle = app.handle();
    let resources = build_tray_menu(handle)?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(
            app.default_window_icon()
                .ok_or("Missing default window icon")?
                .clone(),
        )
        .tooltip("git-switch")
        .menu(&resources.menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| handle_tray_menu_event(app, event.id.as_ref()))
        .build(app)
        .map_err(|error| error.to_string())?;

    app.manage(TrayMenuState(Mutex::new(resources)));
    Ok(())
}

pub fn refresh_tray_menu<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let new_resources = build_tray_menu(app)?;
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or("System tray not initialized")?;

    tray.set_menu(Some(new_resources.menu.clone()))
        .map_err(|error| error.to_string())?;

    let state = app.state::<TrayMenuState<R>>();
    let mut guard = state.0.lock().map_err(|_| "Tray lock poisoned")?;
    *guard = new_resources;

    Ok(())
}

pub fn show_main_window<R: Runtime>(app: &AppHandle<R>, view: Option<&str>) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;

    if let Some(target) = view {
        app.emit("navigate", target)
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn apply_start_minimized<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let data = load_app_data(app)?;
    if !data.settings.start_minimized {
        return Ok(());
    }

    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    window.hide().map_err(|error| error.to_string())
}

fn build_tray_menu<R: Runtime>(app: &AppHandle<R>) -> Result<TrayMenuResources<R>, String> {
    let data = load_app_data(app)?;
    let active_id = data.active_profile_id.clone();

    let mut items: Vec<MenuItem<R>> = Vec::new();
    let mut builder = MenuBuilder::new(app);

    for profile in &data.profiles {
        let label = if active_id.as_deref() == Some(profile.id.as_str()) {
            format!("✓ {}", profile.name)
        } else {
            profile.name.clone()
        };

        let item = MenuItem::with_id(
            app,
            format!("profile:{}", profile.id),
            label,
            true,
            None::<&str>,
        )
        .map_err(|error| error.to_string())?;

        builder = builder.item(&item);
        items.push(item);
    }

    if !data.profiles.is_empty() {
        builder = builder.separator();
    }

    let open = MenuItem::with_id(app, "open", "Open app", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let repo = MenuItem::with_id(app, "repo", "Switch repo identity", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
        .map_err(|error| error.to_string())?;

    builder = builder
        .item(&open)
        .item(&repo)
        .item(&settings)
        .separator()
        .item(&quit);

    items.extend([open, repo, settings, quit]);

    let menu = builder.build().map_err(|error| error.to_string())?;

    Ok(TrayMenuResources {
        _items: items,
        menu,
    })
}

fn handle_tray_menu_event<R: Runtime>(app: &AppHandle<R>, menu_id: &str) {
    if let Some(profile_id) = menu_id.strip_prefix("profile:") {
        if let Err(error) = crate::switch::perform_global_switch(app, profile_id) {
            eprintln!("tray switch failed: {error}");
        }
        return;
    }

    let result = match menu_id {
        "open" => show_main_window(app, None),
        "repo" => show_main_window(app, Some("repository")),
        "settings" => show_main_window(app, Some("settings")),
        "quit" => {
            app.exit(0);
            Ok(())
        }
        _ => Ok(()),
    };

    if let Err(error) = result {
        eprintln!("tray action failed: {error}");
    }
}
