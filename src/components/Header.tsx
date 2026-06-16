import { useEffect, useState } from "react";
import { Lock, LockOpen, CircleQuestionMark, Minus, X } from 'lucide-react';
import appIcon from "../../src-tauri/icons/64x64.png";

interface HeaderProps {
  visible: boolean;
  alwaysOnTop: boolean;
  onAlwaysOnTopChange: (value: boolean) => void;
  onHelp: () => void;
  onHideToBackground: () => void;
  onMinimize: () => void;
}

export function Header({
  visible,
  alwaysOnTop,
  onAlwaysOnTopChange,
  onHelp,
  onHideToBackground,
  onMinimize,
}: HeaderProps) {
  return (
    <header
      data-tauri-drag-region
      className={[
        "app-header absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between pl-5 pr-4 text-zinc-100",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div
        data-tauri-drag-region
        className="flex flex-1 select-none items-center gap-2"
      >
        <img className="app-title-icon" src={appIcon} alt="" aria-hidden />
        <span className="app-title text-[12px] font-medium uppercase tracking-[0.28em]">
          TOTLINE
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAlwaysOnTopChange(!alwaysOnTop)}
          className={[
            "app-header-button",
            alwaysOnTop ? "app-header-button-active" : "",
          ].join(" ")}
          title="Always on top"
          aria-label="Always on top"
        >
          {alwaysOnTop ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onHelp}
          className="app-header-button"
          title="Help"
          aria-label="Help"
        >
          <CircleQuestionMark className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onMinimize}
          className="app-header-button"
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onHideToBackground}
          className="app-header-button"
          title="Close to background"
          aria-label="Close to background"
        >
          <X className="h-4 w-4" />
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
