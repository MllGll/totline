import { invoke } from "@tauri-apps/api/core";
import type { AppState, WindowState } from "../types";
import { DEFAULT_STATE, DEFAULT_WINDOW } from "../types";
import { isTauriRuntime } from "./tauriRuntime";

const APP_STATE_KEY = "totline:e2e:app-state";
const WINDOW_STATE_KEY = "totline:e2e:window-state";

export async function loadAppState(): Promise<AppState> {
  if (!isTauriRuntime()) {
    return loadLocalState(APP_STATE_KEY, DEFAULT_STATE);
  }

  try {
    return await invoke<AppState>("load_app_state");
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  if (!isTauriRuntime()) {
    saveLocalState(APP_STATE_KEY, state);
    return;
  }

  await invoke("save_app_state", { appState: state });
}

export async function loadWindowState(): Promise<WindowState> {
  if (!isTauriRuntime()) {
    return loadLocalState(WINDOW_STATE_KEY, DEFAULT_WINDOW);
  }

  try {
    return await invoke<WindowState>("load_window_state");
  } catch {
    return { ...DEFAULT_WINDOW };
  }
}

export async function saveWindowState(state: WindowState): Promise<void> {
  if (!isTauriRuntime()) {
    saveLocalState(WINDOW_STATE_KEY, state);
    return;
  }

  await invoke("save_window_state", { windowState: state });
}

export async function minimizeWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("minimize_window");
}

export async function hideWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("hide_window");
}

export async function showWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("show_window");
}

export async function setAlwaysOnTop(value: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("set_always_on_top", { value });
}

export async function quitApp(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("quit_app");
}

function loadLocalState<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function saveLocalState<T>(key: string, state: T): void {
  window.localStorage.setItem(key, JSON.stringify(state));
}
