import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { createProduk, listProduk } from "@/lib/produk";

export async function GET(req: NextRequest) {
  const start = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 10;

    const result = await listProduk({ search, page, pageSize });

    await logAudit({
      userId: "bendahara",
      actionType: "SELECT",
      tableName: "produk_koperasi",
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = /timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(message);

    await logAudit({
      userId: "bendahara",
      actionType: "SELECT",
      tableName: "produk_koperasi",
      status: "failed",
      executionTimeMs: Date.now() - start,
      errorMessage: message,
    });

    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? "Database hackathon tidak terjangkau. Cek koneksi internet/VPN atau hubungi penyedia DB."
          : message,
      },
      { status: isTimeout ? 503 : 500 },
    );
  }
}

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
      kategori: (body.kategori as string)?.trim() || undefined,
      jenis_barang: (body.jenis_barang as string)?.trim() || undefined,
      potensi_desa: (body.potensi_desa as string)?.trim() || undefined,
      penyedia: (body.penyedia as string)?.trim() || undefined,
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
