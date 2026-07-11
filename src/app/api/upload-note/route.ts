import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { getKoperasiRef, query } from "@/lib/db";
import { extractNoteData, matchProducts } from "@/lib/vision";

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "File tidak ditemukan" }, { status: 400 });
    }

    const uploadFile = file as File;
    const buffer = Buffer.from(await uploadFile.arrayBuffer());
    const mimeType = uploadFile.type || "image/jpeg";
    const imageBase64 = buffer.toString("base64");

    const extracted = await extractNoteData(imageBase64, mimeType);
    const koperasiRef = getKoperasiRef();

    const products = await query<{ produk_sample_id: string; nama_produk: string | null }>(
      `SELECT produk_sample_id, nama_produk FROM produk_koperasi WHERE koperasi_ref = $1`,
      [koperasiRef],
    );

    const { matched, unmatched } = await matchProducts(extracted.items, products);

    await logAudit({
      userId: "bendahara",
      actionType: "SELECT",
      tableName: "produk_koperasi",
      inputText: "upload-note",
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      dokumentasi_nama: uploadFile.name || "nota.jpg",
      extracted_data: {
        tanggal: extracted.tanggal,
        supplier: extracted.supplier,
        items: matched.map((m) => ({
          nama: m.nama,
          qty: m.qty,
          harga: m.harga,
          produk_sample_id: m.produk_sample_id,
        })),
        total: extracted.total,
      },
      matched_products: matched.length,
      unmatched_products: unmatched.length,
      unmatched_items: unmatched,
      message: `✅ ${matched.length} item berhasil dicocokkan dengan master produk`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
