import { useEffect, useState } from "react";

interface HeaderProps {
  visible: boolean;
  alwaysOnTop: boolean;
  onAlwaysOnTopChange: (value: boolean) => void;
  onHelp: () => void;
  onClose: () => void;
}

export function Header({
  visible,
  alwaysOnTop,
  onAlwaysOnTopChange,
  onHelp,
  onClose,
}: HeaderProps) {
  return (
    <header
      data-tauri-drag-region
      className={[
        "app-header absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-5 text-zinc-100",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div
        data-tauri-drag-region
        className="flex flex-1 select-none items-center gap-3"
      >
        <span className="app-title-dot" aria-hidden />
        <span className="app-title text-[10px] font-medium uppercase tracking-[0.28em]">
          TOTLINE
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAlwaysOnTopChange(!alwaysOnTop)}
          className={[
            "app-header-button",
            alwaysOnTop ? "app-header-button-active" : "",
          ].join(" ")}
          title="Sempre visível"
          aria-label="Sempre visível"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5.5 2.8h5" />
            <path d="M6.3 2.8 6 6.2 4.2 8h5.6L8 6.2l-.3-3.4" />
            <path d="M7 8v5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onHelp}
          className="app-header-button"
          title="Ajuda"
          aria-label="Ajuda"
        >
          ?
        </button>

        <button
          type="button"
          onClick={onClose}
          className="app-header-button"
          title="Ocultar"
          aria-label="Ocultar"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3.5 8h9" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export function useHeaderReveal(disabled = false): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (disabled) {
      setVisible(false);
      return;
    }

    const onMove = (event: MouseEvent) => {
      if (event.clientY <= 28) {
        setVisible(true);
      } else if (event.clientY > 62) {
        setVisible(false);
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [disabled]);

  return visible;
}
