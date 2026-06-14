import { useMemo } from "react";
import { parseCheckboxLines } from "../lib/checkbox";

interface CheckboxOverlayProps {
  content: string;
  zoom: number;
  fontSize: number;
  lineHeight: number;
  paddingTop: number;
  paddingLeft: number;
  scrollTop: number;
  resolved: "light" | "dark";
  onToggle: (lineIndex: number) => void;
}

export function CheckboxOverlay({
  content,
  zoom,
  fontSize,
  lineHeight,
  paddingTop,
  paddingLeft,
  scrollTop,
  resolved,
  onToggle,
}: CheckboxOverlayProps) {
  const lines = useMemo(() => parseCheckboxLines(content), [content]);
  const isDark = resolved === "dark";

  if (lines.length === 0) return null;

  const scaledFont = fontSize * zoom;
  const scaledLine = lineHeight * zoom;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {lines.map((line) => {
        const top =
          paddingTop + line.lineIndex * scaledLine - scrollTop;
        const checkboxLeft =
          paddingLeft +
          measureTextWidth(line.indent, scaledFont) +
          (line.hasDash ? measureTextWidth("- ", scaledFont) : 0);

        return (
          <button
            key={line.lineIndex}
            type="button"
            className="checkbox-hit pointer-events-auto absolute flex items-center justify-center rounded-[3px] border"
            style={{
              top,
              left: checkboxLeft,
              width: scaledFont * 0.72,
              height: scaledFont * 0.72,
              marginTop: (scaledLine - scaledFont * 0.72) / 2,
              borderColor: isDark
                ? "rgba(161,161,170,0.55)"
                : "rgba(113,113,122,0.55)",
              background: line.checked
                ? isDark
                  ? "rgba(96,165,250,0.85)"
                  : "rgba(59,130,246,0.85)"
                : isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              onToggle(line.lineIndex);
            }}
            aria-label={line.checked ? "Marcar como pendente" : "Marcar como concluída"}
          >
            {line.checked && (
              <svg
                viewBox="0 0 12 12"
                className="h-[55%] w-[55%] text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 6.2 5 8.7 9.5 3.8" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

const measureCanvas = document.createElement("canvas");

function measureTextWidth(text: string, fontSize: number): number {
  const context = measureCanvas.getContext("2d");
  if (!context) return text.length * fontSize * 0.55;
  context.font = `${fontSize}px Cascadia Code, Consolas, ui-monospace, monospace`;
  return context.measureText(text).width;
}
