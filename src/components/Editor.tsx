import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import { history, historyKeymap, insertTab } from "@codemirror/commands";
import {
  EditorSelection,
  EditorState,
  type Extension,
  RangeSetBuilder,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  drawSelection,
  keymap,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import {
  findBoldRanges,
  hiddenSyntaxDeletion,
  parseCheckboxSyntax,
} from "../lib/editorSyntax";

interface EditorProps {
  content: string;
  zoom: number;
  cursor: number;
  selectionStart: number;
  selectionEnd: number;
  scrollTop: number;
  scrollLeft: number;
  headerVisible: boolean;
  onContentChange: (content: string) => void;
  onCursorChange: (cursor: number) => void;
  onSelectionChange: (start: number, end: number) => void;
  onScrollChange: (top: number, left: number) => void;
  onZoomChange: (zoom: number) => void;
  onZoomActivity: () => void;
}

const BASE_FONT_SIZE = 15;
const LINE_HEIGHT = 1.9;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const EDITOR_PADDING_X = 38;
const EDITOR_PADDING_Y = 44;
const EDITOR_HEADER_PADDING_Y = 78;

export function Editor({
  content,
  zoom,
  cursor: _cursor,
  selectionStart,
  selectionEnd,
  scrollTop,
  scrollLeft,
  headerVisible,
  onContentChange,
  onCursorChange,
  onSelectionChange,
  onScrollChange,
  onZoomChange,
  onZoomActivity,
}: EditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef({
    onContentChange,
    onCursorChange,
    onSelectionChange,
  });
  const scrollCallbackRef = useRef(onScrollChange);
  const zoomRef = useRef(zoom);
  const zoomCallbackRef = useRef({
    onZoomActivity,
    onZoomChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onContentChange,
      onCursorChange,
      onSelectionChange,
    };
    scrollCallbackRef.current = onScrollChange;
    zoomCallbackRef.current = {
      onZoomActivity,
      onZoomChange,
    };
  }, [
    onContentChange,
    onCursorChange,
    onSelectionChange,
    onScrollChange,
    onZoomActivity,
    onZoomChange,
  ]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const paddingY = headerVisible
    ? EDITOR_HEADER_PADDING_Y
    : EDITOR_PADDING_Y;
  const fontSize = BASE_FONT_SIZE * zoom;

  const extensions = useMemo(() => createExtensions(callbacksRef), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const state = EditorState.create({
      doc: content,
      selection: EditorSelection.range(selectionStart, selectionEnd),
      extensions,
    });
    const view = new EditorView({ state, parent: host });
    viewRef.current = view;

    requestAnimationFrame(() => {
      view.scrollDOM.scrollTop = scrollTop;
      view.scrollDOM.scrollLeft = scrollLeft;
    });

    const onScroll = () => {
      scrollCallbackRef.current(
        view.scrollDOM.scrollTop,
        view.scrollDOM.scrollLeft,
      );
    };

    const onZoomWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;

      event.preventDefault();
      event.stopPropagation();

      const delta = event.deltaY > 0 ? -0.05 : 0.05;
      const next = clamp(zoomRef.current + delta, MIN_ZOOM, MAX_ZOOM);
      const rounded = Number(next.toFixed(2));

      zoomRef.current = rounded;
      zoomCallbackRef.current.onZoomChange(rounded);
      zoomCallbackRef.current.onZoomActivity();
    };

    view.scrollDOM.addEventListener("scroll", onScroll, { passive: true });
    host.addEventListener("wheel", onZoomWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      view.scrollDOM.removeEventListener("scroll", onScroll);
      host.removeEventListener("wheel", onZoomWheel, { capture: true });
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current === content) return;

    view.dispatch({
      changes: { from: 0, to: current.length, insert: content },
    });
  }, [content]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.hasFocus) return;

    const selection = view.state.selection.main;
    if (
      selection.from === selectionStart &&
      selection.to === selectionEnd
    ) {
      return;
    }

    view.dispatch({
      selection: EditorSelection.range(selectionStart, selectionEnd),
    });
  }, [selectionStart, selectionEnd]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    requestAnimationFrame(() => {
      view.scrollDOM.scrollTop = scrollTop;
      view.scrollDOM.scrollLeft = scrollLeft;
    });
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.requestMeasure();
    const timeout = window.setTimeout(() => view.requestMeasure(), 240);
    return () => window.clearTimeout(timeout);
  }, [headerVisible]);

  return (
    <div
      ref={hostRef}
      className="cm-editor-host h-full w-full"
      style={
        {
          "--editor-font-size": `${fontSize}px`,
          "--editor-line-height": LINE_HEIGHT,
          "--editor-padding-x": `${EDITOR_PADDING_X}px`,
          "--editor-shift-y": `${paddingY}px`,
          "--editor-padding-bottom": `${EDITOR_PADDING_Y}px`,
          height: `calc(100% - ${paddingY}px)`,
          transform: `translateY(${paddingY}px)`,
          transition: "height 220ms ease, transform 220ms ease",
        } as React.CSSProperties
      }
    />
  );
}

