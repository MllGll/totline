interface HelpOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpOverlay({ visible, onClose }: HelpOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-md rounded-2xl bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-light text-zinc-100">TOTLINE</h2>
        <div className="space-y-3 text-sm text-zinc-400">
          <p>Um editor de texto minimalista com estética de vidro líquido.</p>
          <div className="space-y-1 pt-4">
            <p className="font-medium text-zinc-300">Atalhos:</p>
            <p className="text-xs">Esc - Minimizar janela</p>
            <p className="text-xs">Ctrl + Scroll - Zoom</p>
            <p className="text-xs">Ctrl + 0 - Resetar zoom</p>
            <p className="text-xs">[ ] - Checkbox (marcar/desmarcar)</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
