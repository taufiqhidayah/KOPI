"use client";

type CopilotFabProps = {
  onClick: () => void;
  open?: boolean;
};

export function CopilotFab({ onClick, open }: CopilotFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 ${
        open ? "bg-slate-600 hover:bg-slate-700" : "bg-emerald-700 hover:bg-emerald-800"
      }`}
      aria-label={open ? "Tutup Kopdes Copilot" : "Buka Kopdes Copilot"}
    >
      <span className="text-base" aria-hidden>🤖</span>
      <span>{open ? "Tutup Copilot" : "Copilot"}</span>
    </button>
  );
}
