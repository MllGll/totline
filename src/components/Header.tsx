import { useEffect, useState } from "react";
import type { Theme } from "../types";

interface HeaderProps {
  visible: boolean;
  theme: Theme;
  alwaysOnTop: boolean;
  onThemeChange: (theme: Theme) => void;
  onAlwaysOnTopChange: (value: boolean) => void;
  onMinimize: () => void;
  onHide: () => void;
  resolved: "light" | "dark";
}

const themes: Theme[] = ["light", "dark", "system"];

export function Header({
  visible,
  theme,
  alwaysOnTop,
  onThemeChange,
  onAlwaysOnTopChange,
  onMinimize,
  onHide,
  resolved,
}: HeaderProps) {
  const isDark = resolved === "dark";

  return (
    <header
      data-tauri-drag-region
      className={[
        "absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-3 transition-all duration-300 ease-calm",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
        isDark ? "text-zinc-100" : "text-zinc-800",
      ].join(" ")}
      style={{
        background: isDark
          ? "var(--header-dark)"
          : "var(--header-light)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: isDark
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div
        data-tauri-drag-region
        className="flex flex-1 items-center gap-2 select-none"
      >
        <span className="text-[11px] font-medium tracking-[0.22em] uppercase opacity-60">
          TOTLINE
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAlwaysOnTopChange(!alwaysOnTop)}
          className={[
            "rounded-md px-2 py-1 text-[11px] transition-colors duration-200",
            alwaysOnTop
              ? isDark
                ? "bg-white/10 text-white"
                : "bg-black/8 text-zinc-800"
              : "opacity-50 hover:opacity-80",
          ].join(" ")}
          title="Sempre visível"
        >
          Pin
        </button>

        <div className="flex rounded-md overflow-hidden border border-black/5 dark:border-white/10">
          {themes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onThemeChange(item)}
              className={[
                "px-2 py-1 text-[10px] uppercase tracking-wide transition-colors duration-200",
                theme === item
                  ? isDark
                    ? "bg-white/12"
                    : "bg-black/8"
                  : "opacity-50 hover:opacity-80",
              ].join(" ")}
            >
              {item === "system" ? "Auto" : item.slice(0, 1).toUpperCase()}
            </button>
          ))}
        </div>

        <WindowButton label="—" onClick={onMinimize} title="Minimizar (Esc)" />
        <WindowButton label="×" onClick={onHide} title="Ocultar para bandeja" />
      </div>
    </header>
  );
}

function WindowButton({
  label,
  onClick,
  title,
}: {
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-sm opacity-60 transition-all duration-200 hover:bg-black/8 hover:opacity-100 dark:hover:bg-white/10"
    >
      {label}
    </button>
  );
}

export function useHeaderReveal(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    const onMove = (event: MouseEvent) => {
      if (event.clientY <= 28) {
        show();
      } else if (event.clientY > 56) {
        hide();
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return visible;
}
