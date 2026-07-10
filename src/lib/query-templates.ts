export function matchQueryTemplate(command: string, koperasiRef: string): string | null {
  const lower = command.toLowerCase();

  if (/penjualan|omzet|transaksi/.test(lower)) {
    const weekFilter = /minggu|week|7 hari/.test(lower)
      ? "AND tp.tanggal_dibuat >= CURRENT_DATE - INTERVAL '7 days'"
      : "";

    return `
SELECT tp.transaksi_sample_id, tp.nama_pelanggan, tp.tanggal_dibuat,
       tp.total_pembayaran, tp.status_transaksi, tp.metode_pembayaran,
       bk.nama_produk, bk.jumlah_keluar, bk.harga, bk.total_nilai
FROM transaksi_penjualan tp
LEFT JOIN barang_keluar_produk bk
  ON bk.transaksi_sample_id = tp.transaksi_sample_id AND bk.koperasi_ref = tp.koperasi_ref
WHERE tp.koperasi_ref = '${koperasiRef}' ${weekFilter}
ORDER BY tp.tanggal_dibuat DESC NULLS LAST
LIMIT 100`.trim();
  }

  if (/stok|inventaris|menipis/.test(lower)) {
    const lowStock = /menipis|rendah|habis|kurang/.test(lower)
      ? "AND i.stok < 30"
      : "";

    return `
SELECT i.nama_produk, i.stok, i.kode_barcode, p.unit
FROM inventaris_produk i
LEFT JOIN produk_koperasi p
  ON p.produk_sample_id = i.produk_sample_id AND p.koperasi_ref = i.koperasi_ref
WHERE i.koperasi_ref = '${koperasiRef}' ${lowStock}
ORDER BY i.stok ASC NULLS LAST
LIMIT 100`.trim();
  }

  if (/produk|barang|aqua|beras|gula/.test(lower)) {
    const productMatch = command.match(/aqua|beras|gula|galon/i);
    const nameFilter = productMatch
      ? `AND LOWER(p.nama_produk) LIKE '%${productMatch[0].toLowerCase()}%'`
      : "";

    return `
SELECT p.nama_produk, p.kode_barcode, p.unit, i.stok
FROM produk_koperasi p
LEFT JOIN inventaris_produk i
  ON i.produk_sample_id = p.produk_sample_id AND i.koperasi_ref = p.koperasi_ref
WHERE p.koperasi_ref = '${koperasiRef}' ${nameFilter}
ORDER BY p.nama_produk
LIMIT 100`.trim();
  }

  if (/anggota/.test(lower)) {
    return `
SELECT nama, nik, status_keanggotaan, tanggal_terdaftar, pekerjaan
FROM anggota_koperasi
WHERE koperasi_ref = '${koperasiRef}'
ORDER BY tanggal_terdaftar DESC NULLS LAST
LIMIT 100`.trim();
  }

  if (/simpanan/.test(lower)) {
    return `
SELECT s.jumlah_simpanan, s.periode_pembayaran, s.status, s.dibayar_pada, a.nama AS nama_anggota
FROM simpanan_anggota s
LEFT JOIN anggota_koperasi a
  ON a.anggota_ref = s.anggota_ref AND a.koperasi_ref = s.koperasi_ref
WHERE s.koperasi_ref = '${koperasiRef}'
ORDER BY s.dibayar_pada DESC NULLS LAST
LIMIT 100`.trim();
  }

  return null;
}

export function formatLocalSummary(
  command: string,
  data: Record<string, unknown>[],
): string {
  if (data.length === 0) {
    return "Belum ada data yang cocok dengan permintaan Anda.";
  }

  const lower = command.toLowerCase();
  const count = data.length;

  if (/stok|inventaris|menipis|produk|aqua|beras|gula/.test(lower)) {
    const rows = data
      .slice(0, 5)
      .map((r) => `${r.nama_produk ?? "—"}: ${r.stok ?? 0}`)
      .join(", ");
    return `Ditemukan ${count} produk. ${rows}${count > 5 ? ", ..." : ""}`;
  }

  if (/penjualan|omzet|transaksi/.test(lower)) {
    const total = data.reduce((sum, r) => sum + Number(r.total_pembayaran ?? r.total_nilai ?? 0), 0);
    return `Ada ${count} baris transaksi. Total nilai terkait sekitar Rp ${total.toLocaleString("id-ID")}.`;
  }

  if (/anggota/.test(lower)) {
    return `Tercatat ${count} anggota koperasi.`;
  }

  if (/simpanan/.test(lower)) {
    const total = data.reduce((sum, r) => sum + Number(r.jumlah_simpanan ?? 0), 0);
    return `Ada ${count} catatan simpanan, total Rp ${total.toLocaleString("id-ID")}.`;
  }

  return `Ditemukan ${count} baris data. Tap "Lihat detail" untuk selengkapnya.`;
}
