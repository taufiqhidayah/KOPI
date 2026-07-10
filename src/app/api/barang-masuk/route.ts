import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { logAudit } from "@/lib/audit";
import { getKoperasiRef, query, withTransaction } from "@/lib/db";
import { generateRef } from "@/lib/security";

type BarangMasukItem = {
  produk_sample_id: string;
  jumlah_masuk: number;
  harga_beli: number;
  nama_produk?: string;
};

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();
    const koperasiRef = (body.koperasi_ref as string) || getKoperasiRef();
    const tanggalMasuk = body.tanggal_masuk as string;
    const keterangan = (body.keterangan as string) ?? "";
    const items = body.items as BarangMasukItem[];
    const confirmedBy = (body.confirmed_by as string) ?? "bendahara";

    if (!items?.length) {
      return NextResponse.json({ success: false, error: "Items tidak boleh kosong" }, { status: 400 });
    }

    const recordsCreated = await withTransaction(async (client: PoolClient) => {
      const created: { barang_masuk_ref: string; produk_sample_id: string }[] = [];

      for (const item of items) {
        const barangMasukRef = generateRef("BM");
        const totalBiaya = item.jumlah_masuk * item.harga_beli;

        const product = await client.query<{ nama_produk: string | null }>(
          `SELECT nama_produk FROM produk_koperasi WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
          [item.produk_sample_id, koperasiRef],
        );

        const namaProduk = item.nama_produk ?? product.rows[0]?.nama_produk ?? "Produk";

        await client.query(
          `INSERT INTO barang_masuk_produk
            (barang_masuk_ref, produk_sample_id, koperasi_ref, nama_produk, jumlah_masuk,
             jumlah_tersedia, harga_beli, total_biaya, keterangan, status, tanggal_masuk, dibuat_pada)
           VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, 'aktif', $9, NOW())`,
          [
            barangMasukRef,
            item.produk_sample_id,
            koperasiRef,
            namaProduk,
            item.jumlah_masuk,
            item.harga_beli,
            totalBiaya,
            keterangan,
            tanggalMasuk ?? new Date().toISOString(),
          ],
        );

        const inventaris = await client.query<{ inventaris_ref: string; stok: string | null }>(
          `SELECT inventaris_ref, stok FROM inventaris_produk
           WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
          [item.produk_sample_id, koperasiRef],
        );

        if (inventaris.rows[0]) {
          const currentStok = Number(inventaris.rows[0].stok ?? 0);
          await client.query(
            `UPDATE inventaris_produk SET stok = $1, diperbarui_pada = NOW()
             WHERE inventaris_ref = $2`,
            [currentStok + item.jumlah_masuk, inventaris.rows[0].inventaris_ref],
          );
        } else {
          const inventarisRef = generateRef("INV");
          await client.query(
            `INSERT INTO inventaris_produk
              (inventaris_ref, produk_sample_id, koperasi_ref, nama_produk, stok, dibuat_pada)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [inventarisRef, item.produk_sample_id, koperasiRef, namaProduk, item.jumlah_masuk],
          );
        }

        created.push({ barang_masuk_ref: barangMasukRef, produk_sample_id: item.produk_sample_id });
      }

      return created;
    });

    const stockMessages = await Promise.all(
      items.map(async (item) => {
        const inv = await query<{ nama_produk: string | null; stok: string | null }>(
          `SELECT nama_produk, stok FROM inventaris_produk
           WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
          [item.produk_sample_id, koperasiRef],
        );
        const row = inv[0];
        return `${row?.nama_produk ?? "Produk"}: ${row?.stok ?? 0}`;
      }),
    );

    await logAudit({
      userId: confirmedBy,
      actionType: "CREATE",
      tableName: "barang_masuk_produk",
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      records_created: recordsCreated,
      inventaris_updated: true,
      message: `✅ Data tersimpan. Stok ${stockMessages.join(", ")}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await logAudit({
      userId: "bendahara",
      actionType: "CREATE",
      tableName: "barang_masuk_produk",
      status: "failed",
      executionTimeMs: Date.now() - start,
      errorMessage: message,
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
