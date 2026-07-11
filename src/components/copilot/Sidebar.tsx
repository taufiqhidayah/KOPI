"use client";

import { useEffect, useRef, useState } from "react";
import { getFeatureSuggestionPrompts, getWelcomeMessage } from "@/lib/copilot-scope";
import type { PendingBarangMasukDraft } from "@/lib/copilot-reply";
import { BarangMasukForm, type BarangMasukFormValues } from "./BarangMasukForm";
import { ChatMessage, type BotMessagePayload } from "./ChatMessage";
import { ConfirmDialog } from "./ConfirmDialog";
import { NotaQueuePanel, type NotaQueueEntry } from "./NotaQueuePanel";

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

type PendingBarangMasukItem = {
  produk_sample_id: string;
  jumlah_masuk: number;
  harga_beli: number;
  nama_produk?: string;
  nama_tampilan?: string;
  harga_jual?: number;
  keterangan?: string;
};

type PendingBarangMasuk = {
  tanggal_masuk: string;
  keterangan: string;
  items: PendingBarangMasukItem[];
  dokumentasiFile?: File;
  dokumentasi_nama?: string;
  dokumentasi_url?: string;
};

type PendingTambahProduk = {
  nama_produk: string;
  unit?: string;
  jumlah_masuk?: number;
  harga_beli?: number;
};

type PendingPengajuan = { kode_bank: string; nama_bank: string };

const STARTER_PROMPTS = getFeatureSuggestionPrompts();

type CopilotChatProps = {
  embedded?: boolean;
  onClose?: () => void;
  initialView?: "chat" | "barang_masuk_form";
  initialPrompt?: string;
  onBarangMasukSaved?: () => void;
};

