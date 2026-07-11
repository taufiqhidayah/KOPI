import { getKoperasiRef, query, queryOne } from "./db";
import { extractThumbnailUrl } from "./barang-masuk-constants";

export { DOKUMENTASI_MAX_BYTES, DOKUMENTASI_MIME, buildKeteranganWithDokumentasi } from "./barang-masuk-constants";

export type BarangMasukListItem = {
  barang_masuk_ref: string;
  produk_sample_id: string;
  sku: string;
  gambar_url: string | null;
  nama_produk: string;
  nama_tampilan: string | null;
  jumlah_masuk: number;
  jumlah_tersedia: number;
  unit: string;
  harga_beli: number;
  harga_jual: number | null;
  keterangan: string | null;
  tanggal_masuk: string | null;
};

export type ListBarangMasukResult = {
  items: BarangMasukListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listBarangMasuk(params: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<ListBarangMasukResult> {
  const koperasiRef = getKoperasiRef();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const search = params.search?.trim().toLowerCase();

  const filters = ["bm.koperasi_ref = $1"];
  const queryParams: unknown[] = [koperasiRef];

  if (search) {
    queryParams.push(`%${search}%`);
    const idx = queryParams.length;
    filters.push(
      `(LOWER(bm.nama_produk) LIKE $${idx} OR LOWER(COALESCE(bm.nama_tampilan, '')) LIKE $${idx} OR LOWER(bm.barang_masuk_ref) LIKE $${idx} OR LOWER(COALESCE(p.kode_barcode, '')) LIKE $${idx} OR LOWER(p.produk_sample_id) LIKE $${idx})`,
    );
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  const countRow = await queryOne<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM barang_masuk_produk bm
     LEFT JOIN produk_koperasi p
       ON p.produk_sample_id = bm.produk_sample_id AND p.koperasi_ref = bm.koperasi_ref
     ${where}`,
    queryParams,
  );

  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;
  queryParams.push(pageSize, offset);

  const rows = await query<{
    barang_masuk_ref: string;
    produk_sample_id: string;
    sku: string;
    nama_produk: string | null;
    nama_tampilan: string | null;
    jumlah_masuk: string | null;
    jumlah_tersedia: string | null;
    unit: string | null;
    harga_beli: string | null;
    harga_jual: string | null;
    keterangan: string | null;
    tanggal_masuk: string | null;
  }>(
    `SELECT
      bm.barang_masuk_ref,
      bm.produk_sample_id,
      COALESCE(NULLIF(TRIM(p.kode_barcode), ''), p.produk_sample_id) AS sku,
      bm.nama_produk,
      bm.nama_tampilan,
      bm.jumlah_masuk,
      bm.jumlah_tersedia,
      p.unit,
      bm.harga_beli,
      bm.harga_jual,
      bm.keterangan,
      bm.tanggal_masuk
    FROM barang_masuk_produk bm
    LEFT JOIN produk_koperasi p
      ON p.produk_sample_id = bm.produk_sample_id AND p.koperasi_ref = bm.koperasi_ref
    ${where}
    ORDER BY bm.tanggal_masuk DESC NULLS LAST, bm.dibuat_pada DESC NULLS LAST
    LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    queryParams,
  );

  return {
    items: rows.map((row) => ({
      barang_masuk_ref: row.barang_masuk_ref,
      produk_sample_id: row.produk_sample_id,
      sku: row.sku,
      gambar_url: extractThumbnailUrl(row.keterangan),
      nama_produk: row.nama_produk ?? "-",
      nama_tampilan: row.nama_tampilan,
      jumlah_masuk: Number(row.jumlah_masuk ?? 0),
      jumlah_tersedia: Number(row.jumlah_tersedia ?? row.jumlah_masuk ?? 0),
      unit: row.unit ?? "-",
      harga_beli: Number(row.harga_beli ?? 0),
      harga_jual: row.harga_jual != null ? Number(row.harga_jual) : null,
      keterangan: row.keterangan,
      tanggal_masuk: row.tanggal_masuk,
    })),
    total: Number(countRow?.total ?? 0),
    page,
    pageSize,
  };
}

