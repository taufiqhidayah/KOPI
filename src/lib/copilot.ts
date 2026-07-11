import { getKoperasiRef, query, queryOne } from "./db";
import { classifyIntent, getHelpReply, getOutOfScopeReply, getUploadNotaReply } from "./intent";
import { generateSql, generateSummary, generateDraftSurat } from "./llm";
import { generateBarangMasukReply, type PendingBarangMasukDraft, resolveBarangMasukPhase, advanceBarangMasukPhase } from "./copilot-reply";
import {
  parseBarangMasukText,
  parseHargaBeli,
  isBarangMasukConfirm,
  parseProductOnly,
  isTambahProdukConfirm,
  isTambahProdukTanpaStok,
  parseBarangMasukExtras,
  parseHargaJual,
  parseKeterangan,
  parseNamaTampilan,
  isSkipHargaJual,
  isSkipKeterangan,
  isSkipDokumentasi,
  isDokumentasiUploaded,
  parseTambahProdukQty,
} from "./parse-barang-masuk";
import { findBestProduct } from "./product-match";
import {
  buildTambahProdukSuggestions,
  buildTambahProdukSummary,
  extractTambahProdukName,
  normalizeProdukName,
  normalizeUnit,
  sanitizeProdukName,
  type TambahProdukPrefill,
} from "./tambah-produk-guide";
import {
  formatProdukMetaSummary,
  isProdukMetaComplete,
  mergeProdukMeta,
  parseProdukMetaFromText,
  resolveProdukMeta,
} from "./produk-meta";
import { getSchemaDescription } from "./schema";
import { enforceRowLimit, validateChatSql } from "./security";
import { COPILOT_CAPABILITIES } from "./copilot-scope";
import { buildReportSummary, buildReportView, type ReportView } from "./report-format";

export type { PendingBarangMasukDraft } from "./copilot-reply";

export type PendingTambahProdukDraft = {
  nama_produk: string;
  unit?: string;
  jumlah_masuk?: number;
  harga_beli?: number;
  kategori?: string;
  jenis_barang?: string;
  potensi_desa?: string;
  penyedia?: string;
};

export type PendingPengajuanDraft = {
  kode_bank: string;
  nama_bank: string;
  preview: Record<string, unknown>;
  draft_surat: string;
};

export type ChatContext = {
  pending_barang_masuk?: PendingBarangMasukDraft;
  pending_tambah_produk?: PendingTambahProdukDraft;
  pending_pengajuan?: PendingPengajuanDraft;
};

export type ChatAction =
  | { type: "confirm_pengajuan"; payload: { kode_bank: string; nama_bank: string; preview: Record<string, unknown> } }
  | { type: "confirm_barang_masuk"; payload: PendingBarangMasukDraft }
  | { type: "confirm_tambah_produk"; payload: PendingTambahProdukDraft }
  | { type: "upload_nota" }
  | { type: "show_barang_masuk_form" }
  | { type: "upload_dokumentasi" };

export type CopilotChatResponse = {
  success: boolean;
  in_scope: boolean;
  intent: string;
  summary: string;
  explanation?: string;
  data?: Record<string, unknown>[];
  report?: ReportView;
  sql?: string;
  capabilities?: typeof COPILOT_CAPABILITIES;
  suggested_prompts?: string[];
  action?: ChatAction;
  draft_surat?: string;
  error?: string;
  pending_barang_masuk?: PendingBarangMasukDraft;
  pending_tambah_produk?: PendingTambahProdukDraft;
  pending_pengajuan?: PendingPengajuanDraft;
  execution_time_ms: number;
};

function isSkipHarga(text: string): boolean {
  return /tanpa harga|lewati harga|skip harga|simpan tanpa/i.test(text.toLowerCase()) && !/harga jual/i.test(text.toLowerCase());
}

