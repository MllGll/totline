import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Editor } from "./components/Editor";
import { Header, useHeaderReveal } from "./components/Header";
import { ZoomHud } from "./components/ZoomHud";
import { useDebouncedCallback, useDebouncedEffect } from "./hooks/useDebounced";
import { useResolvedTheme } from "./hooks/useResolvedTheme";
import {
  hideWindow,
  loadAppState,
  minimizeWindow,
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
  const zoomHudTimer = useRef<number | null>(null);
  const headerVisible = useHeaderReveal();
  const resolved = useResolvedTheme(state.theme);

  useEffect(() => {
    let mounted = true;

    loadAppState().then((loaded) => {
      if (!mounted) return;
      setState(loaded);
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", resolved === "dark");
    document.documentElement.classList.toggle("theme-light", resolved === "light");
  }, [resolved]);

  const persistState = useDebouncedCallback((next: AppState) => {
    void saveAppState(next);
  }, AUTOSAVE_MS);

  const updateState = useCallback(
    (patch: Partial<AppState>) => {
      setState((current) => {
        const next = { ...current, ...patch };
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

    const persistWindow = async () => {
      const position = await window.outerPosition();
      const size = await window.outerSize();
      await saveWindowState({
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      });
    };

    const unlistenMove = window.onMoved(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        void persistWindow();
      }, 300);
    });

    const unlistenResize = window.onResized(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        void persistWindow();
      }, 300);
    });

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      void unlistenMove.then((fn) => fn());
      void unlistenResize.then((fn) => fn());
    };
  }, [ready]);

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
      <div
        className={[
          "flex h-full w-full items-center justify-center text-sm",
          resolved === "dark" ? "text-zinc-300" : "text-zinc-600",
        ].join(" ")}
      >
        Restaurando…
      </div>
    );
  }

  const isDark = resolved === "dark";

  return (
    <div
      className={[
        "relative h-full w-full overflow-hidden rounded-xl transition-colors duration-300",
        isDark ? "theme-dark" : "theme-light",
      ].join(" ")}
      style={{
        background: isDark ? "var(--surface-dark)" : "var(--surface-light)",
        boxShadow: isDark ? "var(--shadow-dark)" : "var(--shadow-light)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Header
        visible={headerVisible}
        theme={state.theme}
        alwaysOnTop={state.alwaysOnTop}
        resolved={resolved}
        onThemeChange={(theme) => updateState({ theme })}
        onAlwaysOnTopChange={(alwaysOnTop) => updateState({ alwaysOnTop })}
        onMinimize={() => void minimizeWindow()}
        onHide={() => void hideWindow()}
      />

      <main
        className="absolute inset-0 pt-2"
        style={{ paddingTop: headerVisible ? 44 : 8 }}
      >
        <Editor
          content={state.content}
          zoom={state.zoom}
          cursor={state.cursor}
          selectionStart={state.selectionStart}
          selectionEnd={state.selectionEnd}
          scrollTop={state.scrollTop}
          scrollLeft={state.scrollLeft}
          resolved={resolved}
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

      <ZoomHud zoom={state.zoom} visible={zoomHudVisible} resolved={resolved} />
    </div>
  );
}
