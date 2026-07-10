import { getKoperasiRef, query, queryOne } from "./db";
import { classifyIntent, getHelpReply, getOutOfScopeReply, getUploadNotaReply } from "./intent";
import { generateSql, generateSummary, generateDraftSurat } from "./llm";
import { generateBarangMasukReply, type PendingBarangMasukDraft } from "./copilot-reply";
import { parseBarangMasukText, parseHargaBeli, isBarangMasukConfirm, parseProductOnly, isTambahProdukConfirm, isTambahProdukTanpaStok } from "./parse-barang-masuk";
import { findBestProduct } from "./product-match";
import {
  buildTambahProdukSuggestions,
  buildTambahProdukSummary,
  normalizeProdukName,
  normalizeUnit,
  type TambahProdukPrefill,
} from "./tambah-produk-guide";
import { getSchemaDescription } from "./schema";
import { enforceRowLimit, validateChatSql } from "./security";
import { COPILOT_CAPABILITIES } from "./copilot-scope";

export type { PendingBarangMasukDraft } from "./copilot-reply";

export type PendingTambahProdukDraft = {
  nama_produk: string;
  unit?: string;
  jumlah_masuk?: number;
  harga_beli?: number;
};

export type ChatContext = {
  pending_barang_masuk?: PendingBarangMasukDraft;
  pending_tambah_produk?: PendingTambahProdukDraft;
};

export type ChatAction =
  | { type: "confirm_pengajuan"; payload: { kode_bank: string; nama_bank: string; preview: Record<string, unknown> } }
  | { type: "confirm_barang_masuk"; payload: PendingBarangMasukDraft }
  | { type: "confirm_tambah_produk"; payload: PendingTambahProdukDraft }
  | { type: "upload_nota" };

export type CopilotChatResponse = {
  success: boolean;
  in_scope: boolean;
  intent: string;
  summary: string;
  explanation?: string;
  data?: Record<string, unknown>[];
  sql?: string;
  capabilities?: typeof COPILOT_CAPABILITIES;
  suggested_prompts?: string[];
  action?: ChatAction;
  draft_surat?: string;
  error?: string;
  pending_barang_masuk?: PendingBarangMasukDraft;
  pending_tambah_produk?: PendingTambahProdukDraft;
  execution_time_ms: number;
};

function isSkipHarga(text: string): boolean {
  return /tanpa harga|lewati harga|skip harga|simpan tanpa/i.test(text.toLowerCase());
}

function isHargaLookup(text: string): boolean {
  return /harga.*terakhir|terakhir.*harga|riwayat.*harga|cek.*harga beli/i.test(text.toLowerCase());
}

async function getLastHargaBeli(
  produkSampleId: string,
  koperasiRef: string,
): Promise<number | undefined> {
  const row = await queryOne<{ harga_beli: string | null }>(
    `SELECT harga_beli FROM barang_masuk_produk
     WHERE produk_sample_id = $1 AND koperasi_ref = $2 AND harga_beli > 0
     ORDER BY tanggal_masuk DESC NULLS LAST, dibuat_pada DESC NULLS LAST
     LIMIT 1`,
    [produkSampleId, koperasiRef],
  );
  const val = Number(row?.harga_beli ?? 0);
  return val > 0 ? val : undefined;
}

