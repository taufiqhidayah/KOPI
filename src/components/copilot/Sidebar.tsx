"use client";

import { useEffect, useRef, useState } from "react";
import { getFeatureSuggestionPrompts, getWelcomeMessage } from "@/lib/copilot-scope";
import { ChatMessage, type BotMessagePayload } from "./ChatMessage";
import { ConfirmDialog } from "./ConfirmDialog";

type Message = {
  role: "user" | "bot";
  payload: BotMessagePayload | string;
};

type ExtractedItem = {
  produk_sample_id: string;
  nama: string;
  qty: number;
  harga: number;
};

type PendingBarangMasukDraft = {
  produk_sample_id: string;
  nama_produk: string;
  jumlah_masuk: number;
  harga_beli: number;
  unit?: string;
  stok_sekarang?: number;
};

type PendingBarangMasuk = {
  tanggal_masuk: string;
  keterangan: string;
  items: { produk_sample_id: string; jumlah_masuk: number; harga_beli: number; nama_produk?: string }[];
};

type PendingTambahProduk = {
  nama_produk: string;
  unit?: string;
  jumlah_masuk?: number;
  harga_beli?: number;
};

type PendingPengajuan = { kode_bank: string; nama_bank: string };

const STARTER_PROMPTS = getFeatureSuggestionPrompts();

