mod db;

use db::{AppState, Database, WindowState};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, WindowEvent,
};

const ENABLE_NATIVE_WINDOW_BLUR: bool = false;
// Native Windows blur can force an opaque compositor surface in this app.
// Keep it disabled so transparency remains fully controlled by CSS.

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

fn persist_window_geometry(app: &AppHandle, data: &AppData) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    let position = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;

    data
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .save_window_state(&WindowState {
            x: position.x,
            y: position.y,
            width: size.width as f64,
            height: size.height as f64,
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn hide_window(app: AppHandle, data: State<'_, AppData>) -> Result<(), String> {
    hide_window_internal(&app, &data)
}

fn hide_window_internal(app: &AppHandle, data: &AppData) -> Result<(), String> {
    persist_window_geometry(app, data)?;

    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn show_window_internal(app: &AppHandle, data: &AppData) -> Result<(), String> {
    {
        let mut app_state = data
            .db
            .lock()
            .map_err(|e| e.to_string())?
            .load_app_state()
            .map_err(|e| e.to_string())?;
        app_state.last_window_visible = true;
        data.db
            .lock()
            .map_err(|e| e.to_string())?
            .save_app_state(&app_state)
            .map_err(|e| e.to_string())?;
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_background_color(Some(tauri::window::Color(0, 0, 0, 0)));
        let window_state = data
            .db
            .lock()
            .map_err(|e| e.to_string())?
            .load_window_state()
            .unwrap_or_default();
        let (position, size) = visible_geometry(&window, &window_state);
        let _ = window.set_size(tauri::Size::Physical(size));
        let _ = window.set_position(tauri::Position::Physical(position));
        let _ = data
            .db
            .lock()
            .map_err(|e| e.to_string())?
            .save_window_state(&WindowState {
                x: position.x,
                y: position.y,
                width: size.width as f64,
                height: size.height as f64,
            });
        window.show().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn show_window(app: AppHandle, data: State<'_, AppData>) -> Result<(), String> {
    show_window_internal(&app, &data)
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
async fn quit_app(app: AppHandle, data: State<'_, AppData>) -> Result<(), String> {
    let _ = persist_window_geometry(&app, &data);
    app.exit(0);
    Ok(())
}

fn apply_window_effects(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "windows")]
    {
        use tauri::window::{Effect, EffectState, EffectsBuilder};

        let blurred = EffectsBuilder::new()
            .effect(Effect::Blur)
            .state(EffectState::Active)
            .build();
        if window.set_effects(blurred).is_err() {
            let mica = EffectsBuilder::new()
                .effect(Effect::Mica)
                .state(EffectState::Active)
                .build();
            let _ = window.set_effects(mica);
        }
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

fn visible_geometry(
    window: &tauri::WebviewWindow,
    state: &WindowState,
) -> (tauri::PhysicalPosition<i32>, tauri::PhysicalSize<u32>) {
    let monitors = window.available_monitors().unwrap_or_default();
    let areas: Vec<_> = monitors
        .iter()
        .map(|monitor| monitor.work_area().clone())
        .collect();
    let primary_area = window
        .primary_monitor()
        .ok()
        .flatten()
        .map(|monitor| monitor.work_area().clone());

    resolve_visible_geometry(state, &areas, primary_area.as_ref())
}

fn resolve_visible_geometry(
    state: &WindowState,
    areas: &[tauri::PhysicalRect<i32, u32>],
    primary_area: Option<&tauri::PhysicalRect<i32, u32>>,
) -> (tauri::PhysicalPosition<i32>, tauri::PhysicalSize<u32>) {
    const MIN_VISIBLE_PX: i32 = 96;

    let fallback_size = tauri::PhysicalSize {
        width: 480,
        height: 640,
    };
    let requested_size = tauri::PhysicalSize {
        width: state.width.clamp(320.0, 2400.0).round() as u32,
        height: state.height.clamp(240.0, 1800.0).round() as u32,
    };
    let requested_position = tauri::PhysicalPosition {
        x: state.x,
        y: state.y,
    };

    if areas.is_empty() {
        return (requested_position, requested_size);
    }

    for area in areas {
        if rects_overlap_enough(
            requested_position.x,
            requested_position.y,
            requested_size.width,
            requested_size.height,
            area.position.x,
            area.position.y,
            area.size.width,
            area.size.height,
            MIN_VISIBLE_PX,
        ) {
            let size = fit_size_to_area(requested_size, area.size);
            return (clamp_position_to_area(requested_position, size, area), size);
        }
    }

    let Some(area) = primary_area.or_else(|| areas.first()) else {
        return (requested_position, fallback_size);
    };
    let size = fit_size_to_area(requested_size, area.size);
    (center_position_in_area(size, area), size)
}

fn fit_size_to_area(
    size: tauri::PhysicalSize<u32>,
    area_size: tauri::PhysicalSize<u32>,
) -> tauri::PhysicalSize<u32> {
    tauri::PhysicalSize {
        width: size.width.min(area_size.width).max(320),
        height: size.height.min(area_size.height).max(240),
    }
}

fn clamp_position_to_area(
    position: tauri::PhysicalPosition<i32>,
    size: tauri::PhysicalSize<u32>,
    area: &tauri::PhysicalRect<i32, u32>,
) -> tauri::PhysicalPosition<i32> {
    let area_right = area.position.x + area.size.width as i32;
    let area_bottom = area.position.y + area.size.height as i32;
    let max_x = area_right - size.width as i32;
    let max_y = area_bottom - size.height as i32;

    tauri::PhysicalPosition {
        x: position.x.clamp(area.position.x, max_x.max(area.position.x)),
        y: position.y.clamp(area.position.y, max_y.max(area.position.y)),
    }
}

fn center_position_in_area(
    size: tauri::PhysicalSize<u32>,
    area: &tauri::PhysicalRect<i32, u32>,
) -> tauri::PhysicalPosition<i32> {
    tauri::PhysicalPosition {
        x: area.position.x + ((area.size.width as i32 - size.width as i32) / 2).max(0),
        y: area.position.y + ((area.size.height as i32 - size.height as i32) / 2).max(0),
    }
}

fn rects_overlap_enough(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    area_x: i32,
    area_y: i32,
    area_width: u32,
    area_height: u32,
    min_visible: i32,
) -> bool {
    let right = x + width as i32;
    let bottom = y + height as i32;
    let area_right = area_x + area_width as i32;
    let area_bottom = area_y + area_height as i32;

    let overlap_width = right.min(area_right) - x.max(area_x);
    let overlap_height = bottom.min(area_bottom) - y.max(area_y);

    overlap_width >= min_visible && overlap_height >= min_visible
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rect(
        x: i32,
        y: i32,
        width: u32,
        height: u32,
    ) -> tauri::PhysicalRect<i32, u32> {
        tauri::PhysicalRect {
            position: tauri::PhysicalPosition { x, y },
            size: tauri::PhysicalSize { width, height },
        }
    }

    fn window_state(x: i32, y: i32, width: f64, height: f64) -> WindowState {
        WindowState {
            x,
            y,
            width,
            height,
        }
    }

    #[test]
    fn keeps_visible_window_on_screen() {
        let area = rect(0, 0, 1920, 1080);
        let state = window_state(120, 80, 480.0, 640.0);

        let (position, size) = resolve_visible_geometry(&state, &[area], Some(&area));

        assert_eq!(position.x, 120);
        assert_eq!(position.y, 80);
        assert_eq!(size.width, 480);
        assert_eq!(size.height, 640);
    }

    #[test]
    fn recenters_window_when_saved_position_is_offscreen() {
        let area = rect(0, 0, 1920, 1080);
        let state = window_state(5000, 5000, 480.0, 640.0);

        let (position, size) = resolve_visible_geometry(&state, &[area], Some(&area));

        assert_eq!(size.width, 480);
        assert_eq!(size.height, 640);
        assert_eq!(position.x, 720);
        assert_eq!(position.y, 220);
    }

    #[test]
    fn clamps_partially_visible_window_into_work_area() {
        let area = rect(0, 0, 1920, 1080);
        let state = window_state(1800, 100, 480.0, 640.0);

        let (position, size) = resolve_visible_geometry(&state, &[area], Some(&area));

        assert_eq!(size.width, 480);
        assert_eq!(size.height, 640);
        assert_eq!(position.x, 1440);
        assert_eq!(position.y, 100);
    }

    #[test]
    fn honors_secondary_monitor_when_window_is_visible_there() {
        let primary = rect(0, 0, 1920, 1080);
        let secondary = rect(1920, 0, 1280, 1024);
        let state = window_state(2100, 120, 520.0, 600.0);

        let (position, size) =
            resolve_visible_geometry(&state, &[primary, secondary], Some(&primary));

        assert_eq!(size.width, 520);
        assert_eq!(size.height, 600);
        assert_eq!(position.x, 2100);
        assert_eq!(position.y, 120);
    }

    #[test]
    fn fits_oversized_window_to_work_area() {
        let area = rect(0, 0, 1366, 768);
        let state = window_state(100, 100, 2400.0, 1800.0);

        let (position, size) = resolve_visible_geometry(&state, &[area], Some(&area));

        assert_eq!(size.width, 1366);
        assert_eq!(size.height, 768);
        assert_eq!(position.x, 0);
        assert_eq!(position.y, 0);
    }

    #[test]
    fn clamps_saved_size_to_minimums() {
        let area = rect(0, 0, 1920, 1080);
        let state = window_state(100, 100, 100.0, 100.0);

        let (position, size) = resolve_visible_geometry(&state, &[area], Some(&area));

        assert_eq!(position.x, 100);
        assert_eq!(position.y, 100);
        assert_eq!(size.width, 320);
        assert_eq!(size.height, 240);
    }

    #[test]
    fn keeps_requested_geometry_when_monitor_data_is_unavailable() {
        let state = window_state(-5000, 3000, 5000.0, 40.0);

        let (position, size) = resolve_visible_geometry(&state, &[], None);

        assert_eq!(position.x, -5000);
        assert_eq!(position.y, 3000);
        assert_eq!(size.width, 2400);
        assert_eq!(size.height, 240);
    }

    #[test]
    fn detects_required_visible_overlap() {
        assert!(rects_overlap_enough(0, 0, 320, 240, 224, 144, 800, 600, 96));
        assert!(!rects_overlap_enough(
            0, 0, 320, 240, 225, 144, 800, 600, 96
        ));
        assert!(!rects_overlap_enough(
            0, 0, 320, 240, 224, 145, 800, 600, 96
        ));
    }
}

fn restore_window(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    let _ = window.set_background_color(Some(tauri::window::Color(0, 0, 0, 0)));

    let data = app.state::<AppData>();
    let window_state = data
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .load_window_state()
        .unwrap_or_default();
    let app_state = data
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .load_app_state()
        .unwrap_or_default();
    let should_show_window = app_state.last_window_visible;

    let (position, size) = visible_geometry(&window, &window_state);

    let _ = window.set_size(tauri::Size::Physical(size));
    let _ = window.set_position(tauri::Position::Physical(position));
    let _ = data
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .save_window_state(&WindowState {
            x: position.x,
            y: position.y,
            width: size.width as f64,
            height: size.height as f64,
        });
    let _ = window.set_always_on_top(app_state.always_on_top);
    if ENABLE_NATIVE_WINDOW_BLUR {
        apply_window_effects(&window);
    }

    if !should_show_window {
        let _ = window.hide();
        return Ok(());
    }

    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();

    Ok(())
}

fn build_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show TOTLINE", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("TOTLINE")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                let data = app.state::<AppData>();
                let _ = show_window_internal(app, &data);
            }
            "quit" => {
                let data = app.state::<AppData>();
                let _ = persist_window_geometry(app, &data);
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
                let data = app.state::<AppData>();
                let _ = show_window_internal(&app, &data);
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
            let data = app.state::<AppData>();
            let _ = show_window_internal(app, &data);
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
                let _ = window.emit("totline-hide", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