async function handlePengajuanRekening(namaBank: string, kodeBank: string): Promise<CopilotChatResponse> {
  const koperasiRef = getKoperasiRef();

  const profil = await queryOne<{
    nama_koperasi: string | null;
    nik_koperasi: string | null;
    alamat_lengkap: string | null;
  }>(
    `SELECT nama_koperasi, nik_koperasi, alamat_lengkap FROM profil_koperasi WHERE koperasi_ref = $1`,
    [koperasiRef],
  );

  const ketua = await queryOne<{
    nama: string | null;
    jabatan: string | null;
    nik: string | null;
    no_hp: string | null;
  }>(
    `SELECT nama, jabatan, nik, no_hp FROM pengurus_koperasi
     WHERE koperasi_ref = $1 AND LOWER(jabatan) LIKE '%ketua%' LIMIT 1`,
    [koperasiRef],
  );

  const dokumen = await query<{ jenis_dokumen_ref: string }>(
    `SELECT jenis_dokumen_ref FROM dokumen_koperasi WHERE koperasi_ref = $1`,
    [koperasiRef],
  );

  const requiredDocs = ["SKAHU", "NIB", "NPWP"];
  const existingRefs = dokumen.map((d) => d.jenis_dokumen_ref.toUpperCase());
  const missing = requiredDocs.filter((doc) => !existingRefs.some((r) => r.includes(doc)));

  const autoFilled = {
    koperasi_ref: koperasiRef,
    nama_koperasi: profil?.nama_koperasi ?? "",
    nik_koperasi: profil?.nik_koperasi ?? "",
    alamat_lengkap: profil?.alamat_lengkap ?? "",
    penanggung_jawab: ketua?.nama ?? "",
    nik: ketua?.nik ?? "",
    nomor_penanggung_jawab: ketua?.no_hp ?? "",
    kode_bank: kodeBank,
    nama_bank: namaBank,
  };

  const draftSurat = await generateDraftSurat({
    namaKoperasi: autoFilled.nama_koperasi,
    alamat: autoFilled.alamat_lengkap,
    namaPengurus: autoFilled.penanggung_jawab,
    jabatan: ketua?.jabatan ?? "Ketua",
    namaBank,
  });

  const missingText = missing.length ? ` Dokumen belum lengkap: ${missing.join(", ")}.` : "";

  return {
    success: true,
    in_scope: true,
    intent: "pengajuan_rekening",
    summary: `Siap bantu pengajuan rekening ${namaBank}.${missingText} Periksa draft surat lalu konfirmasi.`,
    draft_surat: draftSurat,
    action: {
      type: "confirm_pengajuan",
      payload: { kode_bank: kodeBank, nama_bank: namaBank, preview: autoFilled },
    },
    suggested_prompts: ["Buatkan laporan penjualan minggu ini", "Stok barangku"],
    execution_time_ms: 0,
  };
}

async function handleProfilInfo(command: string): Promise<CopilotChatResponse> {
  const koperasiRef = getKoperasiRef();

  const profil = await queryOne(
    `SELECT nama_koperasi, nik_koperasi, alamat_lengkap, status_registrasi FROM profil_koperasi WHERE koperasi_ref = $1`,
    [koperasiRef],
  );

  const pengurus = await query(
    `SELECT nama, jabatan, no_hp FROM pengurus_koperasi WHERE koperasi_ref = $1 LIMIT 10`,
    [koperasiRef],
  );

  const dokumen = await query(
    `SELECT jenis_dokumen_ref, nomor FROM dokumen_koperasi WHERE koperasi_ref = $1 LIMIT 20`,
    [koperasiRef],
  );

  const summary = await generateSummary(command, [
    { profil, pengurus_count: pengurus.length, dokumen_count: dokumen.length },
  ]);

  const followUp = { suggested_prompts: ["Laporan penjualan minggu ini", "Stok barangku"] };

  return {
    success: true,
    in_scope: true,
    intent: "profil_info",
    summary,
    explanation: "Data diambil dari tabel profil_koperasi, pengurus_koperasi, dan dokumen_koperasi.",
    data: [
      ...(profil ? [profil as Record<string, unknown>] : []),
      ...pengurus.map((p) => ({ tipe: "pengurus", ...p })),
      ...dokumen.map((d) => ({ tipe: "dokumen", ...d })),
    ],
    suggested_prompts: followUp.suggested_prompts,
    execution_time_ms: 0,
  };
}

function offerTambahProduk(
  prefill: TambahProdukPrefill,
  existingProducts: string[] = [],
): CopilotChatResponse {
  const namaProduk = normalizeProdukName(prefill.nama_produk);
  const unit = normalizeUnit(prefill.satuan);
  const draft: PendingTambahProdukDraft = {
    nama_produk: namaProduk,
    unit,
    jumlah_masuk: prefill.jumlah,
    harga_beli: prefill.harga_beli,
  };

  return {
    success: true,
    in_scope: true,
    intent: "tambah_produk",
    summary: buildTambahProdukSummary({ ...prefill, nama_produk: namaProduk, satuan: unit }),
    explanation: prefill.jumlah
      ? "Produk baru bisa ditambahkan lewat chat, lalu stok langsung dicatat."
      : "Produk baru bisa ditambahkan lewat chat. Kategori & penyedia bisa dilengkapi nanti di form SIMKOPDES.",
    data: [{
      nama_produk: namaProduk,
      satuan: unit,
      ...(prefill.jumlah ? { jumlah_masuk: prefill.jumlah } : {}),
    }],
    pending_tambah_produk: draft,
    action: { type: "confirm_tambah_produk", payload: draft },
    suggested_prompts: buildTambahProdukSuggestions({ ...prefill, nama_produk: namaProduk, satuan: unit }, existingProducts),
    execution_time_ms: 0,
  };
}

