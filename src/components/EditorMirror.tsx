import { useMemo } from "react";
import { lineForDisplay, parseCheckboxLine } from "../lib/checkbox";

interface EditorMirrorProps {
  content: string;
  zoom: number;
  fontSize: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
  scrollTop: number;
  scrollLeft: number;
}

export function EditorMirror({
  content,
  zoom,
  fontSize,
  lineHeight,
  paddingX,
  paddingY,
  scrollTop,
  scrollLeft,
}: EditorMirrorProps) {
  const lines = useMemo(
    () =>
      content.split("\n").map((line) => ({
        display: lineForDisplay(line),
        checkbox: parseCheckboxLine(line),
      })),
    [content],
  );

  const scaledFont = fontSize * zoom;

  return (
    <pre
      aria-hidden
      className="editor-mirror pointer-events-none absolute inset-0 overflow-hidden font-mono"
      style={{
        fontSize: `${scaledFont}px`,
        lineHeight,
        color: "rgb(var(--tone-rgb) / 0.9)",
        backgroundColor: "transparent",
        zIndex: 0,
      }}
    >
      <span
        className="editor-mirror-content"
        style={{
          padding: `${paddingY}px ${paddingX}px`,
          transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
        }}
      >
        {lines.map((line, index) => {
          if (!line.checkbox?.checked) {
            return (
              <span
                key={index}
                className="block min-h-[1lh] whitespace-pre-wrap break-words"
              >
                {line.display}
              </span>
            );
          }

          const hiddenSyntax = `${line.checkbox.indent}${"\u00A0".repeat(
            line.checkbox.bracketText.length,
          )}`;

          return (
            <span
              key={index}
              className="block min-h-[1lh] whitespace-pre-wrap break-words"
            >
              {hiddenSyntax}
              <span className="editor-completed-line">
                {line.checkbox.text}
              </span>
            </span>
          );
        })}
      </span>
    </pre>
  );
}
