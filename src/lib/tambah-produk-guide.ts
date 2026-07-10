export type TambahProdukPrefill = {
  nama_produk: string;
  satuan?: string;
  jumlah?: number;
  harga_beli?: number;
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

export function normalizeUnit(unit?: string): string {
  if (!unit) return "unit";
  const u = unit.toLowerCase();
  if (u === "kilo" || u === "kilogram") return "kg";
  return u;
}

export function buildTambahProdukSummary(prefill: TambahProdukPrefill): string {
  const unit = normalizeUnit(prefill.satuan);
  const nama = normalizeProdukName(prefill.nama_produk);
  if (prefill.jumlah && prefill.jumlah > 0) {
    return `"${nama}" belum ada di master. Mau saya tambahkan (satuan ${unit}) sekaligus catat ${prefill.jumlah} ${unit} masuk?`;
  }
  return `"${nama}" belum ada di master produk. Mau saya tambahkan via chat (satuan ${unit})?`;
}

export function buildTambahProdukSuggestions(
  prefill: TambahProdukPrefill,
  existingProducts: string[] = [],
): string[] {
  const suggestions: string[] = prefill.jumlah
    ? ["Ya, tambah produk", "Tambah saja, tanpa stok", "Batal"]
    : ["Ya, tambah produk", "Batal"];

  if (existingProducts.length && !prefill.jumlah) {
    suggestions.unshift(`Maksudnya ${existingProducts[0]}?`);
  }

  return suggestions.slice(0, 3);
}
