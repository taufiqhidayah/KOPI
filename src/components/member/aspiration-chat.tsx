"use client";

import { useEffect, useRef, useState } from "react";
import type { AspirationCategory } from "@/lib/mock-data";
import type {
  AspirationDetail,
  ChatApiErrorBody,
  ChatHistoryItem,
  MemberChatResponse,
} from "@/lib/ai-types";
import { categoryLabels, cooperativeInfo, currentMember } from "@/lib/mock-data";

interface PendingDraft {
  title?: string;
  summary?: string;
  details: AspirationDetail[];
  category: AspirationCategory;
}

interface ChatMessage {
  id: string;
  role: "system" | "user";
  text: string;
  time: string;
  detectedCategory?: AspirationCategory;
  isDraft?: boolean;
  isSubmitted?: boolean;
  title?: string;
  summary?: string;
  details?: AspirationDetail[];
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createWelcomeMessages(): ChatMessage[] {
  const time = formatTime(new Date());
  return [
    {
      id: "welcome-1",
      role: "system",
      text: "Selamat datang di Layanan Aspirasi SIMKOPDES. Ceritakan keperluan Anda — saya akan membantu mencatat usulan, keluhan, atau pertanyaan seputar koperasi.",
      time,
    },
    {
      id: "welcome-2",
      role: "system",
      text: "Anda bisa langsung mengetik. Saya akan bertanya lanjutan jika masih perlu detail. Sebelum dicatat, Anda akan diminta memeriksa dan mengonfirmasi data.",
      time,
    },
  ];
}

function buildHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages
    .filter((m) => !m.id.startsWith("welcome"))
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
}

function formatChatError(data: ChatApiErrorBody): string {
  if (data.error) return data.error;
  if (data.code === "quota_exceeded") {
    return "Kuota harian layanan AI sudah habis. Coba lagi besok atau hubungi pengurus koperasi.";
  }
  if (data.code === "rate_limited" && data.retryAfterSeconds) {
    return `Layanan AI sibuk. Tunggu sekitar ${data.retryAfterSeconds} detik lalu kirim ulang pesan Anda.`;
  }
  return "Maaf, asisten sementara tidak tersedia. Silakan coba lagi.";
}

