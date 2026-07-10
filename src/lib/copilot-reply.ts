
import { getFeatureSuggestionPrompts, getHelpSummary } from "./copilot-scope";

export type PendingBarangMasukDraft = {
  produk_sample_id: string;
  nama_produk: string;
  jumlah_masuk: number;
  harga_beli: number;
  unit?: string;
  stok_sekarang?: number;
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

export type BarangMasukPhase = "need_harga" | "need_confirm" | "need_product" | "done";

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

  if (phase === "need_confirm") {
    const harga = d.harga_beli > 0 ? ` Harga beli Rp ${d.harga_beli.toLocaleString("id-ID")}.` : "";
    return `Siap simpan ${d.nama_produk} ${d.jumlah_masuk} ${d.unit ?? ""}.${harga} Konfirmasi ya?`;
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
