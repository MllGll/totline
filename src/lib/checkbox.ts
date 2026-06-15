const CHECKBOX_PATTERN = /^(\s*)\[([ xX])\](.*)$/;
const TAB_SIZE = 8;

export interface CheckboxLine {
  lineIndex: number;
  indent: string;
  checked: boolean;
  bracketText: string;
}

export interface CheckboxLineMatch {
  indent: string;
  checked: boolean;
  bracketText: string;
  text: string;
}

export function parseCheckboxLine(line: string): CheckboxLineMatch | null {
  const match = line.match(CHECKBOX_PATTERN);
  if (!match) return null;

  return {
    indent: match[1],
    checked: match[2].toLowerCase() === "x",
    bracketText: `[${match[2]}]`,
    text: match[3],
  };
}

export function parseCheckboxLines(content: string): CheckboxLine[] {
  const lines = content.split("\n");
  const result: CheckboxLine[] = [];

  lines.forEach((line, index) => {
    const match = parseCheckboxLine(line);
    if (!match) return;
    result.push({
      lineIndex: index,
      indent: match.indent,
      checked: match.checked,
      bracketText: match.bracketText,
    });
  });

  return result;
}

/** Texto visível no espelho — oculta a sintaxe `[ ]` / `[x]` mantendo largura. */
export function lineForDisplay(line: string): string {
  return line.replace(/\[([ xX])\]/, (match) => "\u00A0".repeat(match.length));
}

export function toggleCheckboxInContent(
  content: string,
  lineIndex: number,
): string {
  const lines = content.split("\n");
  const line = lines[lineIndex];
  if (!line) return content;

  const match = line.match(CHECKBOX_PATTERN);
  if (!match) return content;

  const nextMark = match[2].toLowerCase() === "x" ? " " : "x";
  lines[lineIndex] = line.replace(/\[([ xX])\]/, `[${nextMark}]`);

  return lines.join("\n");
}

export function cursorAfterToggle(
  content: string,
  lineIndex: number,
  previousCursor: number,
): number {
  const lines = content.split("\n");
  let offset = 0;
  for (let i = 0; i < lineIndex; i += 1) {
    offset += lines[i].length + 1;
  }
  const line = lines[lineIndex] ?? "";
  const relative = Math.max(0, previousCursor - offset);
  return offset + Math.min(relative, line.length);
}

export function checkboxLeftPx(
  indent: string,
  fontSize: number,
  paddingLeft: number,
): number {
  return paddingLeft + measureTextWidth(indent, fontSize);
}

const measureCanvas = document.createElement("canvas");

export function measureTextWidth(text: string, fontSize: number): number {
  const context = measureCanvas.getContext("2d");
  const normalized = expandTabs(text);
  if (!context) return normalized.length * fontSize * 0.55;
  context.font = `${fontSize}px Cascadia Code, Consolas, ui-monospace, monospace`;
  return context.measureText(normalized).width;
}

function expandTabs(text: string): string {
  let column = 0;
  let result = "";

  for (const char of text) {
    if (char === "\t") {
      const spaces = TAB_SIZE - (column % TAB_SIZE);
      result += " ".repeat(spaces);
      column += spaces;
      continue;
    }

    result += char;
    column += 1;
  }

  return result;
}
