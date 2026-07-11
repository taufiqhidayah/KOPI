"use client";

import { useSearchParams } from "next/navigation";

export function useCopilotEmbedParams() {
  const params = useSearchParams();
  const embed = params.get("embed") === "1";
  const prompt = params.get("prompt") ?? undefined;
  const viewParam = params.get("view");
  const view = viewParam === "barang_masuk_form" ? "barang_masuk_form" as const : "chat" as const;

  return { embed, prompt, view };
}
