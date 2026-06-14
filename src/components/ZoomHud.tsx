interface ZoomHudProps {
  zoom: number;
  visible: boolean;
  resolved: "light" | "dark";
}

export function ZoomHud({ zoom, visible, resolved }: ZoomHudProps) {
  if (!visible) return null;

  const percent = Math.round(zoom * 100);
  const isDark = resolved === "dark";

  return (
    <div
      className={[
        "zoom-hud pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-medium tabular-nums shadow-lg",
        isDark ? "bg-zinc-900/80 text-zinc-100" : "bg-white/85 text-zinc-800",
      ].join(" ")}
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {percent}%
    </div>
  );
}
