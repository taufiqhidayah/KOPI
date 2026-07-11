"use client";

import { useState } from "react";
import { sanitizeProdukName } from "@/lib/tambah-produk-guide";

export type TambahProdukEditValues = {
  nama_produk: string;
  unit: string;
  jumlah_masuk?: number;
  harga_beli?: number;
  kategori?: string;
  jenis_barang?: string;
  potensi_desa?: string;
  penyedia?: string;
};

type TambahProdukEditFormProps = {
  initial: TambahProdukEditValues;
  onSubmit: (values: TambahProdukEditValues) => void;
  onCancel: () => void;
  loading?: boolean;
};

function parseRupiah(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatRupiah(value: number): string {
  if (!value) return "";
  return value.toLocaleString("id-ID");
}

export function TambahProdukEditForm({
  initial,
  onSubmit,
  onCancel,
  loading = false,
}: TambahProdukEditFormProps) {
  const [namaProduk, setNamaProduk] = useState(initial.nama_produk);
  const [unit, setUnit] = useState(initial.unit);
  const [kategori, setKategori] = useState(initial.kategori ?? "");
  const [jenisBarang, setJenisBarang] = useState(initial.jenis_barang ?? "");
  const [potensiDesa, setPotensiDesa] = useState(initial.potensi_desa ?? "");
  const [penyedia, setPenyedia] = useState(initial.penyedia ?? "");
  const [jumlah, setJumlah] = useState(initial.jumlah_masuk ? String(initial.jumlah_masuk) : "");
  const [hargaBeli, setHargaBeli] = useState(
    initial.harga_beli ? formatRupiah(initial.harga_beli) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nama = sanitizeProdukName(namaProduk.trim());
    if (!nama) {
      setError("Nama produk wajib diisi.");
      return;
    }

    const jumlahNum = jumlah.trim() ? Number(jumlah) : undefined;
    if (jumlahNum !== undefined && jumlahNum <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }

    onSubmit({
      nama_produk: nama,
      unit: unit.trim() || "unit",
      kategori: kategori.trim() || undefined,
      jenis_barang: jenisBarang.trim() || undefined,
      potensi_desa: potensiDesa.trim() || undefined,
      penyedia: penyedia.trim() || undefined,
      jumlah_masuk: jumlahNum,
      harga_beli: parseRupiah(hargaBeli) || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Edit Produk</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Tutup
        </button>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Nama Produk</span>
          <input
            type="text"
            value={namaProduk}
            onChange={(e) => setNamaProduk(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Satuan</span>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Kategori</span>
            <input
              type="text"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              disabled={loading}
              placeholder="Sembako"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Jenis Barang</span>
            <input
              type="text"
              value={jenisBarang}
              onChange={(e) => setJenisBarang(e.target.value)}
              disabled={loading}
              placeholder="Makanan"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Potensi Desa</span>
            <input
              type="text"
              value={potensiDesa}
              onChange={(e) => setPotensiDesa(e.target.value)}
              disabled={loading}
              placeholder="Pertanian"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Penyedia</span>
          <input
            type="text"
            value={penyedia}
            onChange={(e) => setPenyedia(e.target.value)}
            disabled={loading}
            placeholder="PT Makmur"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Stok awal</span>
            <input
              type="number"
              min="0"
              step="any"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              disabled={loading}
              placeholder="Opsional"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Harga Beli</span>
            <div className="flex rounded-lg border border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30">
              <span className="flex items-center px-2 text-xs text-slate-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={hargaBeli}
                onChange={(e) => setHargaBeli(formatRupiah(parseRupiah(e.target.value)))}
                disabled={loading}
                className="w-full rounded-r-lg border-0 py-2 pr-3 text-sm outline-none"
              />
            </div>
          </label>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:bg-slate-300"
        >
          {loading ? "Memproses..." : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}
