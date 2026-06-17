import { listen as tauriListen } from "@tauri-apps/api/event";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import type { Monitor } from "@tauri-apps/api/window";

type Unlisten = () => void;

interface AppWindow {
  outerPosition: () => Promise<{ x: number; y: number }>;
  outerSize: () => Promise<{ width: number; height: number }>;
  onMoved: (handler: () => void) => Promise<Unlisten>;
  onResized: (handler: () => void) => Promise<Unlisten>;
}

interface AppMonitor {
  workArea: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
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

export async function getCurrentAppMonitor(): Promise<AppMonitor | null> {
  if (isTauriRuntime()) return normalizeMonitor(await currentMonitor());

  const screen = window.screen as Screen & {
    availLeft?: number;
    availTop?: number;
  };

  return {
    workArea: {
      position: {
        x: screen.availLeft ?? 0,
        y: screen.availTop ?? 0,
      },
      size: {
        width: screen.availWidth,
        height: screen.availHeight,
      },
    },
  };
}

function normalizeMonitor(monitor: Monitor | null): AppMonitor | null {
  if (!monitor) return null;

  return {
    workArea: {
      position: {
        x: monitor.workArea.position.x,
        y: monitor.workArea.position.y,
      },
      size: {
        width: monitor.workArea.size.width,
        height: monitor.workArea.size.height,
      },
    },
  };
}