function initDraftPhase(draft: PendingBarangMasukDraft): PendingBarangMasukDraft {
  const d = { ...draft };

  if (d.phase === "confirm") return d;

  if (d.phase === "dokumentasi") {
    if (d.dokumentasi_nama || d.skip_dokumentasi) d.phase = "confirm";
    return d;
  }

  if (d.phase === "keterangan") {
    if (!d.keterangan && !d.skip_keterangan) return d;
    d.phase = "dokumentasi";
    return initDraftPhase(d);
  }

  if (d.phase === "harga_jual") {
    if ((!d.harga_jual || d.harga_jual <= 0) && !d.skip_harga_jual) return d;
    d.phase = "keterangan";
    return initDraftPhase(d);
  }

  if (d.phase === "harga_beli") {
    if (d.harga_beli <= 0) return d;
    d.phase = "harga_jual";
    return initDraftPhase(d);
  }

  if (d.harga_beli <= 0) {
    d.phase = "harga_beli";
    return d;
  }

  d.phase = "harga_jual";
  return initDraftPhase(d);
}

function applyExtrasToDraft(draft: PendingBarangMasukDraft, command: string): PendingBarangMasukDraft {
  const extras = parseBarangMasukExtras(command);
  const next = { ...draft };
  if (extras.nama_tampilan) next.nama_tampilan = extras.nama_tampilan;
  if (extras.harga_jual && extras.harga_jual > 0) next.harga_jual = extras.harga_jual;
  if (extras.keterangan) next.keterangan = extras.keterangan;
  const namaTampilan = parseNamaTampilan(command);
  if (namaTampilan) next.nama_tampilan = namaTampilan;
  const ket = parseKeterangan(command);
  if (ket) next.keterangan = ket;
  return next;
}

async function replyFromDraft(
  draft: PendingBarangMasukDraft,
  command: string,
  situation: string,
  lastHarga?: number,
  withConfirm = false,
): Promise<CopilotChatResponse> {
  const phase = resolveBarangMasukPhase(draft);
  const reply = await generateBarangMasukReply({
    intent: "barang_masuk",
    userMessage: command,
    situation,
    draft,
    lastHargaBeli: lastHarga,
  }, phase);

  return {
    success: true,
    in_scope: true,
    intent: "barang_masuk",
    summary: reply.summary,
    data: [{
      produk: draft.nama_tampilan ?? draft.nama_produk,
      qty: draft.jumlah_masuk,
      harga_beli: draft.harga_beli,
      harga_jual: draft.harga_jual,
      keterangan: draft.keterangan,
      dokumentasi: draft.dokumentasi_nama,
    }],
    pending_barang_masuk: draft,
    action: withConfirm || phase === "need_confirm"
      ? { type: "confirm_barang_masuk", payload: draft }
      : phase === "need_dokumentasi"
        ? { type: "upload_dokumentasi" }
        : undefined,
    suggested_prompts: reply.suggested_prompts,
    execution_time_ms: 0,
  };
}

