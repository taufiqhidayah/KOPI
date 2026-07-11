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