async function handleTambahProduk(command: string): Promise<CopilotChatResponse> {
  const parsed = parseBarangMasukText(command);
  const prefill: TambahProdukPrefill = {
    nama_produk: parsed?.productQuery ?? command.replace(/tambah produk|produk baru/gi, "").trim(),
    satuan: parsed?.unit,
    jumlah: parsed?.qty,
    harga_beli: parsed?.hargaBeli,
  };

  return offerTambahProduk(prefill);
}

async function handlePendingTambahProduk(
  command: string,
  context: ChatContext,
): Promise<CopilotChatResponse> {
  const draft = { ...context.pending_tambah_produk! };

  if (/^batal$/i.test(command.trim())) {
    return {
      success: true,
      in_scope: true,
      intent: "tambah_produk",
      summary: "Oke, batal tambah produk.",
      suggested_prompts: ["Stok barangku", "Laporan penjualan minggu ini"],
      execution_time_ms: 0,
    };
  }

  if (isTambahProdukTanpaStok(command)) {
    draft.jumlah_masuk = undefined;
    return {
      ...offerTambahProduk({
        nama_produk: draft.nama_produk,
        satuan: draft.unit,
      }),
      pending_tambah_produk: draft,
      action: { type: "confirm_tambah_produk", payload: draft },
    };
  }

  const hargaInput = parseHargaBeli(command);
  if (hargaInput !== undefined && hargaInput >= 0) {
    draft.harga_beli = hargaInput;
    return {
      ...offerTambahProduk({
        nama_produk: draft.nama_produk,
        satuan: draft.unit,
        jumlah: draft.jumlah_masuk,
        harga_beli: hargaInput,
      }),
      summary: `Harga beli ${draft.nama_produk} Rp ${hargaInput.toLocaleString("id-ID")}. Konfirmasi tambah produk${draft.jumlah_masuk ? ` dan catat ${draft.jumlah_masuk} ${draft.unit ?? ""} masuk` : ""}?`,
      pending_tambah_produk: draft,
      action: { type: "confirm_tambah_produk", payload: draft },
    };
  }

  if (isTambahProdukConfirm(command)) {
    return {
      ...offerTambahProduk({
        nama_produk: draft.nama_produk,
        satuan: draft.unit,
        jumlah: draft.jumlah_masuk,
        harga_beli: draft.harga_beli,
      }),
      pending_tambah_produk: draft,
      action: { type: "confirm_tambah_produk", payload: draft },
    };
  }

  return {
    success: true,
    in_scope: true,
    intent: "tambah_produk",
    summary: `Masih menunggu konfirmasi tambah ${draft.nama_produk}${draft.jumlah_masuk ? ` (${draft.jumlah_masuk} ${draft.unit ?? ""})` : ""}.`,
    pending_tambah_produk: draft,
    suggested_prompts: buildTambahProdukSuggestions({
      nama_produk: draft.nama_produk,
      satuan: draft.unit,
      jumlah: draft.jumlah_masuk,
    }),
    execution_time_ms: 0,
  };
}