export function CopilotChat({
  embedded = false,
  onClose,
  initialView = "chat",
  initialPrompt,
  onBarangMasukSaved,
}: CopilotChatProps) {
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
  const [showBarangMasukForm, setShowBarangMasukForm] = useState(initialView === "barang_masuk_form");
  const [pendingDokumentasiFile, setPendingDokumentasiFile] = useState<File | null>(null);
  const [notaQueue, setNotaQueue] = useState<NotaQueueEntry[]>([]);
  const [saveMultiNota, setSaveMultiNota] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialView === "barang_masuk_form") {
      setShowBarangMasukForm(true);
    }
  }, [initialView]);

  useEffect(() => {
    if (initialPrompt?.trim()) {
      runCommand(initialPrompt.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showBarangMasukForm]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const addBotMessage = (payload: BotMessagePayload) => {
    setMessages((prev) => [...prev, { role: "bot", payload }]);
  };

  const executeChat = async (
    command: string,
    options?: {
      silent?: boolean;
      pendingBarangMasuk?: PendingBarangMasukDraft | null;
      dokumentasiFile?: File | null;
    },
  ) => {
    if (!command.trim()) return;

    if (!options?.silent) {
      setMessages((prev) => [...prev, { role: "user", payload: command.trim() }]);
    }

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command,
        context: {
          user_id: "bendahara",
          user_role: "bendahara",
          pending_barang_masuk: options?.pendingBarangMasuk ?? pendingDraft ?? undefined,
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
      const docFile = options?.dokumentasiFile ?? pendingDokumentasiFile ?? undefined;
      setPendingBarangMasuk({
        tanggal_masuk: new Date().toISOString(),
        keterangan: payload.keterangan ?? "",
        items: [{
          produk_sample_id: payload.produk_sample_id,
          jumlah_masuk: payload.jumlah_masuk,
          harga_beli: payload.harga_beli,
          nama_produk: payload.nama_produk,
          nama_tampilan: payload.nama_tampilan,
          harga_jual: payload.harga_jual,
          keterangan: payload.keterangan,
        }],
        dokumentasiFile: docFile,
        dokumentasi_nama: payload.dokumentasi_nama,
        dokumentasi_url: payload.dokumentasi_url,
      });
      setConfirmOpen(true);
    } else if (data.action?.type === "show_barang_masuk_form") {
      setShowBarangMasukForm(true);
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

    if (data.action?.type === "upload_dokumentasi") {
      docInputRef.current?.click();
    }
  };

  const runCommand = async (command: string) => {
    if (!command.trim() || loading) return;

    const lower = command.toLowerCase().trim();
    if (/simpan semua nota|simpan semua|konfirmasi semua nota/i.test(lower)) {
      if (notaQueue.length === 0) {
        addBotMessage({ content: "Antrian nota masih kosong. Upload foto nota dulu lewat 📷." });
        return;
      }
      setSaveMultiNota(true);
      setConfirmOpen(true);
      return;
    }
    if (/kosongkan antrian|hapus antrian|batal antrian/i.test(lower)) {
      setNotaQueue([]);
      addBotMessage({ content: "Antrian nota dikosongkan." });
      return;
    }

    setLoading(true);
    try {
      await executeChat(command);
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

  const processNotaUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-note", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const items = data.extracted_data.items as ExtractedItem[];
    const unmatched = (data.unmatched_items ?? []) as { nama: string; qty: number }[];

    if (items.length > 0) {
      const entry: NotaQueueEntry = {
        id: `nota-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        supplier: data.extracted_data.supplier,
        tanggal: data.extracted_data.tanggal,
        total: Number(data.extracted_data.total),
        dokumentasi_url: data.image_url as string,
        items: items.map((item) => ({
          produk_sample_id: item.produk_sample_id,
          jumlah_masuk: item.qty,
          harga_beli: item.harga,
          nama_produk: item.nama,
        })),
        unmatched,
      };

      setNotaQueue((prev) => [...prev, entry]);
      addBotMessage({
        content: `Nota "${file.name}" ditambahkan ke antrian (${items.length} item dari ${data.extracted_data.supplier}).`,
        data: items.map((i) => ({ produk: i.nama, qty: i.qty, harga: i.harga })),
        suggested_prompts: ["Upload nota lagi", "Simpan semua nota"],
      });
      if (unmatched.length > 0) {
        addBotMessage({
          content: `${unmatched.length} item di nota ini belum ada di master: ${unmatched.map((u) => u.nama).join(", ")}.`,
        });
      }
    } else {
      addBotMessage({
        content: unmatched.length
          ? `Nota "${file.name}" — tidak ada item yang cocok. ${unmatched.length} item perlu ditambahkan ke master dulu.`
          : `Nota "${file.name}" — tidak ada item terbaca.`,
        data: unmatched.map((i) => ({ produk: i.nama, qty: i.qty, status: "belum terdaftar" })),
        suggested_prompts: ["Upload nota lain", "Tambah barang masuk"],
      });
    }
  };

  const handleFileUpload = async (file: File, mode: "nota" | "dokumentasi" = "nota") => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", payload: `📷 ${file.name}` }]);

    try {
      if (mode === "dokumentasi" && pendingDraft) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("produk_sample_id", pendingDraft.produk_sample_id);
        formData.append("nama_produk", pendingDraft.nama_produk);

        const res = await fetch("/api/upload-barang-masuk", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const enriched: PendingBarangMasukDraft = {
          ...pendingDraft,
          dokumentasi_nama: data.dokumentasi_nama as string,
          dokumentasi_url: data.dokumentasi_url as string,
        };

        if (data.ocr?.harga_beli && (!enriched.harga_beli || enriched.harga_beli <= 0)) {
          enriched.harga_beli = data.ocr.harga_beli;
        }
        if (data.ocr?.keterangan && !enriched.keterangan) {
          enriched.keterangan = data.ocr.keterangan;
        }

        setPendingDraft(enriched);
        setPendingDokumentasiFile(file);

        addBotMessage({ content: data.message ?? "Lampiran diterima." });
        await executeChat("dokumentasi terupload", {
          silent: true,
          pendingBarangMasuk: enriched,
          dokumentasiFile: file,
        });
        return;
      }

      await processNotaUpload(file);
    } catch (error) {
      addBotMessage({ content: error instanceof Error ? error.message : "Gagal memproses foto" });
    } finally {
      setLoading(false);
    }
  };

  const handleNotaFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length || loading) return;

    setLoading(true);
    setMessages((prev) => [
      ...prev,
      ...list.map((file) => ({ role: "user" as const, payload: `📷 ${file.name}` })),
    ]);

    try {
      for (const file of list) {
        await processNotaUpload(file);
      }
      if (list.length > 1) {
        addBotMessage({
          content: `Selesai memproses ${list.length} nota. Review antrian di bawah, lalu tap Simpan semua.`,
          suggested_prompts: ["Simpan semua nota", "Upload nota lagi"],
        });
      }
    } catch (error) {
      addBotMessage({ content: error instanceof Error ? error.message : "Gagal memproses foto" });
    } finally {
      setLoading(false);
    }
  };

  const saveAllNotaQueue = async () => {
    const queue = notaQueue;
    if (!queue.length) return;

    const summaries: string[] = [];
    for (const nota of queue) {
      const res = await fetch("/api/barang-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal_masuk: nota.tanggal,
          keterangan: nota.supplier,
          items: nota.items,
          dokumentasi_url: nota.dokumentasi_url,
          confirmed_by: "bendahara",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? `Gagal simpan ${nota.fileName}`);
      summaries.push(`${nota.supplier}: ${nota.items.length} item`);
    }

    const totalItems = queue.reduce((s, n) => s + n.items.length, 0);
    addBotMessage({
      content: `✅ ${queue.length} nota tersimpan (${totalItems} item). ${summaries.join(" · ")}`,
    });
    setNotaQueue([]);
    setSaveMultiNota(false);
    onBarangMasukSaved?.();
  };

  const handleBarangMasukFormSubmit = (values: BarangMasukFormValues) => {
    setPendingBarangMasuk({
      tanggal_masuk: new Date().toISOString(),
      keterangan: "",
      items: [{
        produk_sample_id: values.produk_sample_id,
        jumlah_masuk: values.jumlah_masuk,
        harga_beli: values.harga_beli,
        harga_jual: values.harga_jual > 0 ? values.harga_jual : undefined,
        nama_produk: values.nama_produk,
        nama_tampilan: values.nama_tampilan,
        keterangan: values.keterangan,
      }],
      dokumentasiFile: values.dokumentasi,
      dokumentasi_nama: values.dokumentasi?.name,
    });
    setShowBarangMasukForm(false);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      if (saveMultiNota) {
        await saveAllNotaQueue();
      } else if (pendingBarangMasuk) {
        let res: Response;
        if (pendingBarangMasuk.dokumentasiFile && !pendingBarangMasuk.dokumentasi_url) {
          const formData = new FormData();
          formData.append("tanggal_masuk", pendingBarangMasuk.tanggal_masuk);
          formData.append("keterangan", pendingBarangMasuk.keterangan);
          formData.append("confirmed_by", "bendahara");
          formData.append("items", JSON.stringify(pendingBarangMasuk.items));
          formData.append("dokumentasi", pendingBarangMasuk.dokumentasiFile);
          res = await fetch("/api/barang-masuk", { method: "POST", body: formData });
        } else {
          res = await fetch("/api/barang-masuk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tanggal_masuk: pendingBarangMasuk.tanggal_masuk,
              keterangan: pendingBarangMasuk.keterangan,
              items: pendingBarangMasuk.items,
              dokumentasi_url: pendingBarangMasuk.dokumentasi_url,
              dokumentasi_nama: pendingBarangMasuk.dokumentasi_nama,
              confirmed_by: "bendahara",
            }),
          });
        }
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        addBotMessage({ content: data.message ?? "Berhasil disimpan." });
        setPendingBarangMasuk(null);
        setPendingDraft(null);
        setPendingDokumentasiFile(null);
        onBarangMasukSaved?.();
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
    setSaveMultiNota(false);
    setPendingBarangMasuk(null);
    setPendingTambahProduk(null);
    setPendingPengajuan(null);
    setPendingDraft(null);
    setPendingTambahProdukDraft(null);
    setPendingDokumentasiFile(null);
    addBotMessage({ content: "Oke, dibatalkan." });
  };

  const confirmTitle = saveMultiNota
    ? `Simpan ${notaQueue.length} nota sekaligus?`
    : pendingTambahProduk
    ? "Tambah produk baru?"
    : pendingBarangMasuk
      ? "Simpan barang masuk?"
      : "Simpan pengajuan rekening?";

  const confirmDescription = saveMultiNota
    ? `${notaQueue.reduce((s, n) => s + n.items.length, 0)} item dari ${notaQueue.length} nota akan masuk ke SIMKOPDES.`
    : "Data akan masuk ke SIMKOPDES.";

  const confirmPreview = (pendingTambahProduk ?? pendingBarangMasuk ?? pendingPengajuan) as Record<string, unknown> | null;

  const lastBotIndex = messages.map((m) => m.role).lastIndexOf("bot");

  return (
    <div className={`flex flex-col bg-[#e5ddd5] ${embedded ? "h-full" : "h-dvh"}`}>
      {!embedded && (
      <header className="shrink-0 bg-emerald-700 px-4 py-3 text-white shadow-sm">
        <div className={`mx-auto flex items-center gap-3 ${embedded ? "w-full" : "max-w-2xl"}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg">🤖</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold">Kopdes Copilot</h1>
            <p className="text-xs text-emerald-100">{loading ? "mengetik..." : "online"}</p>
          </div>
          {embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg hover:bg-white/25"
              aria-label="Tutup chat"
            >
              ×
            </button>
          )}
        </div>
      </header>
      )}

      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <div className={`mx-auto flex flex-col gap-2 ${embedded ? "w-full" : "max-w-2xl"}`}>
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

      {notaQueue.length > 0 && !showBarangMasukForm && (
        <div className="shrink-0 border-t border-slate-200/60 bg-[#f0f0f0] px-3 py-3">
          <div className={`mx-auto ${embedded ? "w-full" : "max-w-2xl"}`}>
            <NotaQueuePanel
              queue={notaQueue}
              loading={loading || confirmLoading}
              onRemove={(id) => setNotaQueue((prev) => prev.filter((n) => n.id !== id))}
              onSaveAll={() => {
                setSaveMultiNota(true);
                setConfirmOpen(true);
              }}
              onClear={() => {
                setNotaQueue([]);
                addBotMessage({ content: "Antrian nota dikosongkan." });
              }}
            />
          </div>
        </div>
      )}

      {showBarangMasukForm && (
        <div className="shrink-0 border-t border-slate-200/60 bg-[#f0f0f0] px-3 py-3">
          <div className={`mx-auto ${embedded ? "w-full" : "max-w-2xl"}`}>
            <BarangMasukForm
              loading={loading || confirmLoading}
              onSubmit={handleBarangMasukFormSubmit}
              onCancel={() => setShowBarangMasukForm(false)}
            />
          </div>
        </div>
      )}

      <footer className="shrink-0 border-t border-slate-200/60 bg-[#f0f0f0] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className={`mx-auto flex items-end gap-2 ${embedded ? "w-full" : "max-w-2xl"}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files?.length) return;
              if (pendingDraft) {
                handleFileUpload(files[0], "dokumentasi");
              } else if (files.length > 1) {
                handleNotaFiles(files);
              } else {
                handleFileUpload(files[0], "nota");
              }
              e.target.value = "";
            }}
          />

          <input
            ref={docInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf,.jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, "dokumentasi");
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
        description={confirmDescription}
        preview={saveMultiNota ? { nota: notaQueue.length, item: notaQueue.reduce((s, n) => s + n.items.length, 0) } : confirmPreview}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={confirmLoading}
      />
    </div>
  );
}
