import { useMemo } from "react";
import {
  checkboxLeftPx,
  parseCheckboxLine,
  measureTextWidth,
} from "../lib/checkbox";

interface CheckboxOverlayProps {
  content: string;
  zoom: number;
  fontSize: number;
  lineHeight: number;
  paddingTop: number;
  paddingLeft: number;
  editorWidth: number;
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
  editorWidth,
  scrollTop,
  onToggle,
}: CheckboxOverlayProps) {
  const scaledFont = fontSize * zoom;
  const scaledLine = lineHeight * zoom;
  const boxSize = scaledFont * 0.72;
  const lines = useMemo(() => {
    const rawLines = content.split("\n");
    const availableWidth = Math.max(1, editorWidth - paddingLeft * 2);
    let visualLineIndex = 0;

    return rawLines.flatMap((rawLine, lineIndex) => {
      const checkbox = parseCheckboxLine(rawLine);
      const visualTop = visualLineIndex * scaledLine;
      const visualRows = measureWrappedRows(
        rawLine,
        scaledFont,
        availableWidth,
      );

      visualLineIndex += visualRows;

      if (!checkbox) return [];

      return [
        {
          ...checkbox,
          lineIndex,
          visualTop,
        },
      ];
    });
  }, [content, editorWidth, paddingLeft, scaledFont, scaledLine]);

  if (lines.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${-scrollTop}px)` }}
      >
        <div
          className="checkbox-padding-layer absolute inset-0"
          style={{ transform: `translateY(${paddingTop}px)` }}
        >
          {lines.map((line) => {
            const top = line.visualTop;
            const left = checkboxLeftPx(line.indent, scaledFont, paddingLeft);
            const bracketWidth = measureTextWidth(
              line.bracketText,
              scaledFont,
            );

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
                  borderColor: line.checked
                    ? "rgb(var(--tone-rgb) / 0.68)"
                    : "rgb(var(--tone-soft-rgb) / 0.46)",
                  background: line.checked
                    ? "rgb(var(--tone-accent-rgb) / 0.18)"
                    : "rgb(var(--tone-accent-rgb) / 0.08)",
                  boxShadow: line.checked
                    ? "inset 0 1px 0 rgb(var(--tone-rgb) / 0.24), 0 0 18px rgb(var(--tone-soft-rgb) / 0.12)"
                    : "inset 0 1px 0 rgb(var(--tone-rgb) / 0.12)",
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onToggle(line.lineIndex);
                }}
                aria-label={
                  line.checked
                    ? "Marcar como pendente"
                    : "Marcar como concluida"
                }
              >
                {line.checked && (
                  <svg
                    viewBox="0 0 12 12"
                    className="h-[55%] w-[55%] text-zinc-100/[0.72]"
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
      </div>
    </div>
  );
}

function measureWrappedRows(
  text: string,
  fontSize: number,
  availableWidth: number,
): number {
  if (!text) return 1;

  let rows = 1;
  let rowWidth = 0;
  const tokens = text.match(/\S+|\s+/g) ?? [text];

  for (const token of tokens) {
    const tokenWidth = measureTextWidth(token, fontSize);

    if (tokenWidth > availableWidth) {
      const chars = Array.from(token);
      for (const char of chars) {
        const charWidth = measureTextWidth(char, fontSize);
        if (rowWidth > 0 && rowWidth + charWidth > availableWidth) {
          rows += 1;
          rowWidth = 0;
        }
        rowWidth += charWidth;
      }
      continue;
    }

    if (rowWidth > 0 && rowWidth + tokenWidth > availableWidth) {
      rows += 1;
      rowWidth = token.trim().length === 0 ? 0 : tokenWidth;
      continue;
    }

    rowWidth += tokenWidth;
  }

  return rows;
}