function createExtensions(
  callbacksRef: React.MutableRefObject<{
    onContentChange: (content: string) => void;
    onCursorChange: (cursor: number) => void;
    onSelectionChange: (start: number, end: number) => void;
  }>,
): Extension[] {
  return [
    history(),
    drawSelection(),
    EditorView.lineWrapping,
    EditorState.tabSize.of(8),
    keymap.of([
      { key: "Tab", run: insertTab },
      { key: "Backspace", run: deleteHiddenSyntaxBeforeCursor },
      ...historyKeymap,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        callbacksRef.current.onContentChange(update.state.doc.toString());
      }

      if (update.selectionSet || update.docChanged) {
        const selection = update.state.selection.main;
        callbacksRef.current.onCursorChange(selection.head);
        callbacksRef.current.onSelectionChange(selection.from, selection.to);
      }
    }),
    EditorView.theme({
      "&": {
        height: "100%",
        width: "100%",
        background: "transparent",
        color: "rgb(var(--tone-rgb) / 0.9)",
        fontSize: "var(--editor-font-size)",
        fontWeight: "200",
      },
      ".cm-scroller": {
        fontFamily:
          "'JetBrains Mono', 'Cascadia Code', Consolas, ui-monospace, monospace",
        lineHeight: "var(--editor-line-height)",
        background: "transparent",
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgb(var(--tone-soft-rgb) / 0.36) transparent",
        padding: "0 var(--editor-padding-x)",
      },
      ".cm-content": {
        minHeight: "100%",
        padding: "0 0 var(--editor-padding-bottom)",
        caretColor: "rgb(var(--tone-rgb) / 0.98)",
      },
      ".cm-line": {
        padding: "0",
      },
      ".cm-focused": {
        outline: "none",
      },
      ".cm-cursor": {
        borderLeftColor: "rgb(var(--tone-rgb) / 0.98)",
        borderLeftWidth: "1px",
        boxShadow: "0 0 10px rgb(var(--tone-rgb) / 0.28)",
      },
      ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
        background: "rgb(var(--tone-accent-rgb) / 0.34)",
      },
      ".cm-bold-text": {
        color: "rgb(var(--tone-rgb) / 0.98)",
        fontWeight: "700",
      },
      ".cm-completed-text": {
        color: "rgb(var(--tone-soft-rgb) / 0.62)",
        textDecoration: "line-through",
        textDecorationColor: "rgb(var(--tone-soft-rgb) / 0.58)",
      },
      ".cm-checkbox-slot": {
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "0.72em",
        height: "calc(var(--editor-font-size) * var(--editor-line-height))",
        marginRight: "0.42em",
        verticalAlign: "top",
      },
      ".cm-checkbox-widget": {
        appearance: "none",
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "0.72em",
        height: "0.72em",
        padding: "0",
        borderRadius: "3px",
        border: "1px solid rgb(var(--tone-soft-rgb) / 0.46)",
        background: "rgb(var(--tone-accent-rgb) / 0.08)",
        color: "rgb(var(--tone-rgb) / 0.72)",
        backdropFilter: "blur(14px) saturate(1.08)",
        cursor: "pointer",
        font: "inherit",
        lineHeight: "0",
      },
      ".cm-checkbox-widget[data-checked='true']": {
        borderColor: "rgb(var(--tone-rgb) / 0.68)",
        background: "rgb(var(--tone-accent-rgb) / 0.18)",
        boxShadow:
          "inset 0 1px 0 rgb(var(--tone-rgb) / 0.24), 0 0 18px rgb(var(--tone-soft-rgb) / 0.12)",
      },
      ".cm-checkbox-widget svg": {
        display: "block",
        opacity: "0",
        transition: "opacity 120ms ease",
      },
      ".cm-checkbox-widget[data-checked='true'] svg": {
        opacity: "1",
      },
      ".cm-placeholder": {
        color: "var(--text-muted)",
      },
      ".cm-lineNumbers, .cm-gutters": {
        display: "none",
      },
    }),
    editorDecorations,
    placeholderExtension("Start writing..."),
  ];
}

const editorDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      decorateLine(builder, line.from, line.text);
      pos = line.to + 1;
      if (pos > view.state.doc.length) break;
    }
  }

  return builder.finish();
}

function decorateLine(
  builder: RangeSetBuilder<Decoration>,
  lineFrom: number,
  text: string,
) {
  const checkbox = parseCheckboxSyntax(text);
  const contentOffset = checkbox ? checkbox.contentFrom : 0;

  if (checkbox) {
    const checkboxFrom = lineFrom + checkbox.from;
    builder.add(
      checkboxFrom,
      lineFrom + checkbox.to,
      Decoration.replace({
        widget: new CheckboxWidget(checkbox.checked, checkboxFrom),
      }),
    );

    if (checkbox.checked) {
      builder.add(
        lineFrom + checkbox.contentFrom,
        lineFrom + text.length,
        Decoration.mark({ class: "cm-completed-text" }),
      );
    }
  }

  decorateBold(builder, lineFrom, text, contentOffset);
}

function decorateBold(
  builder: RangeSetBuilder<Decoration>,
  lineFrom: number,
  text: string,
  startAt: number,
) {
  for (const range of findBoldRanges(text, startAt)) {
    builder.add(
      lineFrom + range.markerFrom,
      lineFrom + range.markerFrom + 1,
      Decoration.replace({}),
    );
    if (range.textFrom < range.textTo) {
      builder.add(
        lineFrom + range.textFrom,
        lineFrom + range.textTo,
        Decoration.mark({ class: "cm-bold-text" }),
      );
    }
    if (range.markerTo !== undefined) {
      builder.add(
        lineFrom + range.markerTo,
        lineFrom + range.markerTo + 1,
        Decoration.replace({}),
      );
    }
  }
}

class CheckboxWidget extends WidgetType {
  constructor(
    private readonly checked: boolean,
    private readonly from: number,
  ) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked && other.from === this.from;
  }

  toDOM(view: EditorView) {
    const slot = document.createElement("span");
    slot.className = "cm-checkbox-slot";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cm-checkbox-widget";
    button.dataset.checked = String(this.checked);
    button.setAttribute(
      "aria-label",
      this.checked ? "Mark as pending" : "Mark as complete",
    );

    button.innerHTML =
      '<svg viewBox="0 0 12 12" width="55%" height="55%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.2 5 8.7 9.5 3.8"/></svg>';

    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      view.dispatch({
        changes: {
          from: this.from + 1,
          to: this.from + 2,
          insert: this.checked ? " " : "x",
        },
        selection: { anchor: this.from + 3 },
      });
      view.focus();
    });

    slot.appendChild(button);
    return slot;
  }

  ignoreEvent() {
    return false;
  }
}

function placeholderExtension(text: string): Extension {
  return EditorView.decorations.compute(["doc"], (state) => {
    if (state.doc.length > 0) return Decoration.none;
    return Decoration.set([
      Decoration.widget({
        widget: new PlaceholderWidget(text),
        side: 1,
      }).range(0),
    ]);
  });
}

class PlaceholderWidget extends WidgetType {
  constructor(private readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-placeholder";
    span.textContent = this.text;
    return span;
  }
}

function deleteHiddenSyntaxBeforeCursor(view: EditorView): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) return false;

  const head = selection.head;
  const line = view.state.doc.lineAt(selection.head);
  const deletion = hiddenSyntaxDeletion(line.text, head - line.from);
  if (deletion) {
    const from = line.from + deletion.from;
    view.dispatch({
      changes: { from, to: line.from + deletion.to },
      selection: { anchor: from },
    });
    return true;
  }

  return false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