async function handlePendingBarangMasukDraft(
  command: string,
  context: ChatContext,
): Promise<CopilotChatResponse> {
  const koperasiRef = getKoperasiRef();
  let draft = applyExtrasToDraft({ ...context.pending_barang_masuk! }, command);
  draft = initDraftPhase(draft);
  const lastHarga = await getLastHargaBeli(draft.produk_sample_id, koperasiRef);

  if (isHargaLookup(command)) {
    return replyFromDraft(draft, command, "lookup harga", lastHarga);
  }

  if (/^batal$/i.test(command.trim())) {
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
      summary: "Oke, barang masuk dibatalkan.",
      suggested_prompts: reply.suggested_prompts,
      execution_time_ms: 0,
    };
  }

  if (isDokumentasiUploaded(command) && draft.dokumentasi_nama) {
    draft = advanceBarangMasukPhase({ ...draft, phase: "dokumentasi" });
    draft.phase = "confirm";
    return replyFromDraft(draft, command, "dokumentasi terupload", lastHarga, true);
  }

  if (isBarangMasukConfirm(command) && draft.harga_beli > 0) {
    draft.phase = "confirm";
    return replyFromDraft(draft, command, "konfirmasi simpan cepat", lastHarga, true);
  }

  const phase = draft.phase ?? "harga_beli";

  if (phase === "harga_beli") {
    const hargaInput = parseHargaBeli(command);
    const skipHarga = isSkipHarga(command);

    if (hargaInput !== undefined && hargaInput > 0) {
      draft.harga_beli = hargaInput;
      draft = advanceBarangMasukPhase(draft);
      draft = initDraftPhase(draft);
      return replyFromDraft(draft, command, "harga beli diisi", lastHarga);
    }

    if (skipHarga) {
      draft.harga_beli = 0;
      draft = advanceBarangMasukPhase(draft);
      draft = initDraftPhase(draft);
      return replyFromDraft(draft, command, "tanpa harga beli", lastHarga);
    }

    return replyFromDraft(draft, command, "menunggu harga beli", lastHarga);
  }

  if (phase === "harga_jual") {
    const hargaJual = parseHargaJual(command);
    if (hargaJual !== undefined && hargaJual > 0) {
      draft.harga_jual = hargaJual;
      draft = advanceBarangMasukPhase(draft);
      draft = initDraftPhase(draft);
      return replyFromDraft(draft, command, "harga jual diisi", lastHarga);
    }
    if (isSkipHargaJual(command)) {
      draft.skip_harga_jual = true;
      draft = advanceBarangMasukPhase(draft);
      draft = initDraftPhase(draft);
      return replyFromDraft(draft, command, "lewati harga jual", lastHarga);
    }
    return replyFromDraft(draft, command, "menunggu harga jual", lastHarga);
  }

  if (phase === "keterangan") {
    const ket = parseKeterangan(command);
    if (ket) {
      draft.keterangan = ket;
      draft = advanceBarangMasukPhase(draft);
      draft = initDraftPhase(draft);
      return replyFromDraft(draft, command, "keterangan diisi", lastHarga);
    }
    if (isSkipKeterangan(command)) {
      draft.skip_keterangan = true;
      draft = advanceBarangMasukPhase(draft);
      draft = initDraftPhase(draft);
      return replyFromDraft(draft, command, "lewati keterangan", lastHarga);
    }
    if (command.trim().length >= 3 && !isBarangMasukConfirm(command) && !looksLikeBarangInput(command)) {
      draft.keterangan = command.trim().slice(0, 1000);
      draft = advanceBarangMasukPhase(draft);
      draft = initDraftPhase(draft);
      return replyFromDraft(draft, command, "keterangan bebas", lastHarga);
    }
    return replyFromDraft(draft, command, "menunggu keterangan", lastHarga);
  }

  if (phase === "dokumentasi") {
    if (isSkipDokumentasi(command)) {
      draft.skip_dokumentasi = true;
      draft.phase = "confirm";
      return replyFromDraft(draft, command, "lewati dokumentasi", lastHarga, true);
    }
    if (draft.dokumentasi_nama) {
      draft.phase = "confirm";
      return replyFromDraft(draft, command, "dokumentasi ada", lastHarga, true);
    }
    return replyFromDraft(draft, command, "menunggu dokumentasi", lastHarga);
  }

  if (phase === "confirm" || isBarangMasukConfirm(command)) {
    draft.phase = "confirm";
    return replyFromDraft(draft, command, "konfirmasi simpan", lastHarga, true);
  }

  const hargaInput = parseHargaBeli(command);
  if (hargaInput !== undefined && hargaInput > 0) {
    draft.harga_beli = hargaInput;
    draft = initDraftPhase(draft);
    return replyFromDraft(draft, command, "update harga beli", lastHarga);
  }

  return replyFromDraft(draft, command, "menunggu konfirmasi", lastHarga, draft.phase === "confirm");
}

function isHargaLookup(text: string): boolean {
  return /harga.*terakhir|terakhir.*harga|riwayat.*harga|cek.*harga beli/i.test(text.toLowerCase());
}

function looksLikeBarangInput(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return (
    /tambah\s+produk/i.test(lower)
    || /\d+\s*(kg|kilo|kilogram|liter|galon|buah|pcs|karung|pack|dus)\b/i.test(lower)
    || /^[a-z\s]{3,30}\s+\d+/i.test(lower)
  );
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
    summary: `Siap bantu pengajuan rekening ${namaBank}.${missingText} Periksa draft surat lalu konfirmasi simpan.`,
    draft_surat: draftSurat,
    pending_pengajuan: {
      kode_bank: kodeBank,
      nama_bank: namaBank,
      preview: autoFilled,
      draft_surat: draftSurat,
    },
    suggested_prompts: ["Ya, simpan pengajuan", "Batal"],
    execution_time_ms: 0,
  };
}

