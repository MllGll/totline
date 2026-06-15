import { useEffect, useState } from "react";

interface HeaderProps {
  visible: boolean;
  alwaysOnTop: boolean;
  onAlwaysOnTopChange: (value: boolean) => void;
  onHelp: () => void;
}

export function Header({
  visible,
  alwaysOnTop,
  onAlwaysOnTopChange,
  onHelp,
}: HeaderProps) {
  return (
    <header
      data-tauri-drag-region
      className={[
        "absolute inset-x-0 top-0 z-30 flex h-10 items-center justify-between px-4 transition-all duration-500 ease-out text-zinc-100",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
      style={{
        background: "rgba(24, 24, 27, 0.3)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        data-tauri-drag-region
        className="flex flex-1 items-center select-none"
      >
        <span className="text-[10px] font-medium tracking-[0.3em] uppercase opacity-40">
          TOTLINE
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAlwaysOnTopChange(!alwaysOnTop)}
          className={[
            "rounded px-2 py-1 text-[10px] transition-all duration-200",
            alwaysOnTop
              ? "bg-white/5 text-white/60"
              : "opacity-30 hover:opacity-60",
          ].join(" ")}
          title="Sempre visível"
        >
          Pin
        </button>

        <button
          type="button"
          onClick={onHelp}
          className="rounded px-2 py-1 text-[10px] opacity-30 hover:opacity-60 transition-all duration-200"
          title="Ajuda"
        >
          ?
        </button>
      </div>
    </header>
  );
}

export function useHeaderReveal(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (event.clientY <= 28) {
        setVisible(true);
      } else if (event.clientY > 56) {
        setVisible(false);
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return visible;
}
