import { getKoperasiRef, query, withTransaction } from "./db";
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

export async function listProdukNames(koperasiRef?: string): Promise<string[]> {
  const ref = koperasiRef ?? getKoperasiRef();
  const rows = await query<{ nama_produk: string | null }>(
    `SELECT nama_produk FROM produk_koperasi WHERE koperasi_ref = $1 ORDER BY nama_produk`,
    [ref],
  );
  return rows.map((r) => r.nama_produk ?? "").filter(Boolean);
}
