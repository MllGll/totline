use serde_json::Value;

const APP_COMMANDS: [&str; 9] = [
    "load_app_state",
    "save_app_state",
    "load_window_state",
    "save_window_state",
    "minimize_window",
    "hide_window",
    "show_window",
    "set_always_on_top",
    "quit_app",
];

const WINDOW_PERMISSIONS: [&str; 11] = [
    "core:window:allow-minimize",
    "core:window:allow-hide",
    "core:window:allow-show",
    "core:window:allow-unminimize",
    "core:window:allow-set-focus",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-outer-position",
    "core:window:allow-outer-size",
    "core:window:allow-set-effects",
];

#[test]
fn tauri_window_config_matches_totline_desktop_contract() {
    let config: Value = serde_json::from_str(include_str!("../tauri.conf.json"))
        .expect("valid tauri.conf.json");

    assert_eq!(config["productName"], "TOTLINE");
    assert_eq!(config["identifier"], "com.totline.desktop");
    assert_eq!(config["app"]["security"]["capabilities"][0], "default");

    let windows = config["app"]["windows"]
        .as_array()
        .expect("windows array");
    let main = windows
        .iter()
        .find(|window| window["label"] == "main")
        .expect("main window");

    assert_eq!(main["title"], "TOTLINE");
    assert_eq!(main["width"], 480);
    assert_eq!(main["height"], 640);
    assert_eq!(main["minWidth"], 320);
    assert_eq!(main["minHeight"], 240);
    assert_eq!(main["decorations"], false);
    assert_eq!(main["transparent"], true);
    assert_eq!(main["alwaysOnTop"], true);
    assert_eq!(main["visible"], false);
    assert_eq!(main["shadow"], false);
    assert_eq!(main["center"], false);
}

#[test]
fn default_capability_grants_required_window_and_app_permissions() {
    let capability: Value = serde_json::from_str(include_str!("../capabilities/default.json"))
        .expect("valid capability json");
    let windows = string_array(&capability["windows"]);
    let permissions = string_array(&capability["permissions"]);

    assert!(windows.contains(&"main"));
    assert!(permissions.contains(&"core:default"));
    assert!(permissions.contains(&"core:tray:default"));
    assert!(permissions.contains(&"core:menu:default"));
    assert!(permissions.contains(&"core:event:default"));
    assert!(permissions.contains(&"allow-app-commands"));

    for permission in WINDOW_PERMISSIONS {
        assert!(
            permissions.contains(&permission),
            "missing window permission: {permission}",
        );
    }
}

#[test]
fn custom_permission_allows_every_registered_app_command() {
    let permission = include_str!("../permissions/app-commands.toml");
    let backend = include_str!("../src/lib.rs");
    let frontend = include_str!("../../src/lib/tauri.ts");

    assert!(permission.contains("identifier = \"allow-app-commands\""));

    for command in APP_COMMANDS {
        assert!(
            permission.contains(&format!("\"{command}\"")),
            "permission does not allow command: {command}",
        );
        assert!(
            backend.contains(command),
            "backend does not register command: {command}",
        );
        assert!(
            frontend.contains(&format!("\"{command}\"")),
            "frontend bridge does not invoke command: {command}",
        );
    }
}

fn string_array(value: &Value) -> Vec<&str> {
    value
        .as_array()
        .expect("json array")
        .iter()
        .map(|item| item.as_str().expect("string item"))
        .collect()
}
