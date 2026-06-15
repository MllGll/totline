interface HelpOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpOverlay({ visible, onClose }: HelpOverlayProps) {
  if (!visible) return null;

  const shortcuts = [
    ["Esc", "Minimize window"],
    ["Ctrl", "+", "Scroll", "Zoom"],
    ["Ctrl", "+", "0", "Reset zoom"],
    ["[ ]", "/ [x]", "Tasks"],
    ["*text*", "Bold"],
    ["*line", "Bold line"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/[0.18] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="help-panel w-[min(370px,calc(100vw-48px))] px-8 py-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tone-icon mx-auto grid h-8 w-8 place-items-center rounded-full border">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 19.5V5.2A2.2 2.2 0 0 1 6.2 3H20v16H6.2A2.2 2.2 0 0 0 4 21.2" />
            <path d="M8 7h8" />
            <path d="M8 11h6" />
          </svg>
        </div>

        <div className="mt-4 text-center">
          <h2 className="tone-title text-sm font-medium">Quick Help</h2>
          <p className="tone-copy-dim mt-1 text-[11px]">
            Minimal, persistent, always available.
          </p>
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
                        className="tone-key rounded-md border px-2 py-1 font-mono text-[10px]"
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

        <div className="tone-divider mt-7 border-t pt-5">
          <p className="tone-copy-dim text-[11px] leading-relaxed">
            One endless notebook. No files, no visible structure, just memory
            in text.
          </p>
          <p className="tone-copy-dim mt-3 text-[11px] leading-relaxed">
            Esc and the minimize button only move the window out of the way.
            The app keeps running in the background.
          </p>
        </div>

        <button
          onClick={onClose}
          className="tone-button mt-6 w-full rounded-full border px-4 py-2 text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
