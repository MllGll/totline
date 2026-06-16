import { useEffect, useState } from "react";

interface ZoomHudProps {
  zoom: number;
  visible: boolean;
}

type ZoomHudPhase = "enter" | "visible" | "exit";

const EXIT_MS = 180;

export function ZoomHud({ zoom, visible }: ZoomHudProps) {
  const [rendered, setRendered] = useState(visible);
  const [phase, setPhase] = useState<ZoomHudPhase>(
    visible ? "visible" : "exit",
  );

  useEffect(() => {
    let frame = 0;
    let timer = 0;

    if (visible) {
      setRendered(true);
      setPhase("enter");
      frame = window.requestAnimationFrame(() => {
        setPhase("visible");
      });
    } else if (rendered) {
      setPhase("exit");
      timer = window.setTimeout(() => {
        setRendered(false);
      }, EXIT_MS);
    }

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [rendered, visible]);

  if (!rendered) return null;

  const percent = Math.round(zoom * 100);

  return (
    <div
      className={[
        "zoom-hud pointer-events-none absolute bottom-7 left-1/2 z-40 rounded-[10px] px-3.5 py-2 text-[12px] font-medium tabular-nums",
        `zoom-hud-${phase}`,
      ].join(" ")}
    >
      {percent}%
    </div>
  );
}
