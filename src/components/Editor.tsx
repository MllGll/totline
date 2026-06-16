import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
const LINE_HEIGHT = 1.6;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const EDITOR_PADDING_X = 80;
const EDITOR_PADDING_Y = 40;
const EDITOR_HEADER_PADDING_Y = 80;
const MIN_SCROLLBAR_THUMB_HEIGHT = 36;

interface ScrollbarMetrics {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
}

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
  const dragRef = useRef<{
    pointerId: number;
    startScrollTop: number;
    startY: number;
  } | null>(null);
  const scrollbarActivityTimerRef = useRef<number | null>(null);
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
  const [scrollbarMetrics, setScrollbarMetrics] = useState<ScrollbarMetrics>({
    clientHeight: 1,
    scrollHeight: 1,
    scrollTop: 0,
  });
  const [scrollbarActive, setScrollbarActive] = useState(false);
  const [appFocused, setAppFocused] = useState(() => document.hasFocus());

  const showScrollbarActivity = () => {
    setScrollbarActive(true);

    if (scrollbarActivityTimerRef.current !== null) {
      window.clearTimeout(scrollbarActivityTimerRef.current);
    }

    scrollbarActivityTimerRef.current = window.setTimeout(() => {
      setScrollbarActive(false);
      scrollbarActivityTimerRef.current = null;
    }, 700);
  };

  const clearScrollbarActivity = () => {
    setScrollbarActive(false);

    if (scrollbarActivityTimerRef.current !== null) {
      window.clearTimeout(scrollbarActivityTimerRef.current);
      scrollbarActivityTimerRef.current = null;
    }
  };

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

  useEffect(() => {
    const onFocus = () => setAppFocused(true);
    const onBlur = () => {
      setAppFocused(false);
      clearScrollbarActivity();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const paddingY = headerVisible
    ? EDITOR_HEADER_PADDING_Y
    : EDITOR_PADDING_Y;
  const fontSize = BASE_FONT_SIZE * zoom;
  const maxScrollTop = Math.max(
    0,
    scrollbarMetrics.scrollHeight - scrollbarMetrics.clientHeight,
  );
  const scrollbarVisible = maxScrollTop > 1;
  const scrollbarThumbHeight = scrollbarVisible
    ? Math.max(
        MIN_SCROLLBAR_THUMB_HEIGHT,
        (scrollbarMetrics.clientHeight / scrollbarMetrics.scrollHeight) *
          scrollbarMetrics.clientHeight,
      )
    : 0;
  const scrollbarThumbTop = scrollbarVisible
    ? (scrollbarMetrics.scrollTop / maxScrollTop) *
      (scrollbarMetrics.clientHeight - scrollbarThumbHeight)
    : 0;
  const showTopScrollEdge = scrollbarMetrics.scrollTop > 1;
  const showBottomScrollEdge =
    scrollbarVisible && maxScrollTop - scrollbarMetrics.scrollTop > 1;

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
      updateScrollbarMetrics(view.scrollDOM, setScrollbarMetrics);
    });

    const onScroll = () => {
      scrollCallbackRef.current(
        view.scrollDOM.scrollTop,
        view.scrollDOM.scrollLeft,
      );
      updateScrollbarMetrics(view.scrollDOM, setScrollbarMetrics);
      showScrollbarActivity();
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
      if (scrollbarActivityTimerRef.current !== null) {
        window.clearTimeout(scrollbarActivityTimerRef.current);
        scrollbarActivityTimerRef.current = null;
      }
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
    requestAnimationFrame(() => {
      updateScrollbarMetrics(view.scrollDOM, setScrollbarMetrics);
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
      updateScrollbarMetrics(view.scrollDOM, setScrollbarMetrics);
    });
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.requestMeasure();
    updateScrollbarMetrics(view.scrollDOM, setScrollbarMetrics);
    const timeout = window.setTimeout(() => {
      view.requestMeasure();
      updateScrollbarMetrics(view.scrollDOM, setScrollbarMetrics);
    }, 240);
    return () => window.clearTimeout(timeout);
  }, [headerVisible]);

  const onScrollbarPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const view = viewRef.current;
    if (!view || !scrollbarVisible) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startScrollTop: view.scrollDOM.scrollTop,
      startY: event.clientY,
    };
    showScrollbarActivity();
  };

  const onScrollbarPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const view = viewRef.current;
    const drag = dragRef.current;
    if (!view || !drag || drag.pointerId !== event.pointerId) return;

    const trackRange = scrollbarMetrics.clientHeight - scrollbarThumbHeight;
    if (trackRange <= 0) return;

    const deltaY = event.clientY - drag.startY;
    view.scrollDOM.scrollTop =
      drag.startScrollTop + (deltaY / trackRange) * maxScrollTop;
    showScrollbarActivity();
  };

  const onScrollbarPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      showScrollbarActivity();
    }
  };

  return (
    <div
      className={[
        "cm-editor-host relative h-full w-full",
        showTopScrollEdge ? "cm-editor-host-top-fade" : "",
        showBottomScrollEdge ? "cm-editor-host-bottom-fade" : "",
      ].join(" ")}
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
    >
      <div ref={hostRef} className="cm-editor-mount h-full w-full" />
      {scrollbarVisible ? (
        <div className="editor-scrollbar" aria-hidden="true">
          <div
            className={[
              "editor-scrollbar-thumb",
              appFocused ? "editor-scrollbar-thumb-focused" : "",
              scrollbarActive ? "editor-scrollbar-thumb-active" : "",
            ].join(" ")}
            onPointerDown={onScrollbarPointerDown}
            onPointerMove={onScrollbarPointerMove}
            onPointerUp={onScrollbarPointerUp}
            onPointerCancel={onScrollbarPointerUp}
            style={{
              height: `${scrollbarThumbHeight}px`,
              transform: `translateY(${scrollbarThumbTop}px)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function updateScrollbarMetrics(
  element: HTMLElement,
  setMetrics: React.Dispatch<React.SetStateAction<ScrollbarMetrics>>,
) {
  const next = {
    clientHeight: Math.max(1, element.clientHeight),
    scrollHeight: Math.max(1, element.scrollHeight),
    scrollTop: element.scrollTop,
  };

  setMetrics((current) => {
    if (
      current.clientHeight === next.clientHeight &&
      current.scrollHeight === next.scrollHeight &&
      current.scrollTop === next.scrollTop
    ) {
      return current;
    }

    return next;
  });
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
        overscrollBehavior: "contain",
        scrollBehavior: "smooth",
        scrollbarWidth: "none",
        scrollbarColor: "transparent transparent",
        padding: "0 var(--editor-padding-x)",
      },
      ".cm-scroller::-webkit-scrollbar": {
        display: "none",
        width: "0",
        height: "0",
      },
      ".cm-scroller::-webkit-scrollbar-button": {
        appearance: "none",
        background: "transparent",
        backgroundColor: "transparent",
        backgroundImage: "none",
        border: "0",
        display: "none",
        minWidth: "0",
        minHeight: "0",
        width: "0 !important",
        height: "0 !important",
      },
      ".cm-scroller::-webkit-scrollbar-button:single-button, .cm-scroller::-webkit-scrollbar-button:double-button": {
        appearance: "none",
        background: "transparent",
        backgroundColor: "transparent",
        backgroundImage: "none",
        border: "0",
        display: "none",
        minWidth: "0",
        minHeight: "0",
        width: "0 !important",
        height: "0 !important",
      },
      ".cm-scroller::-webkit-scrollbar-button:vertical, .cm-scroller::-webkit-scrollbar-button:horizontal": {
        appearance: "none",
        background: "transparent",
        backgroundColor: "transparent",
        backgroundImage: "none",
        border: "0",
        display: "none",
        minWidth: "0",
        minHeight: "0",
        width: "0 !important",
        height: "0 !important",
      },
      ".cm-scroller::-webkit-scrollbar-button:start, .cm-scroller::-webkit-scrollbar-button:end": {
        appearance: "none",
        background: "transparent",
        backgroundColor: "transparent",
        backgroundImage: "none",
        border: "0",
        display: "none",
        minWidth: "0",
        minHeight: "0",
        width: "0 !important",
        height: "0 !important",
      },
      ".cm-scroller::-webkit-scrollbar-button:increment, .cm-scroller::-webkit-scrollbar-button:decrement": {
        appearance: "none",
        background: "transparent",
        backgroundColor: "transparent",
        backgroundImage: "none",
        border: "0",
        display: "none",
        minWidth: "0",
        minHeight: "0",
        width: "0 !important",
        height: "0 !important",
      },
      ".cm-scroller::-webkit-scrollbar-track": {
        background: "transparent",
      },
      ".cm-scroller::-webkit-scrollbar-thumb": {
        minHeight: "56px",
        border: "var(--editor-scrollbar-inset) solid transparent",
        borderRadius: "999px",
        background:
          "linear-gradient(180deg, rgb(var(--palette-edge-rgb) / 0.36), rgb(var(--tone-soft-rgb) / 0.22)) padding-box",
        boxShadow:
          "inset 0 1px 0 rgb(var(--tone-rgb) / 0.14), 0 0 18px rgb(var(--palette-edge-rgb) / 0.08)",
      },
      ".cm-scroller:not(:hover):not(:focus-within)::-webkit-scrollbar-thumb": {
        background:
          "linear-gradient(180deg, rgb(var(--palette-edge-rgb) / 0.18), rgb(var(--tone-soft-rgb) / 0.1)) padding-box",
        boxShadow: "none",
      },
      ".cm-scroller::-webkit-scrollbar-thumb:hover": {
        background:
          "linear-gradient(180deg, rgb(var(--palette-edge-rgb) / 0.58), rgb(var(--tone-rgb) / 0.38)) padding-box",
        boxShadow:
          "inset 0 1px 0 rgb(var(--tone-rgb) / 0.22), 0 0 22px rgb(var(--palette-edge-rgb) / 0.14)",
      },
      ".cm-scroller::-webkit-scrollbar-corner": {
        background: "transparent",
      },
      ".cm-content": {
        minHeight: "100%",
        padding: "0 0 var(--editor-padding-bottom)",
        caretColor: "rgb(var(--tone-rgb) / 0.98)",
      },
      ".cm-line": {
        padding: "0",
      },
      "&.cm-focused, .cm-content:focus": {
        outline: "0 solid transparent",
        outlineColor: "transparent",
        outlineWidth: "0",
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
