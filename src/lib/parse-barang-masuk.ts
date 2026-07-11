export type ParsedBarangMasuk = {
  qty: number;
  unit?: string;
  productQuery: string;
  hargaBeli?: number;
};

const PRODUCT_HINTS =
  /beras|gula|aqua|galon|premium|pasir|minyak|telur|susu|kopi|teh|sabun|detergen|biskuit|mie|indomie/i;

const ACTION_HINTS = /masuk|tambah|catat|beli|terima|input|simpan|stock|stok/i;

const UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(kilo|kg|kilogram|karung|galon|liter|buah|pcs|pack|dus)?/i;

export function parseHargaBeli(text: string): number | undefined {
  const lower = text.toLowerCase();
  const labeled = lower.match(/(?:harga\s*beli|beli|@|rp\.?)\s*([\d.,]+)/i);
  if (labeled) return parseRupiah(labeled[1]);

  const hargaOnly = lower.match(/\bharga\s*([\d.,]+)/i);
  if (hargaOnly && !/harga\s*jual/i.test(lower)) return parseRupiah(hargaOnly[1]);

  const bare = lower.match(/\b(\d{4,})\b/);
  if (bare && !UNIT_PATTERN.test(lower.replace(bare[0], "")) && !/harga\s*jual/i.test(lower)) {
    return parseRupiah(bare[1]);
  }

  return undefined;
}

export function parseHargaJual(text: string): number | undefined {
  const match = text.toLowerCase().match(/(?:harga\s*jual|jual)\s*(?:rp\.?)?\s*([\d.,]+)/i);
  if (match) return parseRupiah(match[1]);
  return undefined;
}

export function parseKeterangan(text: string): string | undefined {
  const match = text.match(/(?:keterangan|ket|catatan|dari\s+supplier)\s*[:\-]?\s*(.+)/i);
  if (match) return match[1].trim().slice(0, 1000);
  return undefined;
}

export function parseNamaTampilan(text: string): string | undefined {
  const match = text.match(/(?:nama\s*tampilan|tampilan)\s*[:\-]?\s*(.+)/i);
  if (match) return match[1].trim().slice(0, 200);
  return undefined;
}

export type BarangMasukExtras = {
  harga_jual?: number;
  keterangan?: string;
  nama_tampilan?: string;
};

export function parseBarangMasukExtras(text: string): BarangMasukExtras {
  return {
    harga_jual: parseHargaJual(text),
    keterangan: parseKeterangan(text),
    nama_tampilan: parseNamaTampilan(text),
  };
}

export function isSkipOptionalField(text: string): boolean {
  return /^(lewati|skip|tanpa|tidak ada|nanti|belum|\-)$/i.test(text.trim())
    || /lewati\s+(harga\s*jual|keterangan|dokumentasi|lampiran)/i.test(text)
    || /tanpa\s+(harga\s*jual|keterangan|dokumentasi|lampiran)/i.test(text)
    || /^tidak\s+ada\s+(keterangan|dokumentasi|lampiran)/i.test(text);
}

export function isSkipHargaJual(text: string): boolean {
  return /tanpa harga jual|lewati harga jual|skip harga jual/i.test(text.toLowerCase());
}

export function isSkipKeterangan(text: string): boolean {
  return /tanpa keterangan|lewati keterangan|skip keterangan|tidak ada keterangan/i.test(text.toLowerCase());
}

export function isSkipDokumentasi(text: string): boolean {
  return /tanpa dokumentasi|tanpa lampiran|lewati dokumentasi|lewati lampiran|skip dokumentasi/i.test(text.toLowerCase());
}

export function isDokumentasiUploaded(text: string): boolean {
  return /dokumentasi\s*(sudah|terupload|terunggah)|lampiran\s*(sudah|terupload|terunggah)/i.test(text.toLowerCase());
}

function parseRupiah(raw: string): number {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/permium/g, "premium")
    .replace(/premiun/g, "premium")
    .trim();
}

export function parseBarangMasukText(text: string): ParsedBarangMasuk | null {
  const lower = normalizeText(text);
  const qtyMatch = lower.match(UNIT_PATTERN);
  if (!qtyMatch) return null;

  const hasProduct = PRODUCT_HINTS.test(lower);
  const hasAction = ACTION_HINTS.test(lower);
  if (!hasProduct && !hasAction) return null;

  const qty = parseFloat(qtyMatch[1].replace(",", "."));
  if (!qty || qty <= 0) return null;

  const hargaBeli = parseHargaBeli(text);

  const productQuery = lower
    .replace(UNIT_PATTERN, " ")
    .replace(/(?:harga|beli|@|rp\.?)\s*[\d.,]+/gi, " ")
    .replace(
      /\b(masuk|tambah|catat|beli|terima|input|simpan|tolong|bantu|dong|ya|saya|mau|ada|barang|barangku|stok)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (productQuery.length < 2) return null;

  return {
    qty,
    unit: qtyMatch[2],
    productQuery,
    hargaBeli,
  };
}

export function parseProductOnly(text: string): { productQuery: string } | null {
  if (parseBarangMasukText(text)) return null;

  const lower = normalizeText(text).trim();
  if (lower.length < 3) return null;

  if (/^(help|bantuan|stok|laporan|penjualan|berapa|cek|lihat|tampilkan|buatkan|siapa|buka|bank|rekening)/i.test(lower)) {
    return null;
  }

  if (PRODUCT_HINTS.test(lower)) {
    return { productQuery: lower };
  }

  if (/^[a-z\s]{3,40}$/i.test(lower) && !/^(ya|ok|batal|iya)$/i.test(lower)) {
    return { productQuery: lower };
  }

  return null;
}

export function isBarangMasukConfirm(text: string): boolean {
  return /^(ya|iya|ok|oke|benar|simpan|catat|lanjut|konfirmasi)/i.test(text.trim());
}

export function isTambahProdukConfirm(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    isBarangMasukConfirm(text) ||
    /tambah produk|ya,? tambah|tambahkan produk/i.test(t)
  );
}

export function isTambahProdukTanpaStok(text: string): boolean {
  return /tanpa stok|tambah saja/i.test(text.toLowerCase());
}
