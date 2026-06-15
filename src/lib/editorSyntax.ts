export interface CheckboxSyntax {
  indent: string;
  checked: boolean;
  from: number;
  to: number;
  contentFrom: number;
}

export interface BoldRange {
  markerFrom: number;
  markerTo?: number;
  textFrom: number;
  textTo: number;
  lineBold: boolean;
}

export type HiddenSyntax =
  | { type: "bold"; from: number; to: number }
  | { type: "checkbox"; from: number; to: number };

export function parseCheckboxSyntax(text: string): CheckboxSyntax | null {
  const match = text.match(/^(\s*)\[([ xX])\]/);
  if (!match) return null;

  const from = match[1].length;
  return {
    indent: match[1],
    checked: match[2].toLowerCase() === "x",
    from,
    to: from + 3,
    contentFrom: from + 3,
  };
}

export function findFirstContentIndex(text: string, startAt: number): number {
  for (let index = startAt; index < text.length; index += 1) {
    if (!/\s/.test(text[index])) return index;
  }
  return -1;
}

export function findBoldRanges(text: string, startAt = 0): BoldRange[] {
  const ranges: BoldRange[] = [];
  const firstContentIndex = findFirstContentIndex(text, startAt);

  if (firstContentIndex !== -1 && text[firstContentIndex] === "*") {
    const close = text.indexOf("*", firstContentIndex + 1);
    if (close === -1) {
      ranges.push({
        markerFrom: firstContentIndex,
        textFrom: firstContentIndex + 1,
        textTo: text.length,
        lineBold: true,
      });
      return ranges;
    }
  }

  let cursor = startAt;
  while (cursor < text.length) {
    const open = text.indexOf("*", cursor);
    if (open === -1) break;

    const close = text.indexOf("*", open + 1);
    if (close === -1) break;

    ranges.push({
      markerFrom: open,
      markerTo: close,
      textFrom: open + 1,
      textTo: close,
      lineBold: false,
    });
    cursor = close + 1;
  }

  return ranges;
}

export function isHiddenBoldMarker(text: string, relative: number): boolean {
  return findBoldRanges(text).some(
    (range) => relative === range.markerFrom || relative === range.markerTo,
  );
}

export function hiddenSyntaxDeletion(
  lineText: string,
  relativeCursor: number,
): HiddenSyntax | null {
  const previousIndex = relativeCursor - 1;
  const nextIndex = relativeCursor;

  if (
    previousIndex >= 0 &&
    lineText[previousIndex] === "*" &&
    isHiddenBoldMarker(lineText, previousIndex)
  ) {
    return { type: "bold", from: previousIndex, to: relativeCursor };
  }

  if (
    nextIndex < lineText.length &&
    lineText[nextIndex] === "*" &&
    isHiddenBoldMarker(lineText, nextIndex)
  ) {
    return { type: "bold", from: nextIndex, to: nextIndex + 1 };
  }

  const beforeCursor = lineText.slice(0, relativeCursor);
  if (/(^|\s)\[([ xX])\]$/.test(beforeCursor)) {
    return {
      type: "checkbox",
      from: relativeCursor - 1,
      to: relativeCursor,
    };
  }

  const nextChar = lineText[relativeCursor] ?? "";
  const throughNext = lineText.slice(0, relativeCursor + 1);
  if (nextChar === "]" && /(^|\s)\[([ xX])\]$/.test(throughNext)) {
    return {
      type: "checkbox",
      from: relativeCursor,
      to: relativeCursor + 1,
    };
  }

  return null;
}
