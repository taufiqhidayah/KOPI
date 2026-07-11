export const COPILOT_CAPABILITIES = [
  {
    id: "laporan",
    label: "Laporan & Query Data",
    description: "Tanya data koperasi: penjualan, stok, anggota, simpanan, inventaris",
    examples: ["Buatkan laporan penjualan minggu ini", "Tampilkan stok barang menipis", "berapa stok beras?"],
  },
  {
    id: "nota",
    label: "Input Foto Nota",
    description: "Upload foto struk supplier → auto-fill barang masuk + update stok",
    examples: ["Upload foto nota via tombol di bawah chat"],
  },
  {
    id: "barang_masuk",
    label: "Catat Barang Masuk",
    description: "Full chat: produk, jumlah, harga beli/jual, keterangan, dokumentasi + OCR foto nota",
    examples: ["beras 10 kg harga beli 12000 harga jual 15000", "Upload foto nota", "Tambah barang masuk"],
  },
  {
    id: "tambah_produk",
    label: "Tambah Produk Baru",
    description: "Produk belum ada di master → tambah langsung lewat chat atau form SIMKOPDES",
    examples: ["minyak tanah 20 kg", "tambah produk baru tepung"],
  },
  {
    id: "pengajuan",
    label: "Pengajuan Rekening Bank",
    description: "Bantu isi form & draft surat pengajuan rekening bank",
    examples: ["Aku mau buka rekening bank di BRI"],
  },
  {
    id: "info",
    label: "Info SIMKOPDES",
    description: "Info profil koperasi, pengurus, dokumen",
    examples: ["Siapa ketua koperasi?", "Dokumen apa yang sudah ada?"],
  },
] as const;

export const FEATURE_CHIPS = [
  { label: "Laporan penjualan", prompt: "Laporan penjualan minggu ini" },
  { label: "Stok barang", prompt: "Stok barangku" },
  { label: "Form barang masuk", prompt: "Tambah barang masuk" },
  { label: "Barang masuk cepat", prompt: "beras 10 kg premium" },
  { label: "Tambah produk", prompt: "minyak tanah 20 liter" },
  { label: "Upload nota", prompt: "cara upload foto nota" },
  { label: "Pengajuan bank", prompt: "Buka rekening bank BRI" },
  { label: "Info koperasi", prompt: "Siapa ketua koperasi?" },
] as const;

export function getWelcomeMessage(): string {
  const lines = COPILOT_CAPABILITIES.map((c) => `• ${c.label}`);
  return `Hai! Saya Kopdes Copilot untuk SIMKOPDES.\n\nFitur yang tersedia:\n${lines.join("\n")}\n\nKetik perintah atau tap saran di bawah.`;
}

export function getFeatureSuggestionPrompts(): string[] {
  return FEATURE_CHIPS.map((c) => c.prompt);
}

export function getHelpSummary(): string {
  const lines = COPILOT_CAPABILITIES.map(
    (c) => `• ${c.label} — contoh: "${c.examples[0]}"`,
  );
  return `Fitur Kopdes Copilot:\n${lines.join("\n")}\n\nUntuk foto nota, tap ikon 📷 di bawah chat.`;
}

export const ALLOWED_TABLES = [
  "profil_koperasi",
  "anggota_koperasi",
  "pengurus_koperasi",
  "produk_koperasi",
  "inventaris_produk",
  "barang_masuk_produk",
  "barang_keluar_produk",
  "transaksi_penjualan",
  "simpanan_anggota",
  "pengajuan_rekening_bank",
  "pengajuan_pembiayaan",
  "pengajuan_kemitraan",
  "dokumen_koperasi",
  "akun_bank_koperasi",
  "gerai_koperasi",
  "aset_koperasi",
  "modal_koperasi",
  "rat_koperasi",
];

export function getCapabilitiesText(): string {
  return COPILOT_CAPABILITIES.map(
    (c) => `• ${c.label}: ${c.description}\n  Contoh: ${c.examples.join("; ")}`,
  ).join("\n");
}
