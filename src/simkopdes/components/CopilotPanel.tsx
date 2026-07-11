"use client";

import { CopilotChat } from "@/components/copilot/Sidebar";

type CopilotPanelProps = {
  open: boolean;
  onClose: () => void;
  initialView?: "chat" | "barang_masuk_form";
  initialPrompt?: string;
  onBarangMasukSaved?: () => void;
};

export function CopilotPanel({
  open,
  onClose,
  initialView = "chat",
  initialPrompt,
  onBarangMasukSaved,
}: CopilotPanelProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-title"
      className="fixed bottom-20 right-4 left-4 z-50 flex h-[min(72dvh,600px)] max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-sm:bottom-[4.5rem] sm:left-auto sm:w-[min(100vw-2rem,380px)] md:h-[min(78dvh,680px)] md:w-[400px] lg:w-[420px]"
    >
      <CopilotChat
        key={`${initialView}-${initialPrompt ?? "copilot"}`}
        embedded
        onClose={onClose}
        initialView={initialView}
        initialPrompt={initialPrompt}
        onBarangMasukSaved={onBarangMasukSaved}
      />
    </div>
  );
}
