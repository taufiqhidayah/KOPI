import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { DOKUMENTASI_MAX_BYTES, DOKUMENTASI_MIME } from "@/lib/barang-masuk-constants";
import { getKoperasiRef, query } from "@/lib/db";
import { generateRef } from "@/lib/security";
import { saveBarangMasukDokumentasi, canWriteUploadsToDisk } from "@/lib/uploads";
import { extractNoteData, matchProducts } from "@/lib/vision";

function validateFile(file: File): string | null {
  if (!DOKUMENTASI_MIME.has(file.type)) {
    return "Format harus JPG, PNG, atau PDF.";
  }
  if (file.size > DOKUMENTASI_MAX_BYTES) {
    return "Ukuran maksimal 10MB.";
  }
  return null;
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const produkSampleId = (formData.get("produk_sample_id") as string) || undefined;
    const namaProduk = (formData.get("nama_produk") as string) || undefined;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "File tidak ditemukan" }, { status: 400 });
    }

    const uploadFile = file as File;
    const fileError = validateFile(uploadFile);
    if (fileError) {
      return NextResponse.json({ success: false, error: fileError }, { status: 400 });
    }

    const buffer = Buffer.from(await uploadFile.arrayBuffer());
    const mimeType = uploadFile.type || "image/jpeg";
    const dokumentasiNama = uploadFile.name;
    const ref = generateRef("BM");
    const dokumentasiUrl = canWriteUploadsToDisk()
      ? await saveBarangMasukDokumentasi(buffer, { ref, mimeType })
      : undefined;

    let ocr: {
      harga_beli?: number;
      harga_jual?: number;
      keterangan?: string;
      supplier?: string;
      is_nota: boolean;
      matched_item?: { qty: number; harga: number; nama: string };
    } | undefined;

    if (isImageMime(mimeType)) {
      try {
        const imageBase64 = buffer.toString("base64");
        const extracted = await extractNoteData(imageBase64, mimeType);
        const koperasiRef = getKoperasiRef();
        const products = await query<{ produk_sample_id: string; nama_produk: string | null }>(
          `SELECT produk_sample_id, nama_produk FROM produk_koperasi WHERE koperasi_ref = $1`,
          [koperasiRef],
        );

        const { matched } = await matchProducts(extracted.items, products);
        const isNota = extracted.items.length > 0;

        let matchedItem = matched[0];
        if (produkSampleId) {
          matchedItem = matched.find((m) => m.produk_sample_id === produkSampleId) ?? matched[0];
        } else if (namaProduk) {
          const lower = namaProduk.toLowerCase();
          matchedItem = matched.find((m) =>
            m.nama_produk.toLowerCase().includes(lower) || lower.includes(m.nama_produk.toLowerCase()),
          ) ?? matched[0];
        }

        ocr = {
          is_nota: isNota,
          supplier: extracted.supplier,
          keterangan: extracted.supplier ? `Dari ${extracted.supplier}` : undefined,
          matched_item: matchedItem
            ? { qty: matchedItem.qty, harga: matchedItem.harga, nama: matchedItem.nama }
            : undefined,
          harga_beli: matchedItem?.harga,
        };
      } catch {
        ocr = { is_nota: false };
      }
    }

    await logAudit({
      userId: "bendahara",
      actionType: "SELECT",
      tableName: "barang_masuk_produk",
      inputText: "upload-barang-masuk",
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      dokumentasi_nama: dokumentasiNama,
      dokumentasi_url: dokumentasiUrl,
      ocr,
      message: ocr?.is_nota
        ? `📷 Nota terbaca${ocr.matched_item ? `: ${ocr.matched_item.nama} ${ocr.matched_item.qty} @ Rp${ocr.matched_item.harga.toLocaleString("id-ID")}` : ""}.${dokumentasiUrl ? " Lampiran disimpan." : ""}`
        : `📎 Lampiran ${dokumentasiNama} diterima.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
