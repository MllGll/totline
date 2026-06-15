export interface AppState {
  content: string;
  cursor: number;
  selectionStart: number;
  selectionEnd: number;
  scrollTop: number;
  scrollLeft: number;
  zoom: number;
  theme: string;
  alwaysOnTop: boolean;
  /** Restaura visibilidade da janela na próxima abertura (startup preference). */
  lastWindowVisible: boolean;
}

export const DEFAULT_STATE: AppState = {
  content: "",
  cursor: 0,
  selectionStart: 0,
  selectionEnd: 0,
  scrollTop: 0,
  scrollLeft: 0,
  zoom: 1,
  theme: "system",
  alwaysOnTop: true,
  lastWindowVisible: true,
};

export interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_WINDOW: WindowState = {
  x: 100,
  y: 100,
  width: 480,
  height: 640,
};
