import { getKoperasiRef, query, queryOne, withTransaction } from "./db";
import { extractThumbnailUrl } from "./barang-masuk-constants";
import { generateRef } from "./security";
import type { PoolClient } from "pg";

export type CreateProdukInput = {
  nama_produk: string;
  unit?: string;
  jumlah_masuk?: number;
  harga_beli?: number;
};

export type CreateProdukResult = {
  produk_sample_id: string;
  nama_produk: string;
  unit: string;
  inventaris_ref: string;
  barang_masuk_ref?: string;
  stok: number;
};

export type ProdukListItem = {
  produk_sample_id: string;
  sku: string;
  nama_produk: string;
  unit: string;
  kategori: string;
  jenis_barang: string;
  potensi_desa: string;
  penyedia: string;
  thumbnail_url: string | null;
  stok: number;
};

export type ListProdukResult = {
  items: ProdukListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListProdukParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

async function nextProdukSampleId(client: PoolClient, koperasiRef: string): Promise<string> {
  const result = await client.query<{ produk_sample_id: string }>(
    `SELECT produk_sample_id FROM produk_koperasi WHERE koperasi_ref = $1`,
    [koperasiRef],
  );

  const nums = result.rows
    .map((r) => parseInt(r.produk_sample_id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));

  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `PRD-${String(next).padStart(3, "0")}`;
}

function normalizeUnit(unit?: string): string {
  if (!unit) return "unit";
  const u = unit.trim().toLowerCase();
  if (u === "kilo" || u === "kilogram") return "kg";
  return u;
}

export async function createProduk(input: CreateProdukInput): Promise<CreateProdukResult> {
  const koperasiRef = getKoperasiRef();
  const unit = normalizeUnit(input.unit);
  const namaProduk = input.nama_produk.trim();

  return withTransaction(async (client) => {
    const produkSampleId = await nextProdukSampleId(client, koperasiRef);
    const inventarisRef = generateRef("INV");

    await client.query(
      `INSERT INTO produk_koperasi (produk_sample_id, koperasi_ref, nama_produk, unit, dibuat_pada, diperbarui_pada)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [produkSampleId, koperasiRef, namaProduk, unit],
    );

    let stok = 0;
    let barangMasukRef: string | undefined;

    if (input.jumlah_masuk && input.jumlah_masuk > 0) {
      const jumlah = input.jumlah_masuk;
      const hargaBeli = input.harga_beli ?? 0;
      barangMasukRef = generateRef("BM");

      await client.query(
        `INSERT INTO barang_masuk_produk
          (barang_masuk_ref, produk_sample_id, koperasi_ref, nama_produk, jumlah_masuk,
           jumlah_tersedia, harga_beli, total_biaya, keterangan, status, tanggal_masuk, dibuat_pada)
         VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'Input via chat', 'aktif', NOW(), NOW())`,
        [barangMasukRef, produkSampleId, koperasiRef, namaProduk, jumlah, hargaBeli, jumlah * hargaBeli],
      );

      stok = jumlah;
    }

    await client.query(
      `INSERT INTO inventaris_produk (inventaris_ref, produk_sample_id, koperasi_ref, nama_produk, stok, dibuat_pada)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [inventarisRef, produkSampleId, koperasiRef, namaProduk, stok],
    );

    return {
      produk_sample_id: produkSampleId,
      nama_produk: namaProduk,
      unit,
      inventaris_ref: inventarisRef,
      barang_masuk_ref: barangMasukRef,
      stok,
    };
  });
}

export async function listProduk(params: ListProdukParams = {}): Promise<ListProdukResult> {
  const koperasiRef = getKoperasiRef();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const search = params.search?.trim().toLowerCase();

  const filters = ["p.koperasi_ref = $1"];
  const queryParams: unknown[] = [koperasiRef];

  if (search) {
    queryParams.push(`%${search}%`);
    const idx = queryParams.length;
    filters.push(
      `(LOWER(p.nama_produk) LIKE $${idx} OR LOWER(COALESCE(p.kode_barcode, '')) LIKE $${idx} OR LOWER(p.produk_sample_id) LIKE $${idx})`,
    );
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  const countRow = await queryOne<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM produk_koperasi p ${where}`,
    queryParams,
  );
  const total = Number(countRow?.total ?? 0);

  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;
  queryParams.push(pageSize, offset);

  const rows = await query<{
    produk_sample_id: string;
    sku: string;
    nama_produk: string | null;
    unit: string | null;
    stok: string | null;
    penyedia: string | null;
    thumb_keterangan: string | null;
  }>(
    `SELECT
      p.produk_sample_id,
      COALESCE(NULLIF(TRIM(p.kode_barcode), ''), p.produk_sample_id) AS sku,
      p.nama_produk,
      p.unit,
      COALESCE(i.stok, 0) AS stok,
      bm.keterangan AS penyedia,
      thumb.keterangan AS thumb_keterangan
    FROM produk_koperasi p
    LEFT JOIN inventaris_produk i
      ON i.produk_sample_id = p.produk_sample_id AND i.koperasi_ref = p.koperasi_ref
    LEFT JOIN LATERAL (
      SELECT keterangan FROM barang_masuk_produk
      WHERE produk_sample_id = p.produk_sample_id
        AND koperasi_ref = p.koperasi_ref
        AND keterangan IS NOT NULL
        AND keterangan <> 'Input via chat'
      ORDER BY tanggal_masuk DESC NULLS LAST, dibuat_pada DESC NULLS LAST
      LIMIT 1
    ) bm ON true
    LEFT JOIN LATERAL (
      SELECT keterangan FROM barang_masuk_produk
      WHERE produk_sample_id = p.produk_sample_id
        AND koperasi_ref = p.koperasi_ref
        AND keterangan LIKE '%Lampiran: /uploads/barang-masuk/%'
      ORDER BY tanggal_masuk DESC NULLS LAST, dibuat_pada DESC NULLS LAST
      LIMIT 1
    ) thumb ON true
    ${where}
    ORDER BY p.dibuat_pada DESC NULLS LAST, p.nama_produk ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    queryParams,
  );

  return {
    items: rows.map((row) => ({
      produk_sample_id: row.produk_sample_id,
      sku: row.sku,
      nama_produk: row.nama_produk ?? "-",
      unit: row.unit ?? "-",
      kategori: "-",
      jenis_barang: "-",
      potensi_desa: "-",
      penyedia: row.penyedia ?? "-",
      thumbnail_url: extractThumbnailUrl(row.thumb_keterangan),
      stok: Number(row.stok ?? 0),
    })),
    total,
    page,
    pageSize,
  };
}

export async function listProdukNames(koperasiRef?: string): Promise<string[]> {
  const ref = koperasiRef ?? getKoperasiRef();
  const rows = await query<{ nama_produk: string | null }>(
    `SELECT nama_produk FROM produk_koperasi WHERE koperasi_ref = $1 ORDER BY nama_produk`,
    [ref],
  );
  return rows.map((r) => r.nama_produk ?? "").filter(Boolean);
}