export function AspirationChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(createWelcomeMessages);
  const [draft, setDraft] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [aspirationSubmitted, setAspirationSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, followUps, isLoading, showConfirmation, aspirationSubmitted]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading || aspirationSubmitted) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setFollowUps([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: buildHistory(messages),
          memberName: currentMember.name,
          memberId: currentMember.memberId,
          cooperativeName: cooperativeInfo.name,
          cooperativeCode: cooperativeInfo.code,
          village: cooperativeInfo.village,
          pendingDraft: pendingDraft ?? undefined,
        }),
      });

      const data = (await response.json()) as MemberChatResponse & ChatApiErrorBody;

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-error-${Date.now()}`,
            role: "system",
            text: formatChatError(data),
            time: formatTime(new Date()),
          },
        ]);
        return;
      }

      const detectedCategory =
        data.category !== "belum_jelas" ? data.category : undefined;

      const replyMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: "system",
        text: data.reply,
        time: formatTime(new Date()),
        detectedCategory,
        isDraft: data.status === "complete",
        title: data.title,
        summary: data.summary,
        details: data.details,
      };

      setMessages((prev) => [...prev, replyMessage]);

      if (data.status === "complete" && detectedCategory) {
        setPendingDraft({
          title: data.title,
          summary: data.summary,
          details: data.details,
          category: detectedCategory,
        });
        setShowConfirmation(true);
        setFollowUps([]);
      } else {
        setShowConfirmation(false);
        setFollowUps(data.followUps);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-error-${Date.now()}`,
          role: "system",
          text: "Maaf, koneksi ke asisten terputus. Periksa internet Anda lalu coba kirim ulang pesan.",
          time: formatTime(new Date()),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleConfirmSubmit() {
    if (!pendingDraft) return;

    setMessages((prev) =>
      prev.map((m) => (m.isDraft ? { ...m, isDraft: false, isSubmitted: true } : m)),
    );

    setMessages((prev) => [
      ...prev,
      {
        id: `system-confirmed-${Date.now()}`,
        role: "system",
        text: `Terima kasih, ${currentMember.name.split(" ")[0]}. Aspirasi Anda telah dicatat dan diteruskan ke pengurus ${cooperativeInfo.name}. Pantau perkembangan di tab Riwayat.`,
        time: formatTime(new Date()),
        detectedCategory: pendingDraft.category,
        isSubmitted: true,
      },
    ]);

    setPendingDraft(null);
    setShowConfirmation(false);
    setFollowUps([]);
    setAspirationSubmitted(true);
  }

  function handleRequestRevision() {
    setShowConfirmation(false);
    setMessages((prev) => [
      ...prev.map((m) => (m.isDraft ? { ...m, isDraft: false } : m)),
      {
        id: `system-revise-${Date.now()}`,
        role: "system",
        text: "Baik, silakan jelaskan bagian mana yang perlu diperbaiki — misalnya lokasi, modal, atau manfaat usaha. Saya akan memperbarui ringkasan aspirasi Anda.",
        time: formatTime(new Date()),
      },
    ]);
    inputRef.current?.focus();
  }

  function handleNewConversation() {
    setMessages(createWelcomeMessages());
    setDraft("");
    setFollowUps([]);
    setPendingDraft(null);
    setShowConfirmation(false);
    setAspirationSubmitted(false);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(draft);
  }

  const headerStatus = aspirationSubmitted
    ? " · Tercatat"
    : showConfirmation
      ? " · Menunggu konfirmasi"
      : isLoading
        ? " · Mengetik..."
        : "";

  return (
    <div className="animate-fade-in flex h-[calc(100vh-9.5rem)] flex-col overflow-hidden rounded-2xl border border-sim-border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-sim-border bg-sim-primary px-4 py-3 text-white">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
          AI
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">Asisten Koperasi Desa</p>
          <p className="text-[11px] text-white/80">
            SIMKOPDES · {cooperativeInfo.village}
            {headerStatus}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sim-bg px-3 py-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {isLoading && <TypingIndicator />}

        {!isLoading && followUps.length > 0 && !aspirationSubmitted && (
          <FollowUpChips
            options={followUps}
            onSelect={(option) => void sendMessage(option)}
          />
        )}

        {showConfirmation && pendingDraft && !aspirationSubmitted && !isLoading && (
          <ConfirmationPanel
            draft={pendingDraft}
            onConfirm={handleConfirmSubmit}
            onRevise={handleRequestRevision}
          />
        )}

        {aspirationSubmitted && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-800">
              Aspirasi berhasil dicatat
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Pantau status keputusan pengurus di tab Riwayat.
            </p>
            <button
              type="button"
              onClick={handleNewConversation}
              className="mt-3 rounded-full bg-sim-primary px-4 py-2 text-xs font-semibold text-white hover:bg-sim-primary-dark"
            >
              Mulai percakapan baru
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-sim-border bg-white px-3 py-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend(e);
              }
            }}
            placeholder={
              aspirationSubmitted
                ? "Percakapan selesai — mulai baru untuk aspirasi lain"
                : pendingDraft && !showConfirmation
                  ? "Jelaskan bagian yang perlu diperbaiki..."
                  : "Ceritakan usulan, keluhan, atau pertanyaan Anda..."
            }
            rows={1}
            disabled={isLoading || aspirationSubmitted}
            className="max-h-24 min-h-[42px] flex-1 resize-none rounded-2xl border border-sim-border bg-sim-bg px-4 py-2.5 text-sm text-sim-ink placeholder:text-sim-muted focus:border-sim-primary focus:ring-1 focus:ring-sim-primary focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isLoading || aspirationSubmitted}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-sim-primary text-white transition-colors hover:bg-sim-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Kirim pesan"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmationPanel({
  draft,
  onConfirm,
  onRevise,
}: {
  draft: PendingDraft;
  onConfirm: () => void;
  onRevise: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">
        Periksa data aspirasi Anda
      </p>
      <p className="mt-1 text-xs text-amber-800">
        Pastikan ringkasan di atas sudah benar sebelum dicatat ke pengurus.
      </p>

      <div className="mt-3 rounded-xl border border-amber-200/80 bg-white p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-sim-primary">
          {categoryLabels[draft.category]} · Draft
        </p>
        {draft.title && (
          <p className="mt-1 text-xs font-bold text-sim-ink">{draft.title}</p>
        )}
        {draft.details.length > 0 && (
          <dl className="mt-2 space-y-1">
            {draft.details.map((item) => (
              <div key={item.label} className="text-xs">
                <dt className="font-semibold text-sim-ink">{item.label}</dt>
                <dd className="text-sim-muted">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-full bg-sim-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-sim-primary-dark"
        >
          Ya, data sudah benar
        </button>
        <button
          type="button"
          onClick={onRevise}
          className="flex-1 rounded-full border border-sim-border bg-white px-4 py-2.5 text-xs font-semibold text-sim-ink hover:bg-sim-bg"
        >
          Ada yang perlu diperbaiki
        </button>
      </div>
    </div>
  );
}

function FollowUpChips({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (option: string) => void;
}) {
  return (
    <div className="pt-1">
      <p className="mb-2 text-[11px] font-semibold text-sim-muted uppercase tracking-wide">
        Balasan cepat
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className="rounded-full border border-sim-primary/25 bg-white px-3 py-2 text-left text-xs font-medium text-sim-primary transition-colors hover:border-sim-primary hover:bg-sim-primary/5"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md border border-sim-border bg-white px-4 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-sim-muted [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sim-muted [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sim-muted [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function CompletionCard({
  title,
  summary,
  details,
}: {
  title?: string;
  summary?: string;
  details?: AspirationDetail[];
}) {
  if (!title && !summary && (!details || details.length === 0)) return null;

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-sim-border bg-sim-bg-muted p-3">
      {title && <p className="text-xs font-bold text-sim-primary">{title}</p>}
      {details && details.length > 0 && (
        <dl className="space-y-1.5">
          {details.map((item) => (
            <div key={item.label} className="text-xs">
              <dt className="font-semibold text-sim-ink">{item.label}</dt>
              <dd className="mt-0.5 leading-relaxed text-sim-muted">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {summary && (
        <p className="border-t border-sim-border pt-2 text-xs leading-relaxed text-sim-muted">
          {summary}
        </p>
      )}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  const statusLabel = message.isSubmitted
    ? "Tercatat"
    : message.isDraft
      ? "Menunggu Konfirmasi"
      : message.detectedCategory
        ? "Ditinjau"
        : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? "rounded-br-md bg-sim-primary text-white"
            : "rounded-bl-md border border-sim-border bg-white text-sim-ink"
        }`}
      >
        {!isUser && message.detectedCategory && statusLabel && (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-sim-primary">
            {categoryLabels[message.detectedCategory]} · {statusLabel}
          </p>
        )}
        <p className="text-sm leading-relaxed">{message.text}</p>
        {!isUser && message.isDraft && (
          <CompletionCard
            title={message.title}
            summary={message.summary}
            details={message.details}
          />
        )}
        <p
          className={`mt-1 text-[10px] ${isUser ? "text-white/70" : "text-sim-muted"}`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
