export const DOKUMENTASI_MAX_BYTES = 10 * 1024 * 1024;

export const DOKUMENTASI_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]);

export function isImagePath(url: string): boolean {
  return /\.(jpg|jpeg|png|webp)$/i.test(url);
}

export function extractThumbnailUrl(keterangan: string | null | undefined): string | null {
  if (!keterangan) return null;
  const match = keterangan.match(/Lampiran:\s*(\/uploads\/barang-masuk\/[^\s,)]+)/i);
  if (!match) return null;
  const url = match[1];
  return isImagePath(url) ? url : null;
}

export function buildKeteranganWithDokumentasi(
  keterangan: string,
  dokumentasi?: { url?: string; nama?: string },
): string {
  const base = keterangan.trim();
  if (!dokumentasi?.url && !dokumentasi?.nama) return base.slice(0, 1000);

  const prefix = dokumentasi.url
    ? `Lampiran: ${dokumentasi.url}${dokumentasi.nama ? ` (${dokumentasi.nama})` : ""}`
    : `Lampiran: ${dokumentasi.nama}`;

  const combined = base ? `${prefix}. ${base}` : prefix;
  return combined.slice(0, 1000);
}

export function stripDokumentasiFromKeterangan(keterangan: string | null | undefined): string {
  if (!keterangan) return "";
  return keterangan
    .replace(/Lampiran:\s*\/uploads\/barang-masuk\/\S+(?:\s*\([^)]+\))?\s*\.?\s*/gi, "")
    .trim();
}

export function extractPenyediaLabel(keterangan: string | null | undefined): string {
  const cleaned = stripDokumentasiFromKeterangan(keterangan);
  if (!cleaned) return "";

  const metaMatch = cleaned.match(/@@PRODUK_META@@(\{[^}]+\})/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]) as { penyedia?: string };
      if (meta.penyedia?.trim()) return meta.penyedia.trim().slice(0, 100);
    } catch {
      // fall through
    }
  }

  const penyediaMatch = cleaned.match(/(?:penyedia|pemasok|supplier)\s*[:\-]?\s*([^|]+)/i);
  if (penyediaMatch) return penyediaMatch[1].trim().slice(0, 100);

  const dariMatch = cleaned.match(/(?:^|\|)\s*Dari\s+(.+)/i);
  if (dariMatch) return dariMatch[1].trim().slice(0, 100);

  if (
    /harga\s*(beli|jual)/i.test(cleaned)
    || /^(an|beras|tambah|produk)\b/i.test(cleaned)
    || /^\d+\s*(kg|kilo|liter)/i.test(cleaned)
    || /^@@PRODUK_META@@/.test(cleaned)
  ) {
    return "";
  }

  return cleaned.slice(0, 100);
}
