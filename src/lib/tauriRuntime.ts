import { listen as tauriListen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Unlisten = () => void;

interface AppWindow {
  outerPosition: () => Promise<{ x: number; y: number }>;
  outerSize: () => Promise<{ width: number; height: number }>;
  onMoved: (handler: () => void) => Promise<Unlisten>;
  onResized: (handler: () => void) => Promise<Unlisten>;
}

export function isTauriRuntime(): boolean {
  return (
    typeof window === "undefined" ||
    "__TAURI_INTERNALS__" in window ||
    "__TAURI__" in window
  );
}

export function listenAppEvent(
  event: string,
  handler: () => void,
): Promise<Unlisten> {
  if (!isTauriRuntime()) return Promise.resolve(() => {});
  return tauriListen(event, handler);
}

export function getAppWindow(): AppWindow {
  if (isTauriRuntime()) return getCurrentWindow();

  return {
    outerPosition: async () => ({ x: window.screenX, y: window.screenY }),
    outerSize: async () => ({
      width: window.outerWidth,
      height: window.outerHeight,
    }),
    onMoved: async () => () => {},
    onResized: async () => () => {},
  };
}
