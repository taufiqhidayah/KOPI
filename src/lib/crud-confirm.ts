import type { PendingBarangMasukDraft } from "./copilot-reply";
import type { ChatAction } from "./copilot";

export type CrudConfirmField = {
  label: string;
  value: string;
};

export type CrudConfirmView = {
  title: string;
  description: string;
  fields: CrudConfirmField[];
};

function formatRupiah(value?: number): string {
  if (value == null || value <= 0) return "—";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatBarangMasukPreview(payload: PendingBarangMasukDraft): CrudConfirmView {
  const fields: CrudConfirmField[] = [
    { label: "Produk", value: payload.nama_tampilan ?? payload.nama_produk },
    { label: "Jumlah", value: `${payload.jumlah_masuk} ${payload.unit ?? ""}`.trim() },
  ];

  if (payload.stok_sekarang != null) {
    fields.push({ label: "Stok sekarang", value: String(payload.stok_sekarang) });
  }
  if (payload.harga_beli > 0) {
    fields.push({ label: "Harga beli", value: formatRupiah(payload.harga_beli) });
  }
  if (payload.harga_jual && payload.harga_jual > 0) {
    fields.push({ label: "Harga jual", value: formatRupiah(payload.harga_jual) });
  }
  if (payload.keterangan) {
    fields.push({ label: "Keterangan", value: payload.keterangan });
  }
  if (payload.dokumentasi_nama) {
    fields.push({ label: "Lampiran", value: payload.dokumentasi_nama });
  }

  return {
    title: "Simpan barang masuk?",
    description: "Periksa data di bawah sebelum disimpan ke SIMKOPDES.",
    fields,
  };
}

function formatTambahProdukPreview(payload: {
  nama_produk: string;
  unit?: string;
  jumlah_masuk?: number;
  harga_beli?: number;
  kategori?: string;
  jenis_barang?: string;
  potensi_desa?: string;
  penyedia?: string;
}): CrudConfirmView {
  const fields: CrudConfirmField[] = [
    { label: "Nama produk", value: payload.nama_produk },
    { label: "Satuan", value: payload.unit ?? "unit" },
    { label: "Kategori", value: payload.kategori ?? "—" },
    { label: "Jenis barang", value: payload.jenis_barang ?? "—" },
    { label: "Potensi desa", value: payload.potensi_desa ?? "—" },
    { label: "Penyedia", value: payload.penyedia ?? "—" },
  ];

  if (payload.jumlah_masuk && payload.jumlah_masuk > 0) {
    fields.push({
      label: "Stok awal",
      value: `${payload.jumlah_masuk} ${payload.unit ?? ""}`.trim(),
    });
  }
  if (payload.harga_beli && payload.harga_beli > 0) {
    fields.push({ label: "Harga beli", value: formatRupiah(payload.harga_beli) });
  }

  return {
    title: "Tambah produk baru?",
    description: "Produk akan ditambahkan ke master SIMKOPDES.",
    fields,
  };
}

function formatPengajuanPreview(payload: {
  kode_bank: string;
  nama_bank: string;
  preview: Record<string, unknown>;
}): CrudConfirmView {
  const p = payload.preview;
  const fields: CrudConfirmField[] = [
    { label: "Bank", value: payload.nama_bank },
    { label: "Kode bank", value: payload.kode_bank },
  ];

  if (p.nama_koperasi) fields.push({ label: "Koperasi", value: String(p.nama_koperasi) });
  if (p.nik_koperasi) fields.push({ label: "NIK koperasi", value: String(p.nik_koperasi) });
  if (p.penanggung_jawab) fields.push({ label: "Penanggung jawab", value: String(p.penanggung_jawab) });

  return {
    title: "Simpan pengajuan rekening?",
    description: "Pengajuan akan disimpan ke SIMKOPDES.",
    fields,
  };
}

export function buildCrudConfirmView(action: ChatAction): CrudConfirmView | null {
  switch (action.type) {
    case "confirm_barang_masuk":
      return formatBarangMasukPreview(action.payload);
    case "confirm_tambah_produk":
      return formatTambahProdukPreview(action.payload);
    case "confirm_pengajuan":
      return formatPengajuanPreview(action.payload);
    default:
      return null;
  }
}

export function isCrudConfirmAction(action?: ChatAction): boolean {
  return (
    action?.type === "confirm_barang_masuk" ||
    action?.type === "confirm_tambah_produk" ||
    action?.type === "confirm_pengajuan"
  );
}
