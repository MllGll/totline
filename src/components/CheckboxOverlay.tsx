import { useMemo } from "react";
import {
  checkboxLeftPx,
  measureTextWidth,
  parseCheckboxLines,
} from "../lib/checkbox";

interface CheckboxOverlayProps {
  content: string;
  zoom: number;
  fontSize: number;
  lineHeight: number;
  paddingTop: number;
  paddingLeft: number;
  scrollTop: number;
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
  onToggle,
}: CheckboxOverlayProps) {
  const lines = useMemo(() => parseCheckboxLines(content), [content]);

  if (lines.length === 0) return null;

  const scaledFont = fontSize * zoom;
  const scaledLine = lineHeight * zoom;
  const boxSize = scaledFont * 0.72;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden
    >
      {lines.map((line) => {
        const top = paddingTop + line.lineIndex * scaledLine - scrollTop;
        const left = checkboxLeftPx(line.indent, scaledFont, paddingLeft);
        const bracketWidth = measureTextWidth(line.bracketText, scaledFont);

        return (
          <button
            key={line.lineIndex}
            type="button"
            className="checkbox-hit pointer-events-auto absolute flex items-center justify-center rounded-[3px] border"
            style={{
              top,
              left: left + (bracketWidth - boxSize) / 2,
              width: boxSize,
              height: boxSize,
              marginTop: (scaledLine - boxSize) / 2,
              borderColor: "rgba(161,161,170,0.55)",
              background: line.checked
                ? "rgba(96,165,250,0.85)"
                : "rgba(255,255,255,0.06)",
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              onToggle(line.lineIndex);
            }}
            aria-label={
              line.checked ? "Marcar como pendente" : "Marcar como concluída"
            }
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
