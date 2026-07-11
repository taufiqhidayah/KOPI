import { mergeProdukMeta, parseProdukMetaFromText, resolveProdukMeta, type ProdukMeta } from "./produk-meta";
import { normalizeUnit, sanitizeProdukName } from "./tambah-produk-guide";

export type NotaUnmatchedDraft = {
  nama: string;
  qty: number;
  harga: number;
  unit?: string;
  kategori?: string;
  jenis_barang?: string;
  potensi_desa?: string;
  penyedia?: string;
  reviewed?: boolean;
};

const GENERIC_SUPPLIERS = /^(nota|supplier|toko|warung|invoice|struk)$/i;

export function isMeaningfulNotaSupplier(supplier?: string): boolean {
  const value = supplier?.trim();
  if (!value || value.length < 3) return false;
  if (GENERIC_SUPPLIERS.test(value)) return false;
  return true;
}

export function inferUnitFromProductName(namaProduk: string): string {
  const n = namaProduk.toLowerCase();
  if (/gas|elpig|elpiji|lpg/.test(n)) return "tabung";
  if (/beras|gula|tepung|garam/.test(n)) return "kg";
  if (/aqua|air mineral|galon/.test(n)) return "galon";
  if (/minyak/.test(n)) return "liter";
  if (/mie|indomie/.test(n)) return "pack";
  return "unit";
}

export function prefillNotaUnmatched(
  nama: string,
  qty: number,
  harga: number,
  ocrSupplier?: string,
): NotaUnmatchedDraft {
  const unit = inferUnitFromProductName(nama);
  const meta = resolveProdukMeta(nama, unit);
  const penyedia = isMeaningfulNotaSupplier(ocrSupplier) ? ocrSupplier!.trim() : undefined;

  return {
    nama: sanitizeProdukName(nama),
    qty,
    harga,
    unit,
    kategori: meta.kategori,
    jenis_barang: meta.jenis_barang,
    potensi_desa: meta.potensi_desa,
    penyedia,
    reviewed: false,
  };
}

export function applyMetaToNotaUnmatched(draft: NotaUnmatchedDraft, text: string): NotaUnmatchedDraft {
  const parsed = parseProdukMetaFromText(text);
  const satuanMatch = text.match(/\b(?:satuan|unit)\s*[:\-]?\s*(\w+)/i);
  const merged = mergeProdukMeta(
    {
      kategori: draft.kategori,
      jenis_barang: draft.jenis_barang,
      potensi_desa: draft.potensi_desa,
      penyedia: draft.penyedia,
    },
    parsed,
  );

  return {
    ...draft,
    ...merged,
    unit: satuanMatch?.[1] ? normalizeUnit(satuanMatch[1]) : draft.unit,
    reviewed: false,
  };
}

export function getMissingNotaProductFields(draft: NotaUnmatchedDraft): string[] {
  const missing: string[] = [];
  if (!draft.unit?.trim()) missing.push("satuan");
  if (!draft.kategori?.trim()) missing.push("kategori");
  if (!draft.jenis_barang?.trim()) missing.push("jenis barang");
  if (!draft.potensi_desa?.trim()) missing.push("potensi desa");
  if (!draft.penyedia?.trim()) missing.push("penyedia");
  return missing;
}

export function isNotaUnmatchedComplete(draft: NotaUnmatchedDraft): boolean {
  return getMissingNotaProductFields(draft).length === 0;
}

export function buildNotaUnmatchedFollowUp(draft: NotaUnmatchedDraft): string {
  const missing = getMissingNotaProductFields(draft);
  const summary = formatNotaMetaSummary({
    kategori: draft.kategori,
    jenis_barang: draft.jenis_barang,
    potensi_desa: draft.potensi_desa,
    penyedia: draft.penyedia,
  });

  if (!missing.length) {
    return `"${draft.nama}" siap didaftarkan.${summary ? ` ${summary}.` : ""} Tap Simpan semua nota untuk konfirmasi.`;
  }

  const hint = missing.includes("penyedia")
    ? ' Contoh: "penyedia Toko Makmur, satuan tabung"'
    : ' Contoh: "kategori Kebutuhan Rumah Tangga, satuan tabung"';

  return `"${draft.nama}" belum ada di master. Lengkapi: ${missing.join(", ")}.${summary ? ` Sementara: ${summary}.` : ""}${hint}`;
}

function formatNotaMetaSummary(meta: ProdukMeta): string {
  const parts = [
    meta.kategori ? `Kategori ${meta.kategori}` : null,
    meta.jenis_barang ? `Jenis ${meta.jenis_barang}` : null,
    meta.potensi_desa ? `Potensi ${meta.potensi_desa}` : null,
    meta.penyedia ? `Penyedia ${meta.penyedia}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export type UnmatchedNotaItem = NotaUnmatchedDraft;

export function findFirstIncompleteUnmatched(
  queue: { id: string; unmatched: NotaUnmatchedDraft[] }[],
): { notaId: string; itemIndex: number; draft: NotaUnmatchedDraft } | null {
  for (const nota of queue) {
    for (let i = 0; i < nota.unmatched.length; i += 1) {
      if (!isNotaUnmatchedComplete(nota.unmatched[i])) {
        return { notaId: nota.id, itemIndex: i, draft: nota.unmatched[i] };
      }
    }
  }
  return null;
}

export function buildNotaSavePreviewFields(
  queue: {
    fileName: string;
    items: { nama_produk?: string; jumlah_masuk: number; harga_beli: number }[];
    unmatched: NotaUnmatchedDraft[];
  }[],
): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [
    { label: "Jumlah nota", value: String(queue.length) },
  ];

  let row = 1;
  for (const nota of queue) {
    for (const item of nota.items) {
      fields.push({
        label: `Item ${row} (master)`,
        value: `${item.nama_produk} · ${item.jumlah_masuk} @ Rp ${item.harga_beli.toLocaleString("id-ID")}`,
      });
      row += 1;
    }
    for (const item of nota.unmatched) {
      fields.push({
        label: `Item ${row} (baru)`,
        value: `${item.nama} · ${item.qty} ${item.unit ?? ""} @ Rp ${item.harga.toLocaleString("id-ID")} · ${item.kategori ?? "-"}`,
      });
      row += 1;
    }
  }

  return fields;
}
