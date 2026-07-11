import { query } from "./db";
import { createProduk } from "./produk";
import { findBestProduct, scoreProductMatch, type KoperasiProduct } from "./product-match";
import { normalizeUnit } from "./tambah-produk-guide";
import { inferUnitFromProductName, type NotaUnmatchedDraft } from "./nota-queue";

export type { NotaUnmatchedDraft, UnmatchedNotaItem } from "./nota-queue";
export {
  applyMetaToNotaUnmatched,
  buildNotaUnmatchedFollowUp,
  getMissingNotaProductFields,
  inferUnitFromProductName,
  isMeaningfulNotaSupplier,
  isNotaUnmatchedComplete,
  prefillNotaUnmatched,
} from "./nota-queue";

export type ResolvedNotaItem = {
  produk_sample_id: string;
  jumlah_masuk: number;
  harga_beli: number;
  nama_produk: string;
};

export async function resolveUnmatchedNotaItems(
  unmatched: NotaUnmatchedDraft[],
  options: { koperasiRef: string },
): Promise<{ items: ResolvedNotaItem[]; products_created: string[] }> {
  if (!unmatched.length) return { items: [], products_created: [] };

  const products = await query<KoperasiProduct>(
    `SELECT produk_sample_id, nama_produk, unit FROM produk_koperasi WHERE koperasi_ref = $1`,
    [options.koperasiRef],
  );

  const items: ResolvedNotaItem[] = [];
  const products_created: string[] = [];

  for (const entry of unmatched) {
    const { best } = findBestProduct(entry.nama, products);
    const catalogMatch = best
      && scoreProductMatch(entry.nama, best.nama_produk ?? "") >= 80;

    if (catalogMatch && best) {
      items.push({
        produk_sample_id: best.produk_sample_id,
        jumlah_masuk: entry.qty,
        harga_beli: entry.harga,
        nama_produk: entry.nama,
      });
      continue;
    }

    const unit = normalizeUnit(entry.unit || inferUnitFromProductName(entry.nama));
    const created = await createProduk({
      nama_produk: entry.nama,
      unit,
      kategori: entry.kategori,
      jenis_barang: entry.jenis_barang,
      potensi_desa: entry.potensi_desa,
      penyedia: entry.penyedia,
    });

    products_created.push(created.nama_produk);
    products.push({
      produk_sample_id: created.produk_sample_id,
      nama_produk: created.nama_produk,
      unit: created.unit,
    });

    items.push({
      produk_sample_id: created.produk_sample_id,
      jumlah_masuk: entry.qty,
      harga_beli: entry.harga,
      nama_produk: created.nama_produk,
    });
  }

  return { items, products_created };
}
