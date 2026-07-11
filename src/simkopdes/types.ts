export type SimkopdesView =
  | "transaksi"
  | "produk"
  | "barang-masuk"
  | "barang-keluar"
  | "inventaris";

export type NavItem = {
  id: string;
  label: string;
  badge?: "Baru";
  icon: string;
};

export type ProductRow = {
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
