import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_STATE, DEFAULT_WINDOW } from "../types";
import {
  hideWindow,
  loadAppState,
  loadWindowState,
  minimizeWindow,
  quitApp,
  saveAppState,
  saveWindowState,
  setAlwaysOnTop,
  showWindow,
} from "./tauri";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("tauri bridge", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("loads the persisted app state", async () => {
    const state = {
      ...DEFAULT_STATE,
      content: "saved note",
      zoom: DEFAULT_STATE.zoom + 0.1,
    };

    mockedInvoke.mockResolvedValueOnce(state);

    await expect(loadAppState()).resolves.toEqual(state);
    expect(mockedInvoke).toHaveBeenCalledWith("load_app_state");
  });

  it("falls back to the default app state when loading fails", async () => {
    mockedInvoke.mockRejectedValueOnce(new Error("missing state"));

    await expect(loadAppState()).resolves.toEqual(DEFAULT_STATE);
  });

  it("saves the app state with the expected payload", async () => {
    const state = { ...DEFAULT_STATE, content: "draft" };

    await saveAppState(state);

    expect(mockedInvoke).toHaveBeenCalledWith("save_app_state", {
      appState: state,
    });
  });

  it("loads the persisted window state", async () => {
    const state = {
      ...DEFAULT_WINDOW,
      x: 120,
      y: 80,
      width: 900,
      height: 640,
    };

    mockedInvoke.mockResolvedValueOnce(state);

    await expect(loadWindowState()).resolves.toEqual(state);
    expect(mockedInvoke).toHaveBeenCalledWith("load_window_state");
  });

  it("falls back to the default window state when loading fails", async () => {
    mockedInvoke.mockRejectedValueOnce(new Error("missing window state"));

    await expect(loadWindowState()).resolves.toEqual(DEFAULT_WINDOW);
  });

  it("saves the window state with the expected payload", async () => {
    const state = { ...DEFAULT_WINDOW, x: 10, y: 20 };

    await saveWindowState(state);

    expect(mockedInvoke).toHaveBeenCalledWith("save_window_state", {
      windowState: state,
    });
  });

  it("maps window commands to Tauri invoke names", async () => {
    await minimizeWindow();
    await hideWindow();
    await showWindow();
    await setAlwaysOnTop(true);
    await quitApp();

    expect(mockedInvoke).toHaveBeenNthCalledWith(1, "minimize_window");
    expect(mockedInvoke).toHaveBeenNthCalledWith(2, "hide_window");
    expect(mockedInvoke).toHaveBeenNthCalledWith(3, "show_window");
    expect(mockedInvoke).toHaveBeenNthCalledWith(4, "set_always_on_top", {
      value: true,
    });
    expect(mockedInvoke).toHaveBeenNthCalledWith(5, "quit_app");
  });
});
