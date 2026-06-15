import { invoke } from "@tauri-apps/api/core";
import type { AppState, WindowState } from "../types";
import { DEFAULT_STATE, DEFAULT_WINDOW } from "../types";

export async function loadAppState(): Promise<AppState> {
  try {
    return await invoke<AppState>("load_app_state");
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  await invoke("save_app_state", { appState: state });
}

export async function loadWindowState(): Promise<WindowState> {
  try {
    return await invoke<WindowState>("load_window_state");
  } catch {
    return { ...DEFAULT_WINDOW };
  }
}

export async function saveWindowState(state: WindowState): Promise<void> {
  await invoke("save_window_state", { windowState: state });
}

export async function minimizeWindow(): Promise<void> {
  await invoke("minimize_window");
}

export async function hideWindow(): Promise<void> {
  await invoke("hide_window");
}

export async function showWindow(): Promise<void> {
  await invoke("show_window");
}

export async function setAlwaysOnTop(value: boolean): Promise<void> {
  await invoke("set_always_on_top", { value });
}

export async function quitApp(): Promise<void> {
  await invoke("quit_app");
}
