import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "barang-masuk");
const PUBLIC_PREFIX = "/uploads/barang-masuk";

export function canWriteUploadsToDisk(): boolean {
  return !process.env.VERCEL;
}

export function extFromMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "application/pdf") return ".pdf";
  return ".jpg";
}

/** Simpan ke disk hanya di lingkungan lokal (bukan Vercel). */
export async function saveBarangMasukDokumentasi(
  data: Buffer,
  opts: { ref: string; mimeType: string },
): Promise<string | undefined> {
  if (!canWriteUploadsToDisk()) return undefined;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${opts.ref}${extFromMime(opts.mimeType)}`;
  const diskPath = path.join(UPLOAD_DIR, filename);
  await writeFile(diskPath, data);
  return `${PUBLIC_PREFIX}/${filename}`;
}