export function CopilotChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      payload: {
        content: getWelcomeMessage(),
        suggested_prompts: STARTER_PROMPTS,
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<PendingBarangMasukDraft | null>(null);
  const [pendingTambahProdukDraft, setPendingTambahProdukDraft] = useState<PendingTambahProduk | null>(null);
  const [pendingBarangMasuk, setPendingBarangMasuk] = useState<PendingBarangMasuk | null>(null);
  const [pendingTambahProduk, setPendingTambahProduk] = useState<PendingTambahProduk | null>(null);
  const [pendingPengajuan, setPendingPengajuan] = useState<PendingPengajuan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const addBotMessage = (payload: BotMessagePayload) => {
    setMessages((prev) => [...prev, { role: "bot", payload }]);
  };

  const runCommand = async (command: string) => {
    if (!command.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", payload: command.trim() }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          context: {
            user_id: "bendahara",
            user_role: "bendahara",
            pending_barang_masuk: pendingDraft ?? undefined,
            pending_tambah_produk: pendingTambahProdukDraft ?? undefined,
          },
        }),
      });
      const data = await res.json();

      if (!data.success && data.error) throw new Error(data.error);

      const showSuggestions = Boolean(data.suggested_prompts?.length);

      addBotMessage({
        content: data.summary,
        intent: data.intent,
        in_scope: data.in_scope,
        data: data.data?.length ? data.data : undefined,
        draft_surat: data.draft_surat,
        suggested_prompts: showSuggestions ? (data.suggested_prompts ?? STARTER_PROMPTS).slice(0, 7) : undefined,
      });

      if (data.pending_barang_masuk) {
        setPendingDraft(data.pending_barang_masuk);
      } else if (data.intent === "barang_masuk") {
        setPendingDraft(null);
      }

      if (data.pending_tambah_produk) {
        setPendingTambahProdukDraft(data.pending_tambah_produk);
      } else if (data.intent === "tambah_produk" && !data.pending_tambah_produk) {
        setPendingTambahProdukDraft(null);
      }

      if (data.action?.type === "confirm_barang_masuk") {
        const payload = data.action.payload as PendingBarangMasukDraft;
        setPendingBarangMasuk({
          tanggal_masuk: new Date().toISOString(),
          keterangan: "Input via chat",
          items: [{
            produk_sample_id: payload.produk_sample_id,
            jumlah_masuk: payload.jumlah_masuk,
            harga_beli: payload.harga_beli,
            nama_produk: payload.nama_produk,
          }],
        });
        setConfirmOpen(true);
      } else if (data.action?.type === "confirm_tambah_produk") {
        const payload = data.action.payload as PendingTambahProduk;
        setPendingTambahProduk(payload);
        setPendingBarangMasuk(null);
        setPendingPengajuan(null);
        setConfirmOpen(true);
      } else if (data.action?.type === "confirm_pengajuan") {
        setPendingPengajuan({
          kode_bank: data.action.payload.kode_bank,
          nama_bank: data.action.payload.nama_bank,
        });
        setConfirmOpen(true);
      }

      if (data.action?.type === "upload_nota") {
        fileInputRef.current?.click();
      }
    } catch (error) {
      addBotMessage({
        content: error instanceof Error ? error.message : "Terjadi kesalahan",
        suggested_prompts: STARTER_PROMPTS,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async () => {
    if (!input.trim() || loading) return;
    const command = input.trim();
    setInput("");
    await runCommand(command);
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", payload: `📷 ${file.name}` }]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-note", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const items = data.extracted_data.items as ExtractedItem[];

      if (items.length > 0) {
        setPendingBarangMasuk({
          tanggal_masuk: data.extracted_data.tanggal,
          keterangan: data.extracted_data.supplier,
          items: items.map((item) => ({
            produk_sample_id: item.produk_sample_id,
            jumlah_masuk: item.qty,
            harga_beli: item.harga,
            nama_produk: item.nama,
          })),
        });
        setConfirmOpen(true);
      }

      addBotMessage({
        content: items.length
          ? `${data.matched_products} item dari ${data.extracted_data.supplier} — total Rp${Number(data.extracted_data.total).toLocaleString("id-ID")}. Sudah benar?`
          : "Tidak ada item yang cocok dengan master produk koperasi.",
        data: items.length
          ? items.map((i) => ({ produk: i.nama, qty: i.qty, harga: i.harga }))
          : data.unmatched_items?.map((i: { nama: string; qty: number }) => ({ produk: i.nama, qty: i.qty, status: "belum terdaftar" })),
      });

      if (data.unmatched_items?.length) {
        addBotMessage({
          content: `${data.unmatched_items.length} item belum ada di master. Bisa ditambahkan lewat chat (sebut nama + jumlah) atau form Tambah Produk di SIMKOPDES.`,
          suggested_prompts: ["Sudah tambah produk, lanjut barang masuk", "Upload foto nota lain"],
        });
      }
      setConfirmOpen(true);
    } catch (error) {
      addBotMessage({ content: error instanceof Error ? error.message : "Gagal memproses foto" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      if (pendingBarangMasuk) {
        const res = await fetch("/api/barang-masuk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingBarangMasuk, confirmed_by: "bendahara" }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        addBotMessage({ content: data.message ?? "Berhasil disimpan." });
        setPendingBarangMasuk(null);
        setPendingDraft(null);
      } else if (pendingTambahProduk) {
        const res = await fetch("/api/produk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama_produk: pendingTambahProduk.nama_produk,
            unit: pendingTambahProduk.unit,
            jumlah_masuk: pendingTambahProduk.jumlah_masuk,
            harga_beli: pendingTambahProduk.harga_beli ?? 0,
            confirmed_by: "bendahara",
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        addBotMessage({ content: data.message ?? "Produk berhasil ditambahkan." });
        setPendingTambahProduk(null);
        setPendingTambahProdukDraft(null);
      } else if (pendingPengajuan) {
        const res = await fetch("/api/pengajuan-rekening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingPengajuan, submit: true }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        addBotMessage({ content: "Pengajuan rekening tersimpan." });
        setPendingPengajuan(null);
      }
    } catch (error) {
      addBotMessage({ content: error instanceof Error ? error.message : "Gagal menyimpan" });
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    setPendingBarangMasuk(null);
    setPendingTambahProduk(null);
    setPendingPengajuan(null);
    setPendingDraft(null);
    setPendingTambahProdukDraft(null);
    addBotMessage({ content: "Oke, dibatalkan." });
  };

  const confirmTitle = pendingTambahProduk
    ? "Tambah produk baru?"
    : pendingBarangMasuk
      ? "Simpan barang masuk?"
      : "Simpan pengajuan rekening?";

  const confirmPreview = (pendingTambahProduk ?? pendingBarangMasuk ?? pendingPengajuan) as Record<string, unknown> | null;

  const lastBotIndex = messages.map((m) => m.role).lastIndexOf("bot");

  return (
    <div className="flex h-dvh flex-col bg-[#e5ddd5]">
      <header className="shrink-0 bg-emerald-700 px-4 py-3 text-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg">🤖</div>
          <div>
            <h1 className="text-base font-semibold">Kopdes Copilot</h1>
            <p className="text-xs text-emerald-100">{loading ? "mengetik..." : "online"}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              payload={msg.payload}
              onSuggestionClick={runCommand}
              showSuggestions={msg.role === "bot" && i === lastBotIndex && !loading}
            />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="shrink-0 border-t border-slate-200/60 bg-[#f0f0f0] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-200/60 disabled:opacity-40"
            aria-label="Upload foto nota"
          >
            📷
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendCommand();
              }
            }}
            placeholder="Ketik pesan..."
            disabled={loading}
            rows={1}
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-base shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 sm:text-[15px]"
          />

          <button
            type="button"
            onClick={sendCommand}
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white disabled:bg-slate-300"
            aria-label="Kirim"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </footer>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description="Data akan masuk ke SIMKOPDES."
        preview={confirmPreview}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={confirmLoading}
      />
    </div>
  );
}
