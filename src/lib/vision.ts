import { geminiVision } from "./gemini";

export type ExtractedNoteItem = {
  nama: string;
  qty: number;
  harga: number;
};

export type ExtractedNoteData = {
  tanggal: string;
  supplier: string;
  items: ExtractedNoteItem[];
  total: number;
};

export async function extractNoteData(imageBase64: string, mimeType: string): Promise<ExtractedNoteData> {
  const raw = await geminiVision(
    `Ekstrak data dari foto nota/struk ini. Return JSON saja dengan format:
{
  "tanggal": "YYYY-MM-DD",
  "supplier": "nama toko/supplier",
  "items": [{"nama": "nama barang", "qty": number, "harga": number}],
  "total": number
}
Jika tanggal tidak jelas, gunakan tanggal hari ini.`,
    imageBase64,
    mimeType,
  );

  if (!raw) {
    throw new Error("OCR foto nota butuh Gemini. Kuota habis — tunggu 1-2 menit atau input manual via chat (misalnya \"aqua 5 galon\").");
  }

  return JSON.parse(raw) as ExtractedNoteData;
}

export type MatchedProduct = {
  produk_sample_id: string;
  nama_produk: string;
  nama: string;
  qty: number;
  harga: number;
};

export async function matchProducts(
  items: ExtractedNoteItem[],
  products: { produk_sample_id: string; nama_produk: string | null }[],
): Promise<{ matched: MatchedProduct[]; unmatched: ExtractedNoteItem[] }> {
  const matched: MatchedProduct[] = [];
  const unmatched: ExtractedNoteItem[] = [];

  for (const item of items) {
    const itemLower = item.nama.toLowerCase();
    const product = products.find((p) => {
      const name = (p.nama_produk ?? "").toLowerCase();
      return name.includes(itemLower) || itemLower.includes(name);
    });

    if (product) {
      matched.push({
        produk_sample_id: product.produk_sample_id,
        nama_produk: product.nama_produk ?? item.nama,
        nama: item.nama,
        qty: item.qty,
        harga: item.harga,
      });
    } else {
      unmatched.push(item);
    }
  }

  return { matched, unmatched };
}
