"use client";

import { useEffect, useRef, useState } from "react";
import { getFeatureSuggestionPrompts, getWelcomeMessage } from "@/lib/copilot-scope";
import type { PendingBarangMasukDraft } from "@/lib/copilot-reply";
import type { ChatAction } from "@/lib/copilot";
import { buildCrudConfirmView, isCrudConfirmAction } from "@/lib/crud-confirm";
import { BarangMasukForm, type BarangMasukFormValues } from "./BarangMasukForm";
import { ChatMessage, type BotMessagePayload } from "./ChatMessage";
import { ConfirmDialog } from "./ConfirmDialog";
import { NotaQueuePanel, type NotaQueueEntry } from "./NotaQueuePanel";
import { TambahProdukEditForm } from "./TambahProdukEditForm";
import {
  applyMetaToNotaUnmatched,
  buildNotaSavePreviewFields,
  buildNotaUnmatchedFollowUp,
  findFirstIncompleteUnmatched,
  isNotaUnmatchedComplete,
  prefillNotaUnmatched,
  type NotaUnmatchedDraft,
} from "@/lib/nota-queue";

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
  unit?: string;
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
  kategori?: string;
  jenis_barang?: string;
  potensi_desa?: string;
  penyedia?: string;
};

type PendingPengajuan = { kode_bank: string; nama_bank: string; preview?: Record<string, unknown> };

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
  const [pendingPengajuanDraft, setPendingPengajuanDraft] = useState<{
    kode_bank: string;
    nama_bank: string;
    preview: Record<string, unknown>;
    draft_surat: string;
  } | null>(null);
  const [pendingCrudAction, setPendingCrudAction] = useState<ChatAction | null>(null);
  const [showBarangMasukForm, setShowBarangMasukForm] = useState(initialView === "barang_masuk_form");
  const [barangMasukFormInitial, setBarangMasukFormInitial] = useState<Partial<BarangMasukFormValues> | null>(null);
  const [showTambahProdukEdit, setShowTambahProdukEdit] = useState(false);
  const [confirmAfterEdit, setConfirmAfterEdit] = useState<"chat" | "modal" | null>(null);
  const [pendingDokumentasiFile, setPendingDokumentasiFile] = useState<File | null>(null);
  const [notaQueue, setNotaQueue] = useState<NotaQueueEntry[]>([]);
  const [saveMultiNota, setSaveMultiNota] = useState(false);
  const [pendingNotaMetaReply, setPendingNotaMetaReply] = useState<{ notaId: string; itemIndex: number } | null>(null);
  const [showNotaUnmatchedEdit, setShowNotaUnmatchedEdit] = useState(false);
  const [notaEditTarget, setNotaEditTarget] = useState<{ notaId: string; itemIndex: number } | null>(null);
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

  const updateNotaUnmatched = (notaId: string, itemIndex: number, draft: NotaUnmatchedDraft) => {
    setNotaQueue((prev) => prev.map((nota) => {
      if (nota.id !== notaId) return nota;
      const unmatched = [...nota.unmatched];
      unmatched[itemIndex] = { ...draft, reviewed: isNotaUnmatchedComplete(draft) };
      return { ...nota, unmatched };
    }));
  };

  const openNotaUnmatchedEdit = (notaId: string, itemIndex: number) => {
    setNotaEditTarget({ notaId, itemIndex });
    setShowNotaUnmatchedEdit(true);
    setPendingNotaMetaReply(null);
  };

  const beginNotaSave = () => {
    if (!notaQueue.length) {
      addBotMessage({ content: "Antrian nota masih kosong. Upload foto nota dulu lewat 📷." });
      return;
    }

    const incomplete = findFirstIncompleteUnmatched(notaQueue);
    if (incomplete) {
      setPendingNotaMetaReply({ notaId: incomplete.notaId, itemIndex: incomplete.itemIndex });
      addBotMessage({
        content: buildNotaUnmatchedFollowUp(incomplete.draft),
        suggested_prompts: [
          "penyedia Toko Makmur, satuan tabung",
          "kategori Kebutuhan Rumah Tangga, penyedia UD Sumber",
        ],
      });
      return;
    }

    setSaveMultiNota(true);
    setConfirmOpen(true);
  };

  const handleNotaUnmatchedEditSubmit = (values: {
    nama_produk: string;
    unit: string;
    jumlah_masuk?: number;
    harga_beli?: number;
    kategori?: string;
    jenis_barang?: string;
    potensi_desa?: string;
    penyedia?: string;
  }) => {
    if (!notaEditTarget) return;

    const current = notaQueue.find((n) => n.id === notaEditTarget.notaId)?.unmatched[notaEditTarget.itemIndex];
    if (!current) return;

    const updated: NotaUnmatchedDraft = {
      ...current,
      nama: values.nama_produk,
      unit: values.unit,
      qty: values.jumlah_masuk ?? current.qty,
      harga: values.harga_beli ?? current.harga,
      kategori: values.kategori,
      jenis_barang: values.jenis_barang,
      potensi_desa: values.potensi_desa,
      penyedia: values.penyedia,
      reviewed: true,
    };

    updateNotaUnmatched(notaEditTarget.notaId, notaEditTarget.itemIndex, updated);
    setShowNotaUnmatchedEdit(false);

    const targetNotaId = notaEditTarget.notaId;
    const targetItemIndex = notaEditTarget.itemIndex;
    setNotaEditTarget(null);

    const mergedQueue = notaQueue.map((n) => {
      if (n.id !== targetNotaId) return n;
      const unmatched = [...n.unmatched];
      unmatched[targetItemIndex] = updated;
      return { ...n, unmatched };
    });

    const nextIncomplete = findFirstIncompleteUnmatched(mergedQueue);

    if (nextIncomplete) {
      setPendingNotaMetaReply({ notaId: nextIncomplete.notaId, itemIndex: nextIncomplete.itemIndex });
      addBotMessage({
        content: buildNotaUnmatchedFollowUp(nextIncomplete.draft),
        suggested_prompts: ["penyedia Toko Makmur", "Simpan semua nota"],
      });
      return;
    }

    addBotMessage({
      content: `Data "${updated.nama}" sudah lengkap. Review lalu konfirmasi simpan nota.`,
      suggested_prompts: ["Simpan semua nota"],
    });
    setSaveMultiNota(true);
    setConfirmOpen(true);
  };

  const addBotMessage = (payload: BotMessagePayload) => {
    setMessages((prev) => [...prev, { role: "bot", payload }]);
  };

  const applyCrudAction = (action: ChatAction, options?: { dokumentasiFile?: File | null }) => {
    if (action.type === "confirm_barang_masuk") {
      const payload = action.payload;
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
          unit: payload.unit,
        }],
        dokumentasiFile: docFile,
        dokumentasi_nama: payload.dokumentasi_nama,
        dokumentasi_url: payload.dokumentasi_url,
      });
      setPendingTambahProduk(null);
      setPendingPengajuan(null);
    } else if (action.type === "confirm_tambah_produk") {
      setPendingTambahProduk(action.payload);
      setPendingBarangMasuk(null);
      setPendingPengajuan(null);
    } else if (action.type === "confirm_pengajuan") {
      setPendingPengajuan({
        kode_bank: action.payload.kode_bank,
        nama_bank: action.payload.nama_bank,
        preview: action.payload.preview,
      });
      setPendingBarangMasuk(null);
      setPendingTambahProduk(null);
    }
    setPendingCrudAction(action);
  };

  const showConfirmAfterEdit = (action: ChatAction, via: "chat" | "modal") => {
    applyCrudAction(action);
    if (via === "chat") {
      addBotMessage({
        content: "Data diperbarui. Periksa lagi sebelum simpan.",
        crud_confirm: buildCrudConfirmView(action) ?? undefined,
      });
    } else {
      setConfirmOpen(true);
    }
  };

  const openBarangMasukEdit = (via: "chat" | "modal") => {
    const draft = pendingCrudAction?.type === "confirm_barang_masuk"
      ? pendingCrudAction.payload
      : null;
    const item = pendingBarangMasuk?.items[0];

    const source = draft ?? (item ? {
      produk_sample_id: item.produk_sample_id,
      nama_produk: item.nama_produk ?? "",
      nama_tampilan: item.nama_tampilan,
      jumlah_masuk: item.jumlah_masuk,
      harga_beli: item.harga_beli,
      harga_jual: item.harga_jual,
      unit: pendingDraft?.unit,
      keterangan: item.keterangan ?? pendingBarangMasuk?.keterangan,
      dokumentasi_nama: pendingBarangMasuk?.dokumentasi_nama,
    } : null);

    if (!source) return;

    setBarangMasukFormInitial({
      produk_sample_id: source.produk_sample_id,
      nama_produk: source.nama_produk,
      nama_tampilan: source.nama_tampilan ?? source.nama_produk,
      jumlah_masuk: source.jumlah_masuk,
      unit: source.unit ?? "",
      harga_beli: source.harga_beli,
      harga_jual: source.harga_jual ?? 0,
      keterangan: source.keterangan ?? "",
      dokumentasi: pendingDokumentasiFile ?? pendingBarangMasuk?.dokumentasiFile ?? undefined,
    });
    setConfirmAfterEdit(via);
    setConfirmOpen(false);
    setPendingCrudAction(null);
    setShowTambahProdukEdit(false);
    setShowBarangMasukForm(true);
  };

  const openTambahProdukEdit = (via: "chat" | "modal") => {
    if (!pendingTambahProduk) return;
    setConfirmAfterEdit(via);
    setConfirmOpen(false);
    setPendingCrudAction(null);
    setShowBarangMasukForm(false);
    setShowTambahProdukEdit(true);
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
          pending_pengajuan: pendingPengajuanDraft ?? undefined,
        },
      }),
    });
    const data = await res.json();

    if (!data.success && data.error) throw new Error(data.error);

    const showSuggestions = Boolean(data.suggested_prompts?.length);
    const crudConfirm = isCrudConfirmAction(data.action)
      ? buildCrudConfirmView(data.action!)
      : null;

    addBotMessage({
      content: data.summary,
      intent: data.intent,
      in_scope: data.in_scope,
      data: data.data?.length ? data.data : undefined,
      report: data.report,
      draft_surat: data.draft_surat,
      suggested_prompts: showSuggestions ? (data.suggested_prompts ?? STARTER_PROMPTS).slice(0, 7) : undefined,
      crud_confirm: crudConfirm ?? undefined,
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

    if (data.pending_pengajuan) {
      setPendingPengajuanDraft(data.pending_pengajuan);
    } else if (data.intent === "pengajuan_rekening" && !data.pending_pengajuan) {
      setPendingPengajuanDraft(null);
    }

    if (isCrudConfirmAction(data.action)) {
      applyCrudAction(data.action!, {
        dokumentasiFile: options?.dokumentasiFile ?? pendingDokumentasiFile,
      });
    } else if (data.action?.type === "show_barang_masuk_form") {
      setShowBarangMasukForm(true);
      setPendingCrudAction(null);
    } else if (data.action?.type === "upload_nota") {
      fileInputRef.current?.click();
      setPendingCrudAction(null);
    } else if (data.action?.type === "upload_dokumentasi") {
      docInputRef.current?.click();
      setPendingCrudAction(null);
    } else {
      setPendingCrudAction(null);
    }
  };

  const runCommand = async (command: string) => {
    if (!command.trim() || loading) return;

    const lower = command.toLowerCase().trim();
    if (/simpan semua nota|simpan semua|konfirmasi semua nota/i.test(lower)) {
      beginNotaSave();
      return;
    }
    if (/kosongkan antrian|hapus antrian|batal antrian/i.test(lower)) {
      setNotaQueue([]);
      setPendingNotaMetaReply(null);
      setShowNotaUnmatchedEdit(false);
      setNotaEditTarget(null);
      addBotMessage({ content: "Antrian nota dikosongkan." });
      return;
    }

    if (pendingNotaMetaReply) {
      const nota = notaQueue.find((n) => n.id === pendingNotaMetaReply.notaId);
      const current = nota?.unmatched[pendingNotaMetaReply.itemIndex];
      if (!current) {
        setPendingNotaMetaReply(null);
      } else {
        setMessages((prev) => [...prev, { role: "user", payload: command.trim() }]);
        const updated = applyMetaToNotaUnmatched(current, command);
        updateNotaUnmatched(pendingNotaMetaReply.notaId, pendingNotaMetaReply.itemIndex, updated);

        if (!isNotaUnmatchedComplete(updated)) {
          addBotMessage({
            content: buildNotaUnmatchedFollowUp(updated),
            suggested_prompts: ["penyedia Toko Makmur, satuan tabung", "Edit lewat tombol di antrian"],
          });
          return;
        }

        setPendingNotaMetaReply(null);
        const refreshed = notaQueue.map((n) => {
          if (n.id !== pendingNotaMetaReply.notaId) return n;
          const unmatched = [...n.unmatched];
          unmatched[pendingNotaMetaReply.itemIndex] = updated;
          return { ...n, unmatched };
        });
        const nextIncomplete = findFirstIncompleteUnmatched(refreshed);
        if (nextIncomplete) {
          setPendingNotaMetaReply({ notaId: nextIncomplete.notaId, itemIndex: nextIncomplete.itemIndex });
          addBotMessage({
            content: buildNotaUnmatchedFollowUp(nextIncomplete.draft),
            suggested_prompts: ["penyedia Toko Makmur", "Simpan semua nota"],
          });
          return;
        }

        addBotMessage({
          content: "Semua produk baru sudah lengkap. Review lalu konfirmasi simpan nota.",
          suggested_prompts: ["Simpan semua nota"],
        });
        setSaveMultiNota(true);
        setConfirmOpen(true);
        return;
      }
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
    const unmatched = (data.unmatched_items ?? []) as { nama: string; qty: number; harga: number }[];
    const supplier = data.extracted_data.supplier as string | undefined;

    if (items.length > 0 || unmatched.length > 0) {
      const entry: NotaQueueEntry = {
        id: `nota-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        supplier: supplier ?? "",
        tanggal: data.extracted_data.tanggal,
        total: Number(data.extracted_data.total),
        dokumentasi_url: data.image_url as string,
        items: items.map((item) => ({
          produk_sample_id: item.produk_sample_id,
          jumlah_masuk: item.qty,
          harga_beli: item.harga,
          nama_produk: item.nama,
        })),
        unmatched: unmatched.map((item) => prefillNotaUnmatched(item.nama, item.qty, item.harga, supplier)),
      };

      setNotaQueue((prev) => [...prev, entry]);
      const readyCount = items.length;
      const pendingCount = unmatched.length;
      const needsMeta = entry.unmatched.some((u) => !isNotaUnmatchedComplete(u));
      addBotMessage({
        content: readyCount > 0
          ? `Nota "${file.name}" masuk antrian (${readyCount} item cocok master${pendingCount ? `, ${pendingCount} produk baru perlu dilengkapi` : ""}).`
          : `Nota "${file.name}" masuk antrian (${pendingCount} produk baru perlu dilengkapi).`,
        data: [
          ...items.map((i) => ({ produk: i.nama, qty: i.qty, harga: i.harga, status: "cocok master" })),
          ...entry.unmatched.map((i) => ({
            produk: i.nama,
            qty: i.qty,
            harga: i.harga,
            status: isNotaUnmatchedComplete(i) ? "siap konfirmasi" : "perlu lengkapi",
          })),
        ],
        suggested_prompts: needsMeta
          ? ["penyedia Toko Makmur, satuan tabung", "Simpan semua nota"]
          : ["Simpan semua nota", "Upload nota lagi"],
      });

      const firstIncomplete = entry.unmatched.find((u) => !isNotaUnmatchedComplete(u));
      if (firstIncomplete) {
        const itemIndex = entry.unmatched.indexOf(firstIncomplete);
        setPendingNotaMetaReply({ notaId: entry.id, itemIndex });
        addBotMessage({ content: buildNotaUnmatchedFollowUp(firstIncomplete) });
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

    const incomplete = findFirstIncompleteUnmatched(queue);
    if (incomplete) {
      throw new Error(`Lengkapi data "${incomplete.draft.nama}" sebelum simpan.`);
    }

    const summaries: string[] = [];
    const createdProducts: string[] = [];
    for (const nota of queue) {
      const res = await fetch("/api/barang-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal_masuk: nota.tanggal,
          keterangan: nota.supplier,
          items: nota.items,
          unmatched_items: nota.unmatched,
          dokumentasi_url: nota.dokumentasi_url,
          confirmed_by: "bendahara",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? `Gagal simpan ${nota.fileName}`);
      summaries.push(`${nota.supplier}: ${nota.items.length + nota.unmatched.length} item`);
      if (data.products_created?.length) {
        createdProducts.push(...data.products_created);
      }
    }

    const totalItems = queue.reduce((s, n) => s + n.items.length + n.unmatched.length, 0);
    const createdNote = createdProducts.length
      ? ` Produk baru: ${[...new Set(createdProducts)].join(", ")}.`
      : "";
    addBotMessage({
      content: `✅ ${queue.length} nota tersimpan (${totalItems} item). ${summaries.join(" · ")}.${createdNote}`,
    });
    setNotaQueue([]);
    setSaveMultiNota(false);
    setPendingNotaMetaReply(null);
    setShowNotaUnmatchedEdit(false);
    setNotaEditTarget(null);
    onBarangMasukSaved?.();
  };

  const handleBarangMasukFormSubmit = (values: BarangMasukFormValues) => {
    const dokumentasiNama = values.dokumentasi?.name
      ?? pendingBarangMasuk?.dokumentasi_nama
      ?? pendingDraft?.dokumentasi_nama;

    setPendingBarangMasuk({
      tanggal_masuk: new Date().toISOString(),
      keterangan: values.keterangan,
      items: [{
        produk_sample_id: values.produk_sample_id,
        jumlah_masuk: values.jumlah_masuk,
        harga_beli: values.harga_beli,
        harga_jual: values.harga_jual > 0 ? values.harga_jual : undefined,
        nama_produk: values.nama_produk,
        nama_tampilan: values.nama_tampilan,
        keterangan: values.keterangan,
        unit: values.unit,
      }],
      dokumentasiFile: values.dokumentasi ?? pendingBarangMasuk?.dokumentasiFile,
      dokumentasi_nama: dokumentasiNama,
      dokumentasi_url: pendingBarangMasuk?.dokumentasi_url ?? pendingDraft?.dokumentasi_url,
    });

    if (pendingDraft) {
      setPendingDraft({
        ...pendingDraft,
        produk_sample_id: values.produk_sample_id,
        nama_produk: values.nama_produk,
        nama_tampilan: values.nama_tampilan,
        jumlah_masuk: values.jumlah_masuk,
        harga_beli: values.harga_beli,
        harga_jual: values.harga_jual > 0 ? values.harga_jual : undefined,
        unit: values.unit,
        keterangan: values.keterangan,
        dokumentasi_nama: dokumentasiNama,
      });
    }

    const action: ChatAction = {
      type: "confirm_barang_masuk",
      payload: {
        produk_sample_id: values.produk_sample_id,
        nama_produk: values.nama_produk,
        nama_tampilan: values.nama_tampilan,
        jumlah_masuk: values.jumlah_masuk,
        harga_beli: values.harga_beli,
        harga_jual: values.harga_jual > 0 ? values.harga_jual : undefined,
        unit: values.unit,
        keterangan: values.keterangan,
        stok_sekarang: pendingDraft?.stok_sekarang,
        dokumentasi_nama: dokumentasiNama,
        dokumentasi_url: pendingBarangMasuk?.dokumentasi_url ?? pendingDraft?.dokumentasi_url,
      },
    };

    setShowBarangMasukForm(false);
    setBarangMasukFormInitial(null);

    if (confirmAfterEdit) {
      showConfirmAfterEdit(action, confirmAfterEdit);
      setConfirmAfterEdit(null);
    } else {
      applyCrudAction(action);
      setConfirmOpen(true);
    }
  };

  const handleTambahProdukEditSubmit = (values: PendingTambahProduk) => {
    setPendingTambahProduk(values);
    setPendingTambahProdukDraft(values);
    setShowTambahProdukEdit(false);

    const action: ChatAction = { type: "confirm_tambah_produk", payload: values };

    if (confirmAfterEdit) {
      showConfirmAfterEdit(action, confirmAfterEdit);
      setConfirmAfterEdit(null);
    } else {
      applyCrudAction(action);
      setConfirmOpen(true);
    }
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
        setPendingCrudAction(null);
        setPendingPengajuanDraft(null);
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
            kategori: pendingTambahProduk.kategori,
            jenis_barang: pendingTambahProduk.jenis_barang,
            potensi_desa: pendingTambahProduk.potensi_desa,
            penyedia: pendingTambahProduk.penyedia,
            confirmed_by: "bendahara",
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        addBotMessage({ content: data.message ?? "Produk berhasil ditambahkan." });
        setPendingTambahProduk(null);
        setPendingTambahProdukDraft(null);
        setPendingCrudAction(null);
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
        setPendingPengajuanDraft(null);
        setPendingCrudAction(null);
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
    setPendingPengajuanDraft(null);
    setPendingDokumentasiFile(null);
    setPendingCrudAction(null);
    setShowBarangMasukForm(false);
    setBarangMasukFormInitial(null);
    setShowTambahProdukEdit(false);
    setConfirmAfterEdit(null);
    addBotMessage({ content: "Oke, dibatalkan." });
  };

  const handleChatCrudConfirm = () => {
    if (!pendingCrudAction) return;
    void handleConfirm();
  };

  const handleCrudEdit = () => {
    if (!pendingCrudAction) return;

    if (pendingCrudAction.type === "confirm_barang_masuk") {
      openBarangMasukEdit("chat");
      return;
    }

    if (pendingCrudAction.type === "confirm_tambah_produk") {
      setPendingTambahProduk(pendingCrudAction.payload);
      openTambahProdukEdit("chat");
    }
  };

  const handleModalEdit = () => {
    if (saveMultiNota) {
      const incomplete = findFirstIncompleteUnmatched(notaQueue);
      const fallbackNota = notaQueue.find((n) => n.unmatched.length > 0);
      const notaId = incomplete?.notaId ?? fallbackNota?.id;
      const itemIndex = incomplete?.itemIndex ?? 0;
      if (notaId) {
        openNotaUnmatchedEdit(notaId, itemIndex);
        setConfirmOpen(false);
      }
      return;
    }
    if (pendingBarangMasuk) {
      openBarangMasukEdit("modal");
      return;
    }
    if (pendingTambahProduk) {
      openTambahProdukEdit("modal");
    }
  };

  const canEditChatCrud = pendingCrudAction?.type === "confirm_barang_masuk"
    || pendingCrudAction?.type === "confirm_tambah_produk";
  const hasNotaUnmatched = notaQueue.some((n) => n.unmatched.length > 0);
  const canEditConfirm = Boolean(
    (saveMultiNota && hasNotaUnmatched)
    || (!saveMultiNota && (pendingBarangMasuk || pendingTambahProduk)),
  );

  const confirmTitle = saveMultiNota
    ? `Konfirmasi simpan ${notaQueue.length} nota?`
    : pendingTambahProduk
    ? "Tambah produk baru?"
    : pendingBarangMasuk
      ? "Simpan barang masuk?"
      : "Simpan pengajuan rekening?";

  const confirmDescription = saveMultiNota
    ? "Periksa daftar item di bawah. Produk baru akan didaftarkan dengan data yang sudah Anda lengkapi, lalu stok dan barang masuk tercatat."
    : "Data akan masuk ke SIMKOPDES.";

  const confirmPreview = saveMultiNota
    ? buildNotaSavePreviewFields(notaQueue)
    : pendingTambahProduk
      ? buildCrudConfirmView({ type: "confirm_tambah_produk", payload: pendingTambahProduk })?.fields
      : pendingBarangMasuk
        ? buildCrudConfirmView({
            type: "confirm_barang_masuk",
            payload: {
              produk_sample_id: pendingBarangMasuk.items[0]?.produk_sample_id ?? "",
              nama_produk: pendingBarangMasuk.items[0]?.nama_produk ?? "",
              nama_tampilan: pendingBarangMasuk.items[0]?.nama_tampilan,
              jumlah_masuk: pendingBarangMasuk.items[0]?.jumlah_masuk ?? 0,
              harga_beli: pendingBarangMasuk.items[0]?.harga_beli ?? 0,
              harga_jual: pendingBarangMasuk.items[0]?.harga_jual,
              keterangan: pendingBarangMasuk.items[0]?.keterangan ?? pendingBarangMasuk.keterangan,
              dokumentasi_nama: pendingBarangMasuk.dokumentasi_nama,
            },
          })?.fields
        : pendingPengajuan
          ? buildCrudConfirmView({
              type: "confirm_pengajuan",
              payload: {
                kode_bank: pendingPengajuan.kode_bank,
                nama_bank: pendingPengajuan.nama_bank,
                preview: pendingPengajuan.preview ?? {},
              },
            })?.fields
          : null;

  const lastBotIndex = messages.map((m) => m.role).lastIndexOf("bot");
  const lastBotPayload = lastBotIndex >= 0 && messages[lastBotIndex].role === "bot"
    ? messages[lastBotIndex].payload
    : null;
  const showChatCrudConfirm = Boolean(
    pendingCrudAction &&
    lastBotPayload &&
    typeof lastBotPayload !== "string" &&
    lastBotPayload.crud_confirm,
  );

  return (
    <div className={`relative flex flex-col bg-[#e5ddd5] ${embedded ? "h-full" : "h-dvh"}`}>
      <header className="shrink-0 bg-emerald-700 px-4 py-3 text-white shadow-sm">
        <div className={`mx-auto flex items-center gap-3 ${embedded ? "w-full" : "max-w-2xl"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">🤖</div>
          <div className="min-w-0 flex-1">
            <h1 id="copilot-title" className="text-base font-semibold">Kopdes Copilot</h1>
            <p className="text-xs text-emerald-100">{loading ? "mengetik..." : "online"}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl leading-none hover:bg-white/25"
              aria-label="Tutup chat"
            >
              ×
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <div className={`mx-auto flex flex-col gap-2 ${embedded ? "w-full" : "max-w-2xl"}`}>
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              payload={msg.payload}
              onSuggestionClick={runCommand}
              showSuggestions={msg.role === "bot" && i === lastBotIndex && !loading && !showChatCrudConfirm}
              showCrudConfirm={msg.role === "bot" && i === lastBotIndex && showChatCrudConfirm}
              onCrudConfirm={handleChatCrudConfirm}
              onCrudEdit={canEditChatCrud ? handleCrudEdit : undefined}
              onCrudCancel={handleCancel}
              crudConfirmLoading={confirmLoading}
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
              onSaveAll={beginNotaSave}
              onReviewUnmatched={openNotaUnmatchedEdit}
              onClear={() => {
                setNotaQueue([]);
                setPendingNotaMetaReply(null);
                setShowNotaUnmatchedEdit(false);
                setNotaEditTarget(null);
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
              initialValues={barangMasukFormInitial ?? undefined}
              onSubmit={handleBarangMasukFormSubmit}
              onCancel={() => {
                setShowBarangMasukForm(false);
                setBarangMasukFormInitial(null);
                setConfirmAfterEdit(null);
              }}
            />
          </div>
        </div>
      )}

      {showNotaUnmatchedEdit && notaEditTarget && (() => {
        const draft = notaQueue.find((n) => n.id === notaEditTarget.notaId)?.unmatched[notaEditTarget.itemIndex];
        if (!draft) return null;
        return (
          <div className="shrink-0 border-t border-slate-200/60 bg-[#f0f0f0] px-3 py-3">
            <div className={`mx-auto ${embedded ? "w-full" : "max-w-2xl"}`}>
              <TambahProdukEditForm
                loading={loading || confirmLoading}
                initial={{
                  nama_produk: draft.nama,
                  unit: draft.unit ?? "unit",
                  jumlah_masuk: draft.qty,
                  harga_beli: draft.harga,
                  kategori: draft.kategori,
                  jenis_barang: draft.jenis_barang,
                  potensi_desa: draft.potensi_desa,
                  penyedia: draft.penyedia,
                }}
                onSubmit={handleNotaUnmatchedEditSubmit}
                onCancel={() => {
                  setShowNotaUnmatchedEdit(false);
                  setNotaEditTarget(null);
                }}
              />
            </div>
          </div>
        );
      })()}

      {showTambahProdukEdit && pendingTambahProduk && (
        <div className="shrink-0 border-t border-slate-200/60 bg-[#f0f0f0] px-3 py-3">
          <div className={`mx-auto ${embedded ? "w-full" : "max-w-2xl"}`}>
            <TambahProdukEditForm
              loading={loading || confirmLoading}
              initial={{
                nama_produk: pendingTambahProduk.nama_produk,
                unit: pendingTambahProduk.unit ?? "unit",
                jumlah_masuk: pendingTambahProduk.jumlah_masuk,
                harga_beli: pendingTambahProduk.harga_beli,
                kategori: pendingTambahProduk.kategori,
                jenis_barang: pendingTambahProduk.jenis_barang,
                potensi_desa: pendingTambahProduk.potensi_desa,
                penyedia: pendingTambahProduk.penyedia,
              }}
              onSubmit={handleTambahProdukEditSubmit}
              onCancel={() => {
                setShowTambahProdukEdit(false);
                setConfirmAfterEdit(null);
              }}
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
        preview={confirmPreview}
        onConfirm={handleConfirm}
        onEdit={canEditConfirm ? handleModalEdit : undefined}
        onCancel={handleCancel}
        loading={confirmLoading}
      />
    </div>
  );
}
