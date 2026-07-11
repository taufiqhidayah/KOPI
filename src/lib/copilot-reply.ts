
import { getFeatureSuggestionPrompts, getHelpSummary } from "./copilot-scope";

export type PendingBarangMasukDraft = {
  produk_sample_id: string;
  nama_produk: string;
  nama_tampilan?: string;
  jumlah_masuk: number;
  harga_beli: number;
  harga_jual?: number;
  unit?: string;
  stok_sekarang?: number;
  keterangan?: string;
  dokumentasi_nama?: string;
  dokumentasi_url?: string;
  phase?: "harga_beli" | "harga_jual" | "keterangan" | "dokumentasi" | "confirm";
  skip_harga_jual?: boolean;
  skip_keterangan?: boolean;
  skip_dokumentasi?: boolean;
};

export type CopilotReply = {
  summary: string;
  suggested_prompts: string[];
};

export type BarangMasukExtraction = {
  is_barang_masuk: boolean;
  produk_nama?: string;
  jumlah?: number;
  satuan?: string;
  harga_beli?: number;
  is_konfirmasi?: boolean;
  is_batal?: boolean;
  is_koreksi?: boolean;
};

export async function extractBarangMasuk(): Promise<BarangMasukExtraction | null> {
  return null;
}

type ReplyContext = {
  intent: string;
  userMessage: string;
  situation: string;
  facts?: Record<string, unknown>;
  productOptions?: string[];
  draft?: PendingBarangMasukDraft;
  lastHargaBeli?: number;
};

export type BarangMasukPhase =
  | "need_harga"
  | "need_harga_jual"
  | "need_keterangan"
  | "need_dokumentasi"
  | "need_confirm"
  | "need_product"
  | "done";

export function resolveBarangMasukPhase(draft: PendingBarangMasukDraft): BarangMasukPhase {
  const phase = draft.phase ?? (draft.harga_beli > 0 ? "harga_jual" : "harga_beli");

  switch (phase) {
    case "harga_beli":
      return draft.harga_beli > 0
        ? resolveBarangMasukPhase({ ...draft, phase: "harga_jual" })
        : "need_harga";
    case "harga_jual":
      return (draft.harga_jual && draft.harga_jual > 0) || draft.skip_harga_jual
        ? resolveBarangMasukPhase({ ...draft, phase: "keterangan" })
        : "need_harga_jual";
    case "keterangan":
      return draft.keterangan || draft.skip_keterangan
        ? resolveBarangMasukPhase({ ...draft, phase: "dokumentasi" })
        : "need_keterangan";
    case "dokumentasi":
      return draft.dokumentasi_nama || draft.skip_dokumentasi ? "need_confirm" : "need_dokumentasi";
    case "confirm":
      return "need_confirm";
    default:
      return "need_harga";
  }
}

export function advanceBarangMasukPhase(draft: PendingBarangMasukDraft): PendingBarangMasukDraft {
  const next = { ...draft };
  const phase = next.phase ?? (next.harga_beli > 0 ? "harga_jual" : "harga_beli");

  if (phase === "harga_beli") {
    next.phase = "harga_jual";
    return next;
  }
  if (phase === "harga_jual") {
    next.phase = "keterangan";
    return next;
  }
  if (phase === "keterangan") {
    next.phase = "dokumentasi";
    return next;
  }
  if (phase === "dokumentasi") {
    next.phase = "confirm";
    return next;
  }
  return next;
}

export function buildBarangMasukSuggestions(
  draft: PendingBarangMasukDraft,
  phase: BarangMasukPhase,
  lastHargaBeli?: number,
): string[] {
  const unit = draft.unit ?? "";

  if (phase === "need_harga") {
    if (lastHargaBeli && lastHargaBeli > 0) {
      return [
        `Harga beli Rp ${lastHargaBeli.toLocaleString("id-ID")}`,
        "Simpan tanpa harga",
        "Batal",
      ];
    }
    return ["Harga beli Rp 15.000", "Simpan tanpa harga", "Batal"];
  }

  if (phase === "need_harga_jual") {
    return ["Harga jual Rp 18.000", "Lewati harga jual", "Batal"];
  }

  if (phase === "need_keterangan") {
    return ["Keterangan: dari supplier Makmur", "Lewati keterangan", "Batal"];
  }

  if (phase === "need_dokumentasi") {
    return ["Lewati dokumentasi", "Ya, simpan barang masuk", "Batal"];
  }

  if (phase === "need_confirm") {
    return [
      "Ya, simpan barang masuk",
      `Ubah jadi ${Math.max(1, draft.jumlah_masuk - 1)} ${unit}`.trim(),
      "Batal",
    ];
  }

  if (phase === "need_product") {
    return [];
  }

  return ["Stok barangku", "Upload foto nota"];
}