async function handleBarangMasuk(
  command: string,
  context?: ChatContext,
): Promise<CopilotChatResponse> {
  const koperasiRef = getKoperasiRef();
  const products = await query<{ produk_sample_id: string; nama_produk: string | null; unit: string | null }>(
    `SELECT produk_sample_id, nama_produk, unit FROM produk_koperasi WHERE koperasi_ref = $1`,
    [koperasiRef],
  );

  if (context?.pending_barang_masuk) {
    const draft = { ...context.pending_barang_masuk };
    const lastHarga = await getLastHargaBeli(draft.produk_sample_id, koperasiRef);

    if (isHargaLookup(command)) {
      const reply = await generateBarangMasukReply({
        intent: "barang_masuk",
        userMessage: command,
        situation: lastHarga
          ? `Harga beli terakhir ${draft.nama_produk} Rp ${lastHarga.toLocaleString("id-ID")} per ${draft.unit ?? "unit"}. Tanya apakah pakai harga ini.`
          : `Belum ada riwayat harga beli ${draft.nama_produk}. Minta user isi harga atau simpan tanpa harga.`,
        facts: { produk: draft.nama_produk, harga_terakhir: lastHarga },
        draft,
        lastHargaBeli: lastHarga,
      }, "need_harga");

      return {
        success: true,
        in_scope: true,
        intent: "barang_masuk",
        summary: reply.summary,
        data: [{ produk: draft.nama_produk, harga_beli_terakhir: lastHarga ?? "belum ada" }],
        pending_barang_masuk: draft,
        suggested_prompts: reply.suggested_prompts,
        execution_time_ms: 0,
      };
    }

    const hargaInput = parseHargaBeli(command);
    const confirmed = isBarangMasukConfirm(command);
    const cancelled = /^batal$/i.test(command.trim());
    const skipHarga = isSkipHarga(command);

    if (cancelled) {
      const reply = await generateBarangMasukReply({
        intent: "barang_masuk",
        userMessage: command,
        situation: "User membatalkan input barang masuk.",
        draft,
      }, "done");
      return {
        success: true,
        in_scope: true,
        intent: "barang_masuk",
        summary: reply.summary,
        suggested_prompts: reply.suggested_prompts,
        execution_time_ms: 0,
      };
    }

    if (skipHarga) {
      draft.harga_beli = 0;
      const reply = await generateBarangMasukReply({
        intent: "barang_masuk",
        userMessage: command,
        situation: `User mau simpan ${draft.nama_produk} ${draft.jumlah_masuk} ${draft.unit ?? ""} tanpa harga beli. Minta konfirmasi.`,
        draft,
      }, "need_confirm");
      return {
        success: true,
        in_scope: true,
        intent: "barang_masuk",
        summary: reply.summary,
        data: [{ produk: draft.nama_produk, qty: draft.jumlah_masuk, harga_beli: 0 }],
        pending_barang_masuk: draft,
        action: { type: "confirm_barang_masuk", payload: draft },
        suggested_prompts: reply.suggested_prompts,
        execution_time_ms: 0,
      };
    }

    if (hargaInput !== undefined && hargaInput > 0 && !confirmed) {
      draft.harga_beli = hargaInput;
      const reply = await generateBarangMasukReply({
        intent: "barang_masuk",
        userMessage: command,
        situation: `Harga beli ${draft.nama_produk} Rp ${hargaInput.toLocaleString("id-ID")}. Minta konfirmasi simpan.`,
        facts: { produk: draft.nama_produk, qty: draft.jumlah_masuk, harga_beli: hargaInput },
        draft,
        lastHargaBeli: lastHarga,
      }, "need_confirm");
      return {
        success: true,
        in_scope: true,
        intent: "barang_masuk",
        summary: reply.summary,
        data: [{ produk: draft.nama_produk, qty: draft.jumlah_masuk, harga_beli: hargaInput }],
        pending_barang_masuk: draft,
        action: { type: "confirm_barang_masuk", payload: draft },
        suggested_prompts: reply.suggested_prompts,
        execution_time_ms: 0,
      };
    }

    if (confirmed) {
      const reply = await generateBarangMasukReply({
        intent: "barang_masuk",
        userMessage: command,
        situation: `User konfirmasi simpan ${draft.nama_produk} ${draft.jumlah_masuk} ${draft.unit ?? ""}.`,
        facts: draft,
        draft,
      }, "need_confirm");
      return {
        success: true,
        in_scope: true,
        intent: "barang_masuk",
        summary: reply.summary,
        data: [{ produk: draft.nama_produk, qty: draft.jumlah_masuk, harga_beli: draft.harga_beli }],
        pending_barang_masuk: draft,
        action: { type: "confirm_barang_masuk", payload: draft },
        suggested_prompts: reply.suggested_prompts,
        execution_time_ms: 0,
      };
    }

    const reply = await generateBarangMasukReply({
      intent: "barang_masuk",
      userMessage: command,
      situation: `Masih menunggu harga beli atau konfirmasi untuk ${draft.nama_produk} ${draft.jumlah_masuk} ${draft.unit ?? ""}.`,
      draft,
      lastHargaBeli: lastHarga,
    }, "need_harga");

    return {
      success: true,
      in_scope: true,
      intent: "barang_masuk",
      summary: reply.summary,
      data: [{ produk: draft.nama_produk, qty: draft.jumlah_masuk, stok_sekarang: draft.stok_sekarang }],
      pending_barang_masuk: draft,
      suggested_prompts: reply.suggested_prompts,
      execution_time_ms: 0,
    };
  }

  const parsed = parseBarangMasukText(command);
  const productOnly = parseProductOnly(command);
  const qty = parsed?.qty;
  const productQuery = parsed?.productQuery ?? productOnly?.productQuery;
  const hargaBeli = parsed?.hargaBeli;
  const unit = parsed?.unit;

  if (productQuery && !qty) {
    const { best } = findBestProduct(productQuery, products);
    const existingNames = products.map((p) => p.nama_produk ?? "").filter(Boolean);

    if (!best) {
      return offerTambahProduk({ nama_produk: productQuery, satuan: unit }, existingNames);
    }

    const inventaris = await queryOne<{ stok: string | null }>(
      `SELECT stok FROM inventaris_produk WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
      [best.produk_sample_id, koperasiRef],
    );
    const stok = Number(inventaris?.stok ?? 0);

    return {
      success: true,
      in_scope: true,
      intent: "barang_masuk",
      summary: `Maksudnya catat barang masuk ${best.nama_produk}? Stok sekarang ${stok} ${best.unit ?? ""}. Berapa jumlahnya?`,
      data: [{ produk: best.nama_produk, stok_sekarang: stok }],
      suggested_prompts: [
        `${best.nama_produk} 5 ${best.unit ?? "liter"}`,
        `${best.nama_produk} 10 ${best.unit ?? "liter"}`,
        "Stok barangku",
      ],
      execution_time_ms: 0,
    };
  }

  if (!qty || !productQuery) {
    const reply = await generateBarangMasukReply({
      intent: "barang_masuk",
      userMessage: command,
      situation: "Produk atau jumlah belum jelas. Minta detail atau tawarkan foto nota.",
      productOptions: products.map((p) => p.nama_produk ?? ""),
    }, "need_product");
    return {
      success: true,
      in_scope: true,
      intent: "barang_masuk",
      summary: reply.summary,
      suggested_prompts: reply.suggested_prompts.length
        ? reply.suggested_prompts
        : products.slice(0, 3).map((p) => `${p.nama_produk} 10 ${p.unit ?? ""}`.trim()),
      execution_time_ms: 0,
    };
  }

  const { best, candidates } = findBestProduct(productQuery, products);

  if (!best) {
    const options = candidates.map((c) => c.nama_produk ?? "");
    const existingNames = products.map((p) => p.nama_produk ?? "").filter(Boolean);

    if (options.length === 0 || /barang lain|produk baru|tambah produk/i.test(command)) {
      return offerTambahProduk(
        { nama_produk: productQuery, satuan: unit, jumlah: qty, harga_beli: hargaBeli },
        existingNames,
      );
    }

    const reply = await generateBarangMasukReply({
      intent: "barang_masuk",
      userMessage: command,
      situation: `"${productQuery}" belum cocok. Mungkin maksud salah satu produk ini, atau produk baru perlu didaftarkan via Tambah Produk.`,
      facts: { qty, unit, productQuery, opsi: options },
      productOptions: options,
    }, "need_product");
    return {
      success: true,
      in_scope: true,
      intent: "barang_masuk",
      summary: reply.summary,
      suggested_prompts: [
        ...options.slice(0, 2).map((name) => `${name} ${qty} ${unit ?? ""}`.trim()),
        `Tambah produk baru: ${productQuery}`,
      ],
      execution_time_ms: 0,
    };
  }

  const inventaris = await queryOne<{ stok: string | null }>(
    `SELECT stok FROM inventaris_produk WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
    [best.produk_sample_id, koperasiRef],
  );

  const stokSekarang = Number(inventaris?.stok ?? 0);
  const resolvedUnit = unit ?? best.unit ?? "";
  const draft: PendingBarangMasukDraft = {
    produk_sample_id: best.produk_sample_id,
    nama_produk: best.nama_produk ?? productQuery,
    jumlah_masuk: qty,
    harga_beli: hargaBeli ?? 0,
    unit: resolvedUnit,
    stok_sekarang: stokSekarang,
  };

  const lastHarga = await getLastHargaBeli(best.produk_sample_id, koperasiRef);
  const reply = await generateBarangMasukReply({
    intent: "barang_masuk",
    userMessage: command,
    situation: hargaBeli
      ? `${draft.nama_produk} ${qty} ${resolvedUnit} siap disimpan. Stok sekarang ${stokSekarang}.`
      : `Catat ${draft.nama_produk} ${qty} ${resolvedUnit}. Stok sekarang ${stokSekarang}. Tanya harga beli.`,
    facts: { stok_sekarang: stokSekarang, harga_beli: draft.harga_beli, produk: draft.nama_produk },
    draft,
    lastHargaBeli: lastHarga,
  }, hargaBeli ? "need_confirm" : "need_harga");

  return {
    success: true,
    in_scope: true,
    intent: "barang_masuk",
    summary: reply.summary,
    data: [{ produk: draft.nama_produk, qty: draft.jumlah_masuk, stok_sekarang: stokSekarang, harga_beli: draft.harga_beli || "belum diisi" }],
    pending_barang_masuk: draft,
    action: hargaBeli ? { type: "confirm_barang_masuk", payload: draft } : undefined,
    suggested_prompts: reply.suggested_prompts,
    execution_time_ms: 0,
  };
}

async function handleQuery(command: string): Promise<CopilotChatResponse> {
  const koperasiRef = getKoperasiRef();
  const schema = await getSchemaDescription();
  const sql = await generateSql(command, schema, koperasiRef);
  const validation = validateChatSql(sql, koperasiRef);

  if (!validation.valid) {
    const reply = { summary: `Tidak bisa menjalankan query: ${validation.reason}`, suggested_prompts: ["Stok barangku", "Laporan penjualan minggu ini"] };
    return {
      success: false,
      in_scope: true,
      intent: "query",
      summary: reply.summary,
      explanation: validation.reason,
      suggested_prompts: reply.suggested_prompts,
      error: validation.reason,
      execution_time_ms: 0,
    };
  }

  const safeSql = enforceRowLimit(sql);
  const data = await query<Record<string, unknown>>(safeSql);
  const summary = await generateSummary(command, data);

  const followUp = data.length > 0
    ? { suggested_prompts: ["Stok barang menipis", "Laporan penjualan minggu ini"] }
    : { suggested_prompts: ["Stok barangku", "Tampilkan semua produk"] };

  return {
    success: true,
    in_scope: true,
    intent: "query",
    summary,
    sql: safeSql,
    data,
    suggested_prompts: followUp.suggested_prompts,
    execution_time_ms: 0,
  };
}

export async function orchestrateChat(command: string, context?: ChatContext): Promise<CopilotChatResponse> {
  const start = Date.now();

  if (context?.pending_tambah_produk) {
    const result = await handlePendingTambahProduk(command, context);
    result.execution_time_ms = Date.now() - start;
    return result;
  }

  if (context?.pending_barang_masuk) {
    const result = await handleBarangMasuk(command, context);
    result.execution_time_ms = Date.now() - start;
    return result;
  }

  const intent = await classifyIntent(command, {
    pending_barang_masuk: false,
  });

  if (!intent.in_scope || intent.intent === "out_of_scope") {
    const maybeBarang = parseBarangMasukText(command) ?? parseProductOnly(command);
    if (maybeBarang) {
      const result = await handleBarangMasuk(command, context);
      result.execution_time_ms = Date.now() - start;
      return result;
    }

    const outReply = getOutOfScopeReply();

    return {
      success: true,
      in_scope: false,
      intent: "out_of_scope",
      summary: outReply.summary,
      suggested_prompts: outReply.suggested_prompts,
      execution_time_ms: Date.now() - start,
    };
  }

  let result: CopilotChatResponse;

  switch (intent.intent) {
    case "help": {
      const helpReply = getHelpReply();
      result = {
        success: true,
        in_scope: true,
        intent: "help",
        summary: helpReply.summary,
        suggested_prompts: helpReply.suggested_prompts,
        execution_time_ms: Date.now() - start,
      };
      break;
    }

    case "pengajuan_rekening": {
      const bank = intent.bank_name ?? "BRI";
      const kode = bank === "BRI" ? "002" : bank === "BCA" ? "014" : "001";
      result = await handlePengajuanRekening(bank, kode);
      break;
    }

    case "upload_nota": {
      const notaReply = getUploadNotaReply();
      result = {
        success: true,
        in_scope: true,
        intent: "upload_nota",
        summary: notaReply.summary,
        action: { type: "upload_nota" },
        suggested_prompts: notaReply.suggested_prompts,
        execution_time_ms: Date.now() - start,
      };
      break;
    }

    case "barang_masuk":
      result = await handleBarangMasuk(command, context);
      break;

    case "tambah_produk":
      result = await handleTambahProduk(command);
      break;

    case "profil_info":
      result = await handleProfilInfo(command);
      break;

    case "query":
    default:
      result = await handleQuery(command);
      break;
  }

  result.execution_time_ms = Date.now() - start;
  return result;
}
