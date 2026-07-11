"use client";

import { Suspense } from "react";
import { CopilotChat } from "@/components/copilot/Sidebar";
import { useCopilotEmbedParams } from "./useCopilotEmbedParams";

function CopilotEmbedContent() {
  const { embed, prompt, view } = useCopilotEmbedParams();

  return (
    <CopilotChat
      embedded={embed}
      initialView={view}
      initialPrompt={prompt}
      onBarangMasukSaved={() => {
        if (embed && typeof window !== "undefined" && window.parent !== window) {
          window.parent.postMessage({ type: "kopdes-copilot-saved" }, "*");
        }
      }}
    />
  );
}

export function CopilotEmbedClient() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-400">Memuat Copilot...</div>}>
      <CopilotEmbedContent />
    </Suspense>
  );
}