async function handlePendingPengajuan(
  command: string,
  context: ChatContext,
): Promise<CopilotChatResponse> {
  const draft = context.pending_pengajuan!;

  if (/^batal$/i.test(command.trim())) {
    return {
      success: true,
      in_scope: true,
      intent: "pengajuan_rekening",
      summary: "Oke, pengajuan rekening dibatalkan.",
      suggested_prompts: ["Stok barangku", "Laporan penjualan minggu ini"],
      execution_time_ms: 0,
    };
  }

  if (isBarangMasukConfirm(command) || /simpan pengajuan/i.test(command)) {
    return {
      success: true,
      in_scope: true,
      intent: "pengajuan_rekening",
      summary: "Periksa data pengajuan di bawah. Jika sudah benar, konfirmasi simpan ke database.",
      draft_surat: draft.draft_surat,
      pending_pengajuan: draft,
      action: {
        type: "confirm_pengajuan",
        payload: {
          kode_bank: draft.kode_bank,
          nama_bank: draft.nama_bank,
          preview: draft.preview,
        },
      },
      suggested_prompts: ["Batal"],
      execution_time_ms: 0,
    };
  }

  return {
    success: true,
    in_scope: true,
    intent: "pengajuan_rekening",
    summary: `Masih menunggu konfirmasi pengajuan rekening ${draft.nama_bank}.`,
    draft_surat: draft.draft_surat,
    pending_pengajuan: draft,
    suggested_prompts: ["Ya, simpan pengajuan", "Batal"],
    execution_time_ms: 0,
  };
}

async function handleProfilInfo(command: string): Promise<CopilotChatResponse> {
  const koperasiRef = getKoperasiRef();

  const profil = await queryOne<{
    nama_koperasi: string | null;
    nik_koperasi: string | null;
    alamat_lengkap: string | null;
    status_registrasi: string | null;
  }>(
    `SELECT nama_koperasi, nik_koperasi, alamat_lengkap, status_registrasi FROM profil_koperasi WHERE koperasi_ref = $1`,
    [koperasiRef],
  );

  const pengurus = await query<{ nama: string | null; jabatan: string | null; no_hp: string | null }>(
    `SELECT nama, jabatan, no_hp FROM pengurus_koperasi WHERE koperasi_ref = $1 LIMIT 10`,
    [koperasiRef],
  );

  const dokumen = await query<{ jenis_dokumen_ref: string | null; nomor: string | null }>(
    `SELECT jenis_dokumen_ref, nomor FROM dokumen_koperasi WHERE koperasi_ref = $1 LIMIT 20`,
    [koperasiRef],
  );

  const lower = command.toLowerCase();
  let summary: string;

  if (/ketua|siapa.*ketua/i.test(lower)) {
    const ketua = pengurus.find((p) => /ketua/i.test(p.jabatan ?? ""));
    summary = ketua
      ? `Ketua ${profil?.nama_koperasi ?? "koperasi"}: ${ketua.nama} (${ketua.jabatan}${ketua.no_hp ? `, ${ketua.no_hp}` : ""}).`
      : `Data ketua belum tercatat untuk ${profil?.nama_koperasi ?? "koperasi ini"}.`;
  } else if (/pengurus/i.test(lower)) {
    summary = pengurus.length
      ? `Pengurus ${profil?.nama_koperasi ?? "koperasi"}: ${pengurus.map((p) => `${p.nama} (${p.jabatan})`).join(", ")}.`
      : "Belum ada data pengurus.";
  } else if (/dokumen/i.test(lower)) {
    summary = dokumen.length
      ? `Dokumen tercatat: ${dokumen.map((d) => d.jenis_dokumen_ref).filter(Boolean).join(", ")}.`
      : "Belum ada dokumen tercatat (SKAHU, NIB, NPWP belum diupload).";
  } else {
    summary = profil
      ? `${profil.nama_koperasi} — NIK ${profil.nik_koperasi ?? "-"}, ${profil.alamat_lengkap ?? "alamat belum diisi"}. Status: ${profil.status_registrasi ?? "-"}.`
      : "Profil koperasi belum ditemukan.";
  }

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
  const namaProduk = sanitizeProdukName(prefill.nama_produk);
  const unit = normalizeUnit(prefill.satuan);
  const meta = resolveProdukMeta(namaProduk, unit, {
    kategori: prefill.kategori,
    jenis_barang: prefill.jenis_barang,
    potensi_desa: prefill.potensi_desa,
    penyedia: prefill.penyedia,
  });

  const draft: PendingTambahProdukDraft = {
    nama_produk: namaProduk,
    unit,
    jumlah_masuk: prefill.jumlah,
    harga_beli: prefill.harga_beli,
    ...meta,
  };

  const metaSummary = formatProdukMetaSummary(meta);
  const needsMeta = !isProdukMetaComplete(meta);

  return {
    success: true,
    in_scope: true,
    intent: "tambah_produk",
    summary: needsMeta
      ? `${buildTambahProdukSummary({ ...prefill, nama_produk: namaProduk, satuan: unit })} Saya isi sementara: ${metaSummary}. Bisa ubah lewat saran di bawah.`
      : `${buildTambahProdukSummary({ ...prefill, nama_produk: namaProduk, satuan: unit })} ${metaSummary}.`,
    explanation: "Data kategori, jenis barang, potensi desa, dan penyedia ikut disimpan ke daftar produk.",
    data: [{
      nama_produk: namaProduk,
      satuan: unit,
      kategori: meta.kategori,
      jenis_barang: meta.jenis_barang,
      potensi_desa: meta.potensi_desa,
      penyedia: meta.penyedia ?? "-",
      ...(prefill.jumlah ? { jumlah_masuk: prefill.jumlah } : {}),
    }],
    pending_tambah_produk: draft,
    suggested_prompts: buildTambahProdukSuggestions({ ...prefill, nama_produk: namaProduk, satuan: unit, ...meta }, existingProducts),
    execution_time_ms: 0,
  };
}

