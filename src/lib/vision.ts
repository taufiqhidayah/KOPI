import { geminiVisionJson } from "./gemini";

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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeExtractedNoteData(raw: Partial<ExtractedNoteData>): ExtractedNoteData {
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((item): item is ExtractedNoteItem => Boolean(item && typeof item.nama === "string"))
        .map((item) => ({
          nama: item.nama.trim(),
          qty: Number(item.qty) || 0,
          harga: Number(item.harga) || 0,
        }))
        .filter((item) => item.nama.length > 0)
    : [];

  const total = Number(raw.total) || items.reduce((sum, item) => sum + item.qty * item.harga, 0);

  return {
    tanggal: typeof raw.tanggal === "string" && raw.tanggal.trim() ? raw.tanggal.trim() : todayIsoDate(),
    supplier: typeof raw.supplier === "string" ? raw.supplier.trim() : "",
    items,
    total,
  };
}

export async function extractNoteData(imageBase64: string, mimeType: string): Promise<ExtractedNoteData> {
  const parsed = await geminiVisionJson<Partial<ExtractedNoteData>>(
    `Ekstrak data dari foto nota/struk belanja ini.
Return JSON dengan field: tanggal (YYYY-MM-DD), supplier, items (array nama/qty/harga), total.
Jika tanggal tidak terbaca, gunakan ${todayIsoDate()}.
Jika ada banyak item, sertakan semua item yang terbaca.`,
    imageBase64,
    mimeType,
  );

  if (!parsed) {
    throw new Error(
      "OCR foto nota gagal. Periksa GEMINI_API_KEY/GEMINI_MODEL di .env.local, tunggu jika kuota habis, atau input manual via chat (misalnya \"aqua 5 galon\").",
    );
  }

  try {
    return normalizeExtractedNoteData(parsed);
  } catch {
    throw new Error("OCR nota menghasilkan format tidak valid. Coba foto lebih jelas atau input manual via chat.");
  }
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
