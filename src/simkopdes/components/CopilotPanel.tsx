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
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 lg:bg-black/20"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl sm:max-w-lg">
        <CopilotChat
          key={initialPrompt ?? "copilot"}
          embedded
          onClose={onClose}
          initialView={initialView}
          initialPrompt={initialPrompt}
          onBarangMasukSaved={onBarangMasukSaved}
        />
      </aside>
    </>
  );
}
