export type TambahProdukPrefill = {
  nama_produk: string;
  satuan?: string;
  jumlah?: number;
  harga_beli?: number;
  kategori?: string;
  jenis_barang?: string;
  potensi_desa?: string;
  penyedia?: string;
};

export const TAMBAH_PRODUK_CHECKLIST = [
  "Produk Nasional — pilih dari daftar, atau BARANG LAINNYA jika tidak ada",
  "Nama Produk",
  "Satuan",
  "Kategori Produk",
  "Potensi Desa",
  "Pemasok/Penyedia",
  "Kategori Barang Bersubsidi",
] as const;

export function normalizeProdukName(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const PRODUK_NAME_PREFIX_PATTERNS = [
  /^tambah\s+produk\s+baru\s*[:\-]?\s*/i,
  /^tambah\s+produk\s*[:\-]?\s*/i,
  /^produk\s+baru\s*[:\-]?\s*/i,
  /^tambahkan?\s+produk\s*/i,
  /^maksudnya\s+/i,
  /^barang\s+lain\s*[:\-]?\s*/i,
  /^ya,?\s*tambah\s+(?:produk\s*)?/i,
];

export function extractProdukName(text: string): string {
  let name = text.trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (const pattern of PRODUK_NAME_PREFIX_PATTERNS) {
      const next = name.replace(pattern, "").trim();
      if (next !== name) {
        name = next;
        changed = true;
      }
    }
  }

  return name.replace(/^[:\-]\s*/, "").trim();
}

export function sanitizeProdukName(text: string): string {
  const extracted = extractProdukName(text);
  if (!extracted) return normalizeProdukName(text.trim());
  return normalizeProdukName(extracted);
}

export function normalizeUnit(unit?: string): string {
  if (!unit) return "unit";
  const u = unit.toLowerCase();
  if (u === "kilo" || u === "kilogram") return "kg";
  return u;
}

export function buildTambahProdukSummary(prefill: TambahProdukPrefill): string {
  const unit = normalizeUnit(prefill.satuan);
  const nama = normalizeProdukName(prefill.nama_produk);
  const metaHint = prefill.kategori ? ` (${prefill.kategori})` : "";
  if (prefill.jumlah && prefill.jumlah > 0) {
    return `"${nama}"${metaHint} belum ada di master. Mau saya tambahkan (satuan ${unit}) sekaligus catat ${prefill.jumlah} ${unit} masuk?`;
  }
  return `"${nama}"${metaHint} belum ada di master produk. Mau saya tambahkan via chat (satuan ${unit})?`;
}

export function extractTambahProdukName(text: string): string {
  let body = text.trim();
  body = body.replace(/^tambah\s+produk\s*/i, "");
  body = body.replace(/(?:kategori(?:\s+produk)?)\s*[:\-]?\s*[\w\s]+/gi, " ");
  body = body.replace(/(?:jenis(?:\s+barang)?)\s*[:\-]?\s*[\w\s]+/gi, " ");
  body = body.replace(/(?:potensi(?:\s+desa)?)\s*[:\-]?\s*[\w\s]+/gi, " ");
  body = body.replace(/(?:penyedia|pemasok|supplier)\s*[:\-]?\s*[^,.\n]+/gi, " ");
  body = body.replace(/(?:harga\s*beli|harga|beli|@|rp\.?)\s*[\d.,]+/gi, " ");
  body = body.replace(/\bharga\b/gi, " ");
  body = body.replace(/\b\d+(?:[.,]\d+)?\s*(kg|kilo|kilogram|liter|galon|buah|pcs|pack|dus|karung)\b/gi, " ");
  body = body.replace(/\s+/g, " ").trim();
  return sanitizeProdukName(body);
}

export function buildTambahProdukSuggestions(
  prefill: TambahProdukPrefill,
  existingProducts: string[] = [],
): string[] {
  const suggestions: string[] = prefill.jumlah
    ? ["Ya, tambah produk", "Tambah saja, tanpa stok", "Batal"]
    : ["Ya, tambah produk", "Batal"];

  if (!prefill.kategori) {
    suggestions.unshift("Kategori: Sembako, penyedia: Makmur");
  }

  if (existingProducts.length && !prefill.jumlah) {
    suggestions.unshift(`Maksudnya ${existingProducts[0]}?`);
  }

  return suggestions.slice(0, 4);
}
