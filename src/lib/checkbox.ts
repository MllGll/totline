const CHECKBOX_PATTERN = /^(\s*)(?:-\s*)?\[([ xX])\]\s*/;

export interface CheckboxLine {
  lineIndex: number;
  indent: string;
  checked: boolean;
  hasDash: boolean;
}

export function parseCheckboxLines(content: string): CheckboxLine[] {
  const lines = content.split("\n");
  const result: CheckboxLine[] = [];

  lines.forEach((line, index) => {
    const match = line.match(CHECKBOX_PATTERN);
    if (!match) return;
    result.push({
      lineIndex: index,
      indent: match[1],
      checked: match[2].toLowerCase() === "x",
      hasDash: /^\s*-\s*\[/.test(line),
    });
  });

  return result;
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
