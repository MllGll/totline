mod db;

use db::{AppState, Database, WindowState};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, WindowEvent,
};

struct AppData {
    db: Mutex<Database>,
}

#[tauri::command]
fn load_app_state(state: State<'_, AppData>) -> Result<AppState, String> {
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .load_app_state()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_app_state(state: State<'_, AppData>, app_state: AppState) -> Result<(), String> {
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .save_app_state(&app_state)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn load_window_state(state: State<'_, AppData>) -> Result<WindowState, String> {
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .load_window_state()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_window_state(state: State<'_, AppData>, window_state: WindowState) -> Result<(), String> {
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .save_window_state(&window_state)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn show_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn set_always_on_top(app: AppHandle, value: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_always_on_top(value)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn quit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

fn apply_window_effects(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "windows")]
    {
        use tauri::window::{Effect, EffectsBuilder};
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effect(Effect::Acrylic)
                .build(),
        );
    }

    #[cfg(target_os = "macos")]
    {
        use tauri::window::{Effect, EffectState, EffectsBuilder};
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effect(Effect::HudWindow)
                .state(EffectState::Active)
                .build(),
        );
    }
}

fn restore_window(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    let db = app.state::<AppData>();
    let window_state = db
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .load_window_state()
        .unwrap_or_default();

    let app_state = db
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .load_app_state()
        .unwrap_or_default();

    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: window_state.width,
        height: window_state.height,
    }));

    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: window_state.x,
        y: window_state.y,
    }));

    let _ = window.set_always_on_top(app_state.always_on_top);
    apply_window_effects(&window);

    Ok(())
}

fn build_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Mostrar TOTLINE", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("TOTLINE")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                let _ = show_window(app.clone());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                let _ = show_window(app.clone());
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::open().expect("failed to open database");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = show_window(app.clone());
        }))
        .manage(AppData {
            db: Mutex::new(db),
        })
        .invoke_handler(tauri::generate_handler![
            load_app_state,
            save_app_state,
            load_window_state,
            save_window_state,
            minimize_window,
            hide_window,
            show_window,
            set_always_on_top,
            quit_app,
        ])
        .setup(|app| {
            build_tray(app.handle())?;
            restore_window(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
