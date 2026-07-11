export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportView = {
  type: "transaksi" | "stok" | "anggota" | "simpanan" | "generic";
  title: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
};

function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRupiah(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function detectReportType(command: string): ReportView["type"] {
  const lower = command.toLowerCase();
  if (/penjualan|omzet|transaksi/.test(lower)) return "transaksi";
  if (/stok|inventaris|menipis|produk|barang/.test(lower)) return "stok";
  if (/anggota/.test(lower)) return "anggota";
  if (/simpanan/.test(lower)) return "simpanan";
  return "generic";
}

function buildTransaksiReport(command: string, data: Record<string, unknown>[]): ReportView {
  const rows = data.map((row) => ({
    tanggal: formatDate(row.tanggal_dibuat),
    transaksi_id: row.transaksi_sample_id ?? "—",
    pelanggan: row.nama_pelanggan ?? "—",
    produk: row.nama_produk ?? "—",
    qty: row.jumlah_keluar ?? "—",
    total: formatRupiah(row.total_pembayaran ?? row.total_nilai),
    status: row.status_transaksi ?? "—",
    metode: row.metode_pembayaran ?? "—",
  }));

  const period = /minggu|week|7 hari/.test(command.toLowerCase())
    ? "7 Hari Terakhir"
    : "Semua Periode";

  return {
    type: "transaksi",
    title: `Laporan Transaksi — ${period}`,
    columns: [
      { key: "tanggal", label: "Tanggal" },
      { key: "transaksi_id", label: "ID" },
      { key: "pelanggan", label: "Pelanggan" },
      { key: "produk", label: "Produk" },
      { key: "qty", label: "Qty" },
      { key: "total", label: "Total" },
      { key: "status", label: "Status" },
    ],
    rows,
  };
}

function buildStokReport(data: Record<string, unknown>[]): ReportView {
  return {
    type: "stok",
    title: "Laporan Stok Inventaris",
    columns: [
      { key: "nama_produk", label: "Produk" },
      { key: "stok", label: "Stok" },
      { key: "unit", label: "Satuan" },
      { key: "kode_barcode", label: "Barcode" },
    ],
    rows: data.map((row) => ({
      nama_produk: row.nama_produk ?? "—",
      stok: row.stok ?? 0,
      unit: row.unit ?? "—",
      kode_barcode: row.kode_barcode ?? "—",
    })),
  };
}

function buildAnggotaReport(data: Record<string, unknown>[]): ReportView {
  return {
    type: "anggota",
    title: "Daftar Anggota Koperasi",
    columns: [
      { key: "nama", label: "Nama" },
      { key: "nik", label: "NIK" },
      { key: "status_keanggotaan", label: "Status" },
      { key: "tanggal_terdaftar", label: "Terdaftar" },
    ],
    rows: data.map((row) => ({
      nama: row.nama ?? "—",
      nik: row.nik ?? "—",
      status_keanggotaan: row.status_keanggotaan ?? "—",
      tanggal_terdaftar: formatDate(row.tanggal_terdaftar),
    })),
  };
}

function buildSimpananReport(data: Record<string, unknown>[]): ReportView {
  return {
    type: "simpanan",
    title: "Laporan Simpanan Anggota",
    columns: [
      { key: "nama_anggota", label: "Anggota" },
      { key: "jumlah_simpanan", label: "Jumlah" },
      { key: "periode_pembayaran", label: "Periode" },
      { key: "status", label: "Status" },
    ],
    rows: data.map((row) => ({
      nama_anggota: row.nama_anggota ?? "—",
      jumlah_simpanan: formatRupiah(row.jumlah_simpanan),
      periode_pembayaran: row.periode_pembayaran ?? "—",
      status: row.status ?? "—",
    })),
  };
}

function buildGenericReport(command: string, data: Record<string, unknown>[]): ReportView {
  const keys = Object.keys(data[0] ?? {}).slice(0, 6);
  return {
    type: "generic",
    title: command.length > 48 ? "Hasil Laporan" : command,
    columns: keys.map((key) => ({ key, label: key.replace(/_/g, " ") })),
    rows: data.map((row) => {
      const formatted: Record<string, unknown> = {};
      for (const key of keys) formatted[key] = row[key] ?? "—";
      return formatted;
    }),
  };
}

export function buildReportView(command: string, data: Record<string, unknown>[]): ReportView | null {
  if (!data.length) return null;

  const type = detectReportType(command);
  switch (type) {
    case "transaksi":
      return buildTransaksiReport(command, data);
    case "stok":
      return buildStokReport(data);
    case "anggota":
      return buildAnggotaReport(data);
    case "simpanan":
      return buildSimpananReport(data);
    default:
      return buildGenericReport(command, data);
  }
}

export function buildReportSummary(command: string, data: Record<string, unknown>[], report: ReportView): string {
  const lower = command.toLowerCase();

  if (report.type === "transaksi") {
    const uniqueTx = new Set(data.map((r) => String(r.transaksi_sample_id ?? ""))).size;
  const total = [...new Set(data.map((r) => String(r.transaksi_sample_id ?? "")))].reduce((sum, id) => {
    const row = data.find((r) => String(r.transaksi_sample_id ?? "") === id);
    return sum + Number(row?.total_pembayaran ?? 0);
  }, 0);

    const period = /minggu|week|7 hari/.test(lower) ? "7 hari terakhir" : "periode ini";
    return `Ditemukan ${uniqueTx} transaksi (${period}), total Rp ${total.toLocaleString("id-ID")}. Lihat tabel di bawah atau unduh CSV.`;
  }

  if (report.type === "stok") {
    return `Ditemukan ${data.length} produk. Lihat tabel di bawah atau unduh CSV.`;
  }

  return `Ditemukan ${data.length} baris data. Lihat tabel di bawah atau unduh CSV.`;
}
