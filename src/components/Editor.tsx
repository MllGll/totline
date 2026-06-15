import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { CheckboxOverlay } from "./CheckboxOverlay";
import { EditorMirror } from "./EditorMirror";
import {
  cursorAfterToggle,
  toggleCheckboxInContent,
} from "../lib/checkbox";

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
  cursor,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localScrollTop, setLocalScrollTop] = useState(scrollTop);
  const [localScrollLeft, setLocalScrollLeft] = useState(scrollLeft);
  const [editorWidth, setEditorWidth] = useState(0);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.scrollTop = scrollTop;
    textarea.scrollLeft = scrollLeft;
    textarea.setSelectionRange(selectionStart, selectionEnd);
    setLocalScrollTop(scrollTop);
    setLocalScrollLeft(scrollLeft);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || document.activeElement === textarea) return;
    textarea.setSelectionRange(selectionStart, selectionEnd);
  }, [selectionStart, selectionEnd]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setEditorWidth(container.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(event.target.value);
    onCursorChange(event.target.selectionStart);
    onSelectionChange(
      event.target.selectionStart,
      event.target.selectionEnd,
    );
  };

  const handleSelect = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    onCursorChange(textarea.selectionStart);
    onSelectionChange(textarea.selectionStart, textarea.selectionEnd);
  };

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    setLocalScrollTop(target.scrollTop);
    setLocalScrollLeft(target.scrollLeft);
    onScrollChange(target.scrollTop, target.scrollLeft);
  };

  const handleWheel = (event: React.WheelEvent<HTMLTextAreaElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    const next = clamp(zoom + delta, MIN_ZOOM, MAX_ZOOM);
    onZoomChange(Number(next.toFixed(2)));
    onZoomActivity();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      insertText("\t");
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "0") {
      event.preventDefault();
      onZoomChange(1);
      onZoomActivity();
    }
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next =
      content.slice(0, start) + text + content.slice(end);

    onContentChange(next);
    const cursorPos = start + text.length;
    requestAnimationFrame(() => {
      textarea.setSelectionRange(cursorPos, cursorPos);
      onCursorChange(cursorPos);
      onSelectionChange(cursorPos, cursorPos);
    });
  };

  const handleToggleCheckbox = useCallback(
    (lineIndex: number) => {
      const textarea = textareaRef.current;
      const previousCursor = textarea?.selectionStart ?? cursor;
      const nextContent = toggleCheckboxInContent(content, lineIndex);
      const nextCursor = cursorAfterToggle(
        nextContent,
        lineIndex,
        previousCursor,
      );

      onContentChange(nextContent);
      requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
        onCursorChange(nextCursor);
        onSelectionChange(nextCursor, nextCursor);
      });
    },
    [
      content,
      cursor,
      onContentChange,
      onCursorChange,
      onSelectionChange,
    ],
  );

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    insertText(text);
  };

  const fontSize = BASE_FONT_SIZE * zoom;
  const paddingY = headerVisible
    ? EDITOR_HEADER_PADDING_Y
    : EDITOR_PADDING_Y;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <EditorMirror
        content={content}
        zoom={zoom}
        fontSize={BASE_FONT_SIZE}
        lineHeight={LINE_HEIGHT}
        paddingX={EDITOR_PADDING_X}
        paddingY={paddingY}
        scrollTop={localScrollTop}
        scrollLeft={localScrollLeft}
      />

      <textarea
        ref={textareaRef}
        className="editor-textarea totline-scroll relative z-10 font-mono"
        value={content}
        spellCheck={false}
        placeholder="Comece a escrever…"
        onChange={handleChange}
        onSelect={handleSelect}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: LINE_HEIGHT,
          padding: `${paddingY}px ${EDITOR_PADDING_X}px`,
        }}
      />

      <CheckboxOverlay
        content={content}
        zoom={zoom}
        fontSize={BASE_FONT_SIZE}
        lineHeight={BASE_FONT_SIZE * LINE_HEIGHT}
        paddingTop={paddingY}
        paddingLeft={EDITOR_PADDING_X}
        editorWidth={editorWidth}
        scrollTop={localScrollTop}
        onToggle={handleToggleCheckbox}
      />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
