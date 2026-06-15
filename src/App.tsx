import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Editor } from "./components/Editor";
import { Header, useHeaderReveal } from "./components/Header";
import { HelpOverlay } from "./components/HelpOverlay";
import { ZoomHud } from "./components/ZoomHud";
import { useDebouncedCallback, useDebouncedEffect } from "./hooks/useDebounced";
import {
  hideWindow,
  loadAppState,
  minimizeWindow,
  quitApp,
  saveAppState,
  saveWindowState,
  setAlwaysOnTop,
} from "./lib/tauri";
import type { AppState } from "./types";
import { DEFAULT_STATE } from "./types";

const AUTOSAVE_MS = 500;
const ZOOM_HUD_MS = 900;

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [zoomHudVisible, setZoomHudVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const zoomHudTimer = useRef<number | null>(null);
  const stateRef = useRef<AppState>(DEFAULT_STATE);
  const headerVisible = useHeaderReveal();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let mounted = true;

    loadAppState().then((loaded) => {
      if (!mounted) return;
      const normalized = {
        ...DEFAULT_STATE,
        ...loaded,
        lastWindowVisible: loaded.lastWindowVisible ?? true,
      };
      setState(normalized);
      stateRef.current = normalized;
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const [persistState, flushPersist] = useDebouncedCallback((next: AppState) => {
    void saveAppState(next);
  }, AUTOSAVE_MS);

  const persistWindowNow = useCallback(async () => {
    const window = getCurrentWindow();
    const position = await window.outerPosition();
    const size = await window.outerSize();
    await saveWindowState({
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });
  }, []);

  const flushAndSave = useCallback(
    async (patch: Partial<AppState> = {}) => {
      flushPersist();
      const next = { ...stateRef.current, ...patch };
      stateRef.current = next;
      setState(next);
      await saveAppState(next);
    },
    [flushPersist],
  );

  const handleHideToTray = useCallback(async () => {
    await flushAndSave({ lastWindowVisible: false });
    await persistWindowNow();
    await hideWindow();
  }, [flushAndSave, persistWindowNow]);

  const handleQuit = useCallback(async () => {
    await flushAndSave();
    await persistWindowNow();
    await quitApp();
  }, [flushAndSave, persistWindowNow]);

  useEffect(() => {
    if (!ready) return;

    const unlistenHide = listen("totline-hide", () => {
      void handleHideToTray();
    });
    const unlistenQuit = listen("totline-quit", () => {
      void handleQuit();
    });

    return () => {
      void unlistenHide.then((fn) => fn());
      void unlistenQuit.then((fn) => fn());
    };
  }, [ready, handleHideToTray, handleQuit]);

  const updateState = useCallback(
    (patch: Partial<AppState>) => {
      setState((current) => {
        const next = { ...current, ...patch };
        stateRef.current = next;
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  useDebouncedEffect(() => {
    if (!ready) return;
    void setAlwaysOnTop(state.alwaysOnTop);
  }, [ready, state.alwaysOnTop], 120);

  useEffect(() => {
    if (!ready) return;

    const window = getCurrentWindow();
    let resizeTimer: number | null = null;

    const persistWindow = () => {
      void persistWindowNow();
    };

    const unlistenMove = window.onMoved(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(persistWindow, 300);
    });

    const unlistenResize = window.onResized(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(persistWindow, 300);
    });

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      void unlistenMove.then((fn) => fn());
      void unlistenResize.then((fn) => fn());
    };
  }, [ready, persistWindowNow]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void minimizeWindow();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const showZoomHud = useCallback(() => {
    setZoomHudVisible(true);
    if (zoomHudTimer.current !== null) {
      window.clearTimeout(zoomHudTimer.current);
    }
    zoomHudTimer.current = window.setTimeout(() => {
      setZoomHudVisible(false);
    }, ZOOM_HUD_MS);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
        Restaurando…
      </div>
    );
  }

  return (
    <div className="app-glass relative h-full w-full overflow-hidden">
      <main className="absolute inset-0">
        <Editor
          content={state.content}
          zoom={state.zoom}
          cursor={state.cursor}
          selectionStart={state.selectionStart}
          selectionEnd={state.selectionEnd}
          scrollTop={state.scrollTop}
          scrollLeft={state.scrollLeft}
          headerVisible={headerVisible}
          onContentChange={(content) => updateState({ content })}
          onCursorChange={(cursor) => updateState({ cursor })}
          onSelectionChange={(selectionStart, selectionEnd) =>
            updateState({ selectionStart, selectionEnd })
          }
          onScrollChange={(scrollTop, scrollLeft) =>
            updateState({ scrollTop, scrollLeft })
          }
          onZoomChange={(zoom) => updateState({ zoom })}
          onZoomActivity={showZoomHud}
        />
      </main>

      <Header
        visible={headerVisible}
        alwaysOnTop={state.alwaysOnTop}
        onAlwaysOnTopChange={(alwaysOnTop) => updateState({ alwaysOnTop })}
        onHelp={() => setHelpVisible(true)}
      />

      <ZoomHud zoom={state.zoom} visible={zoomHudVisible} />
      <HelpOverlay visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </div>
  );
}
