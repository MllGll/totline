import { useEffect, useRef } from "react";
import { Astroid, BookOpen } from "lucide-react";

interface HelpOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpOverlay({ visible, onClose }: HelpOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      panelRef.current?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  const shortcuts = [
    ["Ctrl", "+", "? / \u00b0", "Show/hide help"],
    ["Esc", "Minimize window"],
    ["Ctrl", "+", "Scroll", "Zoom"],
    ["Ctrl", "+", "0", "Reset zoom"],
    ["[ ]", "/", "[x]", "Styled Checkbox"],
    ["*text*", "Bold"],
    ["*line", "Bold line"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="help-panel w-[min(370px,calc(100vw-48px))] px-8 py-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="help-mark mx-auto grid h-10 w-10 place-items-center rounded-full">
          <BookOpen className="h-5 w-5" />
        </div>

        <div className="mt-4 text-center">
          <h2 id="help-title" className="tone-title text-sm font-medium">
            Keyboard Shortcuts
          </h2>
        </div>

        <div className="mt-7 space-y-3">
          {shortcuts.map((shortcut, index) => {
            const label = shortcut[shortcut.length - 1];
            const keys = shortcut.slice(0, -1);

            return (
              <div
                key={index}
                className="tone-copy flex items-center justify-between gap-5 text-[12px]"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  {keys.map((key, keyIndex) =>
                    key === "+" || key.startsWith("/") ? (
                      <span
                        key={`${key}-${keyIndex}`}
                        className="tone-copy-dim"
                      >
                        {key}
                      </span>
                    ) : (
                      <kbd
                        key={`${key}-${keyIndex}`}
                        className="tone-key rounded-md border px-2 py-1 text-[10px]"
                      >
                        {key}
                      </kbd>
                    ),
                  )}
                </div>
                <span className="tone-copy-dim shrink-0">{label}</span>
              </div>
            );
          })}
        </div>

        <div className="tone-divider mt-7 border-t pt-5"></div>

        <div className="flex items-start">
          <div className="tone-copy mt-1 mr-2">
            <Astroid className="h-4 w-4" />
          </div>
          <p className="tone-copy-dim text-[12px] leading-relaxed">
            Esc and Minimize only move the window out of the way. Close hides
            the window to the background while keeping the app running.
          </p>
        </div>
      </div>
    </div>
  );
}
