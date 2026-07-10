"use client";

import { useState } from "react";

export type BotMessagePayload = {
  content: string;
  intent?: string;
  in_scope?: boolean;
  data?: Record<string, unknown>[];
  suggested_prompts?: string[];
  draft_surat?: string;
};

function formatValue(val: unknown): string {
  if (val == null) return "—";
  if (typeof val === "number") return val.toLocaleString("id-ID");
  return String(val);
}

function DataPreview({ data }: { data: Record<string, unknown>[] }) {
  const [open, setOpen] = useState(false);
  if (!data.length) return null;

  const preview = data.slice(0, 5);
  const label = data.length === 1 ? "1 hasil" : `${Math.min(5, data.length)} dari ${data.length} hasil`;

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs font-medium text-emerald-700"
      >
        {open ? "Sembunyikan" : `Lihat detail (${label})`}
      </button>
      {open && (
        <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
          {preview.map((row, i) => (
            <p key={i} className="border-b border-slate-100 py-1 last:border-0">
              {Object.entries(row)
                .slice(0, 4)
                .map(([k, v]) => `${k}: ${formatValue(v)}`)
                .join(" · ")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftPreview({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen(!open)} className="text-xs font-medium text-emerald-700">
        {open ? "Tutup surat" : "Lihat draft surat"}
      </button>
      {open && (
        <pre className="mt-1.5 max-h-36 overflow-y-auto whitespace-pre-wrap text-xs text-slate-500">
          {text.slice(0, 600)}
          {text.length > 600 ? "..." : ""}
        </pre>
      )}
    </div>
  );
}

type ChatMessageProps = {
  role: "user" | "bot";
  payload: BotMessagePayload | string;
  onSuggestionClick?: (text: string) => void;
  showSuggestions?: boolean;
};

export function ChatMessage({ role, payload, onSuggestionClick, showSuggestions }: ChatMessageProps) {
  const isUser = role === "user";
  const bot = typeof payload === "string" ? { content: payload } : payload;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] sm:max-w-[75%] ${isUser ? "" : "space-y-1"}`}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-br-sm bg-emerald-600 px-4 py-2.5 text-[15px] leading-relaxed text-white"
              : "rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[15px] leading-relaxed text-slate-800 shadow-sm"
          }
        >
          <p className="whitespace-pre-wrap break-words">{bot.content}</p>
          {!isUser && bot.draft_surat && <DraftPreview text={bot.draft_surat} />}
        </div>

        {!isUser && bot.data && bot.data.length > 0 && <DataPreview data={bot.data} />}

        {!isUser && showSuggestions && bot.suggested_prompts?.length && onSuggestionClick && (
          <div className="flex flex-wrap gap-1.5">
            {bot.suggested_prompts.slice(0, 7).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSuggestionClick(prompt)}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800 ring-1 ring-emerald-200/80"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