function applyMetaToTambahDraft(
  draft: PendingTambahProdukDraft,
  command: string,
): PendingTambahProdukDraft {
  const parsed = parseProdukMetaFromText(command);
  const merged = mergeProdukMeta(
    resolveProdukMeta(draft.nama_produk, draft.unit, draft),
    parsed,
  );
  return { ...draft, ...merged };
}

async function handleTambahProduk(command: string): Promise<CopilotChatResponse> {
  const parsed = parseTambahProdukQty(command);
  const meta = parseProdukMetaFromText(command);
  const prefill: TambahProdukPrefill = {
    nama_produk: extractTambahProdukName(command),
    satuan: parsed?.unit,
    jumlah: parsed?.qty,
    harga_beli: parsed?.hargaBeli ?? parseHargaBeli(command),
    ...meta,
  };

  return offerTambahProduk(prefill);
}

async function handlePendingTambahProduk(
  command: string,
  context: ChatContext,
): Promise<CopilotChatResponse> {
  const draft = applyMetaToTambahDraft({ ...context.pending_tambah_produk! }, command);

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
        kategori: draft.kategori,
        jenis_barang: draft.jenis_barang,
        potensi_desa: draft.potensi_desa,
        penyedia: draft.penyedia,
      }),
      summary: `Oke, tambah ${draft.nama_produk} tanpa stok awal. Periksa data lalu konfirmasi.`,
      pending_tambah_produk: draft,
      suggested_prompts: ["Ya, tambah produk", "Batal"],
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
        kategori: draft.kategori,
        jenis_barang: draft.jenis_barang,
        potensi_desa: draft.potensi_desa,
        penyedia: draft.penyedia,
      }),
      summary: `Harga beli ${draft.nama_produk} Rp ${hargaInput.toLocaleString("id-ID")}. Periksa data lalu konfirmasi tambah produk${draft.jumlah_masuk ? ` dan catat ${draft.jumlah_masuk} ${draft.unit ?? ""} masuk` : ""}.`,
      pending_tambah_produk: draft,
      suggested_prompts: ["Ya, tambah produk", "Batal"],
    };
  }

  if (isTambahProdukConfirm(command)) {
    const meta = resolveProdukMeta(draft.nama_produk, draft.unit, draft);
    const finalDraft = { ...draft, ...meta };
    return {
      ...offerTambahProduk({
        nama_produk: finalDraft.nama_produk,
        satuan: finalDraft.unit,
        jumlah: finalDraft.jumlah_masuk,
        harga_beli: finalDraft.harga_beli,
        kategori: finalDraft.kategori,
        jenis_barang: finalDraft.jenis_barang,
        potensi_desa: finalDraft.potensi_desa,
        penyedia: finalDraft.penyedia,
      }),
      summary: `Periksa data ${finalDraft.nama_produk} di bawah. Jika sudah benar, konfirmasi simpan ke database.`,
      pending_tambah_produk: finalDraft,
      action: { type: "confirm_tambah_produk", payload: finalDraft },
      suggested_prompts: ["Batal"],
    };
  }

  const metaOnly = parseProdukMetaFromText(command);
  if (Object.keys(metaOnly).length > 0) {
    return {
      ...offerTambahProduk({
        nama_produk: draft.nama_produk,
        satuan: draft.unit,
        jumlah: draft.jumlah_masuk,
        harga_beli: draft.harga_beli,
        kategori: draft.kategori,
        jenis_barang: draft.jenis_barang,
        potensi_desa: draft.potensi_desa,
        penyedia: draft.penyedia,
      }),
      pending_tambah_produk: draft,
      summary: `Oke, data produk diperbarui: ${formatProdukMetaSummary(draft)}.`,
      suggested_prompts: ["Ya, tambah produk", "Batal"],
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
    return handlePendingBarangMasukDraft(command, context);
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
      return offerTambahProduk({ nama_produk: productQuery, satuan: unit, ...parseProdukMetaFromText(command) }, existingNames);
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
        {
          nama_produk: productQuery,
          satuan: unit,
          jumlah: qty,
          harga_beli: hargaBeli,
          ...parseProdukMetaFromText(command),
        },
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
  const extras = parseBarangMasukExtras(command);
  let draft: PendingBarangMasukDraft = {
    produk_sample_id: best.produk_sample_id,
    nama_produk: best.nama_produk ?? productQuery,
    nama_tampilan: extras.nama_tampilan,
    jumlah_masuk: qty,
    harga_beli: hargaBeli ?? 0,
    harga_jual: extras.harga_jual,
    keterangan: extras.keterangan,
    unit: resolvedUnit,
    stok_sekarang: stokSekarang,
  };
  draft = initDraftPhase(draft);

  const lastHarga = await getLastHargaBeli(best.produk_sample_id, koperasiRef);
  const uiPhase = resolveBarangMasukPhase(draft);
  const reply = await generateBarangMasukReply({
    intent: "barang_masuk",
    userMessage: command,
    situation: `Catat ${draft.nama_produk} ${qty} ${resolvedUnit}. Stok sekarang ${stokSekarang}.`,
    facts: { stok_sekarang: stokSekarang, harga_beli: draft.harga_beli, produk: draft.nama_produk },
    draft,
    lastHargaBeli: lastHarga,
  }, uiPhase);

  return {
    success: true,
    in_scope: true,
    intent: "barang_masuk",
    summary: reply.summary,
    data: [{
      produk: draft.nama_tampilan ?? draft.nama_produk,
      qty: draft.jumlah_masuk,
      stok_sekarang: stokSekarang,
      harga_beli: draft.harga_beli || "belum diisi",
      harga_jual: draft.harga_jual,
    }],
    pending_barang_masuk: draft,
    action: uiPhase === "need_confirm"
      ? { type: "confirm_barang_masuk", payload: draft }
      : uiPhase === "need_dokumentasi"
        ? { type: "upload_dokumentasi" }
        : undefined,
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
  const report = buildReportView(command, data);
  const summary = report
    ? buildReportSummary(command, data, report)
    : await generateSummary(command, data);

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
    report: report ?? undefined,
    suggested_prompts: followUp.suggested_prompts,
    execution_time_ms: 0,
  };
}

export async function orchestrateChat(command: string, context?: ChatContext): Promise<CopilotChatResponse> {
  const start = Date.now();

  if (context?.pending_pengajuan) {
    const result = await handlePendingPengajuan(command, context);
    result.execution_time_ms = Date.now() - start;
    return result;
  }

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

  if (/tambah barang masuk|form barang masuk|buka form barang masuk/i.test(command.toLowerCase().trim())) {
    return {
      success: true,
      in_scope: true,
      intent: "barang_masuk",
      summary:
        "Siap catat barang masuk lewat chat. Sebut produk + jumlah, misalnya \"beras 10 kg harga beli 12000 harga jual 15000 keterangan: dari supplier Makmur\". Upload foto nota/dokumentasi lewat 📷.",
      suggested_prompts: ["beras 10 kg premium", "Upload foto nota", "Stok barangku"],
      execution_time_ms: Date.now() - start,
    };
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
