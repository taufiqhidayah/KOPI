"use client";

import { useMemo } from "react";

type CopilotEmbedPanelProps = {
  open: boolean;
  initialView?: "chat" | "barang_masuk_form";
  initialPrompt?: string;
};

export function CopilotEmbedPanel({
  open,
  initialView = "chat",
  initialPrompt,
}: CopilotEmbedPanelProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({ embed: "1" });
    if (initialPrompt) params.set("prompt", initialPrompt);
    if (initialView === "barang_masuk_form") params.set("view", "barang_masuk_form");
    return `/copilot?${params.toString()}`;
  }, [initialPrompt, initialView]);

  if (!open) return null;

  return (
    <aside className="flex h-full w-full min-w-[280px] max-w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-sm max-lg:fixed max-lg:inset-y-[85px] max-lg:right-0 max-lg:z-40 max-lg:w-[min(100%,360px)] lg:min-w-[360px]">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-emerald-700 px-4 py-2.5 text-white">
        <span className="text-lg" aria-hidden>🤖</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Kopdes Copilot</p>
          <p className="text-[10px] text-emerald-100">Asisten input data koperasi</p>
        </div>
      </div>
      <iframe
        key={src}
        src={src}
        title="Kopdes Copilot"
        className="min-h-0 flex-1 w-full border-0"
      />
    </aside>
  );
}
