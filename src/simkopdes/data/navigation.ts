import type { NavItem } from "../types";

export const MAIN_NAV: NavItem[] = [
  { id: "beranda", label: "Beranda", icon: "home" },
  { id: "formulir", label: "Formulir Permohonan", icon: "file", badge: "Baru" },
  { id: "anggota", label: "Anggota", icon: "users" },
  { id: "karyawan", label: "Karyawan", icon: "users", badge: "Baru" },
  { id: "rat", label: "Rapat Anggota Tahunan (RAT)", icon: "file" },
  { id: "simpanan", label: "Simpanan", icon: "coins", badge: "Baru" },
  { id: "pinjaman", label: "Pinjaman", icon: "coins", badge: "Baru" },
  { id: "penjualan", label: "Penjualan", icon: "grid", badge: "Baru" },
  { id: "off-taker", label: "Off-Taker", icon: "grid", badge: "Baru" },
  { id: "klinik", label: "Klinik Desa", icon: "hospital", badge: "Baru" },
  { id: "apotek", label: "Apotek Desa", icon: "medicine", badge: "Baru" },
  { id: "laporan", label: "Laporan Keuangan", icon: "dollar" },
  { id: "shu", label: "SHU", icon: "chart" },
  { id: "magang", label: "Program Magang", icon: "users", badge: "Baru" },
  { id: "artikel", label: "Artikel Koperasi", icon: "grid" },
  { id: "layanan", label: "Penyedia Layanan Teknologi", icon: "aim", badge: "Baru" },
  { id: "pengaduan", label: "Pengaduan Anggota", icon: "support", badge: "Baru" },
  { id: "jaga-desa", label: "Jaga Desa", icon: "headset" },
];

export const PENJUALAN_TABS = [
  { id: "transaksi" as const, label: "Transaksi" },
  { id: "produk" as const, label: "Produk" },
  { id: "barang-masuk" as const, label: "Barang Masuk" },
  { id: "barang-keluar" as const, label: "Barang Keluar" },
  { id: "inventaris" as const, label: "Inventaris" },
];