function formatBarangMasukSummary(ctx: ReplyContext, phase: BarangMasukPhase): string {
  const d = ctx.draft;
  if (!d) return ctx.situation;

  if (phase === "need_harga") {
    const last = ctx.lastHargaBeli;
    return last
      ? `Catat ${d.nama_produk} ${d.jumlah_masuk} ${d.unit ?? ""}. Stok sekarang ${d.stok_sekarang ?? "?"}. Harga beli terakhir Rp ${last.toLocaleString("id-ID")} — mau pakai harga ini?`
      : `Catat ${d.nama_produk} ${d.jumlah_masuk} ${d.unit ?? ""}. Stok sekarang ${d.stok_sekarang ?? "?"}. Harga belinya berapa?`;
  }

  if (phase === "need_harga_jual") {
    return `Harga beli Rp ${d.harga_beli.toLocaleString("id-ID")}. Berapa harga jual ${d.nama_tampilan ?? d.nama_produk}? (bisa lewati)`;
  }

  if (phase === "need_keterangan") {
    const jual = d.harga_jual && d.harga_jual > 0 ? ` Harga jual Rp ${d.harga_jual.toLocaleString("id-ID")}.` : "";
    return `Oke.${jual} Ada keterangan? Misalnya supplier atau catatan penerimaan. (bisa lewati)`;
  }

  if (phase === "need_dokumentasi") {
    const ket = d.keterangan ? ` Keterangan: ${d.keterangan.slice(0, 60)}.` : "";
    return `Hampir selesai.${ket} Upload dokumentasi lewat 📷 (JPG/PNG/PDF) atau ketik "lewati dokumentasi".`;
  }

  if (phase === "need_confirm") {
    const hargaBeli = d.harga_beli > 0 ? ` Harga beli Rp ${d.harga_beli.toLocaleString("id-ID")}.` : "";
    const hargaJual = d.harga_jual && d.harga_jual > 0 ? ` Harga jual Rp ${d.harga_jual.toLocaleString("id-ID")}.` : "";
    const ket = d.keterangan ? ` Keterangan: ${d.keterangan.slice(0, 80)}.` : "";
    const dok = d.dokumentasi_nama ? ` Lampiran: ${d.dokumentasi_nama}.` : "";
    return `Siap simpan ${d.nama_tampilan ?? d.nama_produk} ${d.jumlah_masuk} ${d.unit ?? ""}.${hargaBeli}${hargaJual}${ket}${dok} Konfirmasi ya?`;
  }

  return ctx.situation;
}

export async function generateBarangMasukReply(
  ctx: ReplyContext,
  phase: BarangMasukPhase,
): Promise<CopilotReply> {
  const suggestions = ctx.draft
    ? buildBarangMasukSuggestions(ctx.draft, phase, ctx.lastHargaBeli)
    : ["Beras 10 kg premium", "Aqua 5 galon", "Upload foto nota"];

  return {
    summary: formatBarangMasukSummary(ctx, phase),
    suggested_prompts: suggestions,
  };
}

const FALLBACK_BY_INTENT: Record<string, CopilotReply> = {
  barang_masuk: {
    summary: "Siap bantu catat barang masuk. Sebutkan produk dan jumlahnya.",
    suggested_prompts: ["Beras 10 kg premium", "Upload foto nota"],
  },
  out_of_scope: {
    summary: "Saya fokus bantu urusan koperasi di SIMKOPDES.",
    suggested_prompts: ["Stok barangku", "Laporan penjualan minggu ini"],
  },
  help: {
    summary: getHelpSummary(),
    suggested_prompts: getFeatureSuggestionPrompts(),
  },
};

export async function generateCopilotReply(ctx: ReplyContext): Promise<CopilotReply> {
  return FALLBACK_BY_INTENT[ctx.intent] ?? {
    summary: ctx.situation,
    suggested_prompts: ["Stok barangku", "Laporan penjualan minggu ini"],
  };
}
