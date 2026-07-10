import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { createProduk } from "@/lib/produk";

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();
    const namaProduk = (body.nama_produk as string)?.trim();
    const unit = (body.unit as string)?.trim();
    const jumlahMasuk = body.jumlah_masuk != null ? Number(body.jumlah_masuk) : undefined;
    const hargaBeli = body.harga_beli != null ? Number(body.harga_beli) : 0;

    if (!namaProduk) {
      return NextResponse.json({ success: false, error: "nama_produk wajib diisi" }, { status: 400 });
    }

    const result = await createProduk({
      nama_produk: namaProduk,
      unit,
      jumlah_masuk: jumlahMasuk,
      harga_beli: hargaBeli,
    });

    await logAudit({
      userId: (body.confirmed_by as string) ?? "bendahara",
      actionType: "CREATE",
      tableName: "produk_koperasi",
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    const barangNote = result.barang_masuk_ref
      ? ` Barang masuk ${result.stok} ${result.unit} ikut dicatat.`
      : "";

    return NextResponse.json({
      success: true,
      ...result,
      message: `Produk ${result.nama_produk} (${result.produk_sample_id}) berhasil ditambahkan.${barangNote}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await logAudit({
      userId: "bendahara",
      actionType: "CREATE",
      tableName: "produk_koperasi",
      status: "failed",
      executionTimeMs: Date.now() - start,
      errorMessage: message,
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
