import { getCapabilitiesText, getFeatureSuggestionPrompts, getHelpSummary } from "./copilot-scope";
import { geminiJson, isGeminiAvailable } from "./gemini";
import { isBarangMasukConfirm, parseBarangMasukText, parseHargaBeli, parseProductOnly } from "./parse-barang-masuk";

export type ChatIntent =
  | "query"
  | "help"
  | "pengajuan_rekening"
  | "upload_nota"
  | "barang_masuk"
  | "tambah_produk"
  | "profil_info"
  | "out_of_scope";

export type IntentResult = {
  in_scope: boolean;
  intent: ChatIntent;
  confidence: number;
  reasoning: string;
  suggested_prompts: string[];
  bank_name?: string;
};

const FALLBACK_SUGGESTIONS = getFeatureSuggestionPrompts();

function structuralIntent(command: string): IntentResult | null {
  if (parseBarangMasukText(command) || parseProductOnly(command)) {
    return {
      in_scope: true,
      intent: "barang_masuk",
      confidence: 0.9,
      reasoning: "parsing produk/jumlah",
      suggested_prompts: [],
    };
  }
  return null;
}

function extractBankName(command: string): string {
  const match = command.match(/\b(bri|bca|mandiri|bni)\b/i);
  if (!match) return "BRI";
  return match[1].toUpperCase();
}

function localClassifyIntent(command: string): IntentResult | null {
  const lower = command.toLowerCase().trim();

  if (/^(help|bantuan|menu|fitur)$/i.test(lower) || /bantuan|apa yang bisa|bisa bantu|fitur apa/i.test(lower)) {
    return {
      in_scope: true,
      intent: "help",
      confidence: 0.9,
      reasoning: "permintaan bantuan",
      suggested_prompts: FALLBACK_SUGGESTIONS,
    };
  }

  if (/nota|foto nota|upload|struk|scan nota|cara upload/i.test(lower)) {
    return {
      in_scope: true,
      intent: "upload_nota",
      confidence: 0.9,
      reasoning: "upload nota",
      suggested_prompts: ["Aqua 5 galon", "Stok barangku"],
    };
  }

  if (/rekening|bank|bri|bca|mandiri|bni|buka rekening|pengajuan.*bank/i.test(lower)) {
    return {
      in_scope: true,
      intent: "pengajuan_rekening",
      confidence: 0.9,
      reasoning: "pengajuan rekening bank",
      suggested_prompts: FALLBACK_SUGGESTIONS,
      bank_name: extractBankName(command),
    };
  }

  if (/tambah barang masuk|form barang masuk|buka form barang masuk/i.test(lower)) {
    return {
      in_scope: true,
      intent: "barang_masuk",
      confidence: 0.95,
      reasoning: "form tambah barang masuk",
      suggested_prompts: ["Upload foto nota", "Stok barangku"],
    };
  }

  if (/tambah produk|produk baru|belum ada di master/i.test(lower)) {
    return {
      in_scope: true,
      intent: "tambah_produk",
      confidence: 0.85,
      reasoning: "tambah produk baru",
      suggested_prompts: [],
    };
  }

  if (/ketua|pengurus|dokumen|profil koperasi|sekretaris|bendahara|nik koperasi|siapa/i.test(lower)) {
    return {
      in_scope: true,
      intent: "profil_info",
      confidence: 0.85,
      reasoning: "info profil koperasi",
      suggested_prompts: FALLBACK_SUGGESTIONS,
    };
  }

  if (
    /laporan|penjualan|omzet|transaksi|stok|inventaris|menipis|anggota|simpanan|produk|barangku|berapa|tampilkan|cek|lihat|buatkan|daftar|semua/i.test(
      lower,
    )
  ) {
    return {
      in_scope: true,
      intent: "query",
      confidence: 0.9,
      reasoning: "permintaan data atau laporan",
      suggested_prompts: ["Stok barang menipis", "Laporan penjualan minggu ini"],
    };
  }

  return null;
}

async function aiClassifyIntent(command: string): Promise<IntentResult | null> {
  if (!isGeminiAvailable()) return null;

  return geminiJson<IntentResult>(
    `Kamu classifier intent Kopdes Copilot untuk SIMKOPDES (koperasi desa).

TUGAS: tentukan apakah pesan user relevan dengan koperasi, lalu pilih intent.

IN_SCOPE = true untuk SEMUA yang terkait koperasi, termasuk:
- nama produk saja ("minyak goreng", "beras", "aqua")
- stok, penjualan, laporan, anggota, simpanan
- barang masuk, foto nota, tambah produk baru
- pengajuan rekening bank, profil/pengurus/dokumen

IN_SCOPE = false HANYA untuk topik jelas di luar koperasi (cuaca, politik, resep, coding, entertainment).

Intent valid:
- query: minta data/laporan dari database
- help: tanya fitur/bantuan
- pengajuan_rekening: buka rekening bank (isi bank_name: BRI|BCA|Mandiri|BNI)
- upload_nota: input foto nota
- barang_masuk: catat barang masuk (produk + jumlah, atau nama produk saja)
- tambah_produk: produk baru belum ada di master
- profil_info: info profil/pengurus/dokumen
- out_of_scope: di luar koperasi

Buat 2-3 suggested_prompts kontekstual untuk follow-up user.

Return JSON:
{"in_scope":bool,"intent":"...","confidence":0-1,"reasoning":"...","suggested_prompts":["..."],"bank_name":"BRI|BCA|null"}`,
    `Kemampuan Copilot:\n${getCapabilitiesText()}\n\nPesan user: "${command}"`,
  );
}

function fallbackIntent(command: string): IntentResult {
  const structural = structuralIntent(command);
  if (structural) return structural;

  const local = localClassifyIntent(command);
  if (local) return local;

  return {
    in_scope: false,
    intent: "out_of_scope",
    confidence: 0.4,
    reasoning: "AI tidak tersedia dan pesan tidak dikenali",
    suggested_prompts: FALLBACK_SUGGESTIONS,
  };
}

export async function classifyIntent(
  command: string,
  context?: { pending_barang_masuk?: boolean },
): Promise<IntentResult> {
  if (context?.pending_barang_masuk && (isBarangMasukConfirm(command) || parseHargaBeli(command) !== undefined)) {
    return { in_scope: true, intent: "barang_masuk", confidence: 0.95, reasoning: "konfirmasi draft", suggested_prompts: [] };
  }

  const structural = structuralIntent(command);
  if (structural) return structural;

  const local = localClassifyIntent(command);
  if (local) return local;

  const aiResult = await aiClassifyIntent(command);
  if (aiResult && aiResult.confidence >= 0.5) return aiResult;

  if (aiResult) return aiResult;

  return fallbackIntent(command);
}

export function getHelpReply() {
  return {
    summary: getHelpSummary(),
    suggested_prompts: FALLBACK_SUGGESTIONS,
  };
}

export function getOutOfScopeReply() {
  return {
    summary: "Maaf, belum paham maksudnya. Coba sebut produk, stok, laporan penjualan, atau barang masuk.",
    suggested_prompts: FALLBACK_SUGGESTIONS,
  };
}

export function getUploadNotaReply() {
  return {
    summary: "Upload satu atau banyak foto nota lewat 📷 (bisa pilih beberapa sekaligus). Nota masuk antrian — review lalu tap Simpan semua.",
    suggested_prompts: ["Simpan semua nota", "Upload nota lagi"],
  };
}
