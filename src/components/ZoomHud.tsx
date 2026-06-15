interface ZoomHudProps {
  zoom: number;
  visible: boolean;
}

export function ZoomHud({ zoom, visible }: ZoomHudProps) {
  if (!visible) return null;

  const percent = Math.round(zoom * 100);

  return (
    <div className="zoom-hud pointer-events-none absolute bottom-7 left-1/2 z-40 -translate-x-1/2 rounded-[10px] px-3.5 py-2 text-[12px] font-medium tabular-nums text-zinc-100/[0.78]">
      {percent}%
    </div>
  );
}
