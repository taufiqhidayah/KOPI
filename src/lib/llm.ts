import { geminiText } from "./gemini";
import { formatLocalSummary, matchQueryTemplate } from "./query-templates";

export async function generateSql(
  command: string,
  schema: string,
  koperasiRef: string,
): Promise<string> {
  const template = matchQueryTemplate(command, koperasiRef);
  if (template) return template;

  try {
    const raw = await geminiText(
      `Kamu asisten SQL PostgreSQL untuk SIMKOPDES.
Aturan WAJIB:
- Hanya generate query SELECT
- Semua query HARUS ada WHERE koperasi_ref = '${koperasiRef}'
- Gunakan syntax PostgreSQL
- Sertakan LIMIT 100
- Return HANYA SQL tanpa markdown atau penjelasan
- Untuk laporan penjualan, join transaksi_penjualan dengan barang_keluar_produk via transaksi_sample_id`,
      `Skema database:\n${schema}\n\nPerintah: "${command}"`,
    );
    if (raw) return raw.replace(/^```sql\n?/i, "").replace(/```$/i, "").trim();
  } catch {
    /* fallback below */
  }
  const fallback = matchQueryTemplate("stok inventaris", koperasiRef);
  return fallback ?? `SELECT nama_produk, stok FROM inventaris_produk WHERE koperasi_ref = '${koperasiRef}' LIMIT 100`;
}

export async function generateSummary(
  command: string,
  data: Record<string, unknown>[],
): Promise<string> {
  try {
    const preview = JSON.stringify(data.slice(0, 10));
    const raw = await geminiText(
      "Kamu asisten koperasi desa. Buat ringkasan singkat dalam Bahasa Indonesia dari hasil query. Gunakan format Rupiah jika ada angka uang. Maksimal 3 kalimat.",
      `Perintah: "${command}"\nData: ${preview}`,
      0.3,
    );
    if (raw) return raw;
  } catch {
    /* fallback below */
  }
  return formatLocalSummary(command, data);
}

export async function generateDraftSurat(context: {
  namaKoperasi: string;
  alamat: string;
  namaPengurus: string;
  jabatan: string;
  namaBank: string;
}): Promise<string> {
  try {
    const raw = await geminiText(
      "Buat draft surat resmi permohonan pembukaan rekening bank untuk koperasi desa. Format formal Bahasa Indonesia.",
      JSON.stringify(context),
      0.4,
    );
    if (raw) return raw;
  } catch {
    /* fallback below */
  }
  return `Yth. Pimpinan ${context.namaBank}
Di Tempat

Dengan hormat,

Bersama ini ${context.namaKoperasi} yang beralamat di ${context.alamat} mengajukan permohonan pembukaan rekening bank atas nama koperasi.

Demikian surat ini kami sampaikan. Atas perhatiannya kami ucapkan terima kasih.

${context.jabatan},
${context.namaPengurus}`;
}
