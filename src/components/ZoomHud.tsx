interface ZoomHudProps {
  zoom: number;
  visible: boolean;
}

export function ZoomHud({ zoom, visible }: ZoomHudProps) {
  if (!visible) return null;

  const percent = Math.round(zoom * 100);

  return (
    <div className="zoom-hud pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-zinc-900/75 px-3 py-1.5 text-xs font-medium tabular-nums text-zinc-100">
      {percent}%
    </div>
  );
}
