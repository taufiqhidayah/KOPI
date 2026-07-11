"use client";

import { useEffect, useRef, useState } from "react";
import {
  DOKUMENTASI_MAX_BYTES,
  DOKUMENTASI_MIME,
} from "@/lib/barang-masuk-constants";

export type BarangMasukFormValues = {
  produk_sample_id: string;
  nama_produk: string;
  nama_tampilan: string;
  jumlah_masuk: number;
  unit: string;
  harga_beli: number;
  harga_jual: number;
  keterangan: string;
  dokumentasi?: File;
};

type ProdukOption = {
  produk_sample_id: string;
  nama_produk: string;
  unit: string;
};

type BarangMasukFormProps = {
  onSubmit: (values: BarangMasukFormValues) => void;
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

export function BarangMasukForm({ onSubmit, onCancel, loading = false }: BarangMasukFormProps) {
  const [produk, setProduk] = useState<ProdukOption[]>([]);
  const [produkLoading, setProdukLoading] = useState(true);
  const [produkError, setProdukError] = useState<string | null>(null);

  const [produkId, setProdukId] = useState("");
  const [namaTampilan, setNamaTampilan] = useState("");
  const [jumlahMasuk, setJumlahMasuk] = useState("");
  const [unit, setUnit] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [dokumentasi, setDokumentasi] = useState<File | null>(null);
  const [dokumentasiError, setDokumentasiError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProdukLoading(true);
      setProdukError(null);
      try {
        const res = await fetch("/api/produk?page=1&pageSize=100");
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Gagal memuat produk");
        if (!cancelled) {
          setProduk(
            (data.items as ProdukOption[]).map((p) => ({
              produk_sample_id: p.produk_sample_id,
              nama_produk: p.nama_produk,
              unit: p.unit,
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setProdukError(err instanceof Error ? err.message : "Gagal memuat produk");
        }
      } finally {
        if (!cancelled) setProdukLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProdukChange = (id: string) => {
    setProdukId(id);
    const selected = produk.find((p) => p.produk_sample_id === id);
    if (selected) {
      setNamaTampilan(selected.nama_produk);
      setUnit(selected.unit);
    }
  };

  const handleDokumentasiChange = (file: File | null) => {
    setDokumentasiError(null);
    if (!file) {
      setDokumentasi(null);
      return;
    }
    if (!DOKUMENTASI_MIME.has(file.type)) {
      setDokumentasiError("Format harus JPG, PNG, atau PDF.");
      setDokumentasi(null);
      return;
    }
    if (file.size > DOKUMENTASI_MAX_BYTES) {
      setDokumentasiError("Ukuran maksimal 10MB.");
      setDokumentasi(null);
      return;
    }
    setDokumentasi(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!produkId) {
      setFormError("Pilih produk terlebih dahulu.");
      return;
    }

    const jumlah = Number(jumlahMasuk);
    if (!jumlah || jumlah <= 0) {
      setFormError("Jumlah masuk harus lebih dari 0.");
      return;
    }

    const selected = produk.find((p) => p.produk_sample_id === produkId);
    if (!selected) {
      setFormError("Produk tidak valid.");
      return;
    }

    onSubmit({
      produk_sample_id: produkId,
      nama_produk: selected.nama_produk,
      nama_tampilan: namaTampilan.trim() || selected.nama_produk,
      jumlah_masuk: jumlah,
      unit: unit || selected.unit,
      harga_beli: parseRupiah(hargaBeli),
      harga_jual: parseRupiah(hargaJual),
      keterangan: keterangan.trim(),
      dokumentasi: dokumentasi ?? undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Tambah Barang Masuk</h3>
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
          <span className="mb-1 block text-xs font-medium text-slate-600">Produk</span>
          <select
            value={produkId}
            onChange={(e) => handleProdukChange(e.target.value)}
            disabled={produkLoading || loading}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:bg-slate-50"
          >
            <option value="">Pilih produk</option>
            {produk.map((p) => (
              <option key={p.produk_sample_id} value={p.produk_sample_id}>
                {p.nama_produk}
              </option>
            ))}
          </select>
          {produkError && <p className="mt-1 text-xs text-red-600">{produkError}</p>}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Nama Tampilan</span>
          <input
            type="text"
            value={namaTampilan}
            onChange={(e) => setNamaTampilan(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Jumlah Masuk</span>
            <input
              type="number"
              min="1"
              step="any"
              value={jumlahMasuk}
              onChange={(e) => setJumlahMasuk(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Unit</span>
            <input
              type="text"
              value={unit}
              readOnly
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Harga Jual</span>
            <div className="flex rounded-lg border border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30">
              <span className="flex items-center px-2 text-xs text-slate-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={hargaJual}
                onChange={(e) => setHargaJual(formatRupiah(parseRupiah(e.target.value)))}
                disabled={loading}
                className="w-full rounded-r-lg border-0 py-2 pr-3 text-sm outline-none"
              />
            </div>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Keterangan</span>
          <textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value.slice(0, 1000))}
            disabled={loading}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
          <span className="mt-0.5 block text-right text-[10px] text-slate-400">
            {keterangan.length} / 1000
          </span>
        </label>

        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600">Dokumentasi</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={(e) => {
              handleDokumentasiChange(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-3 text-left text-xs text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50 disabled:opacity-50"
          >
            {dokumentasi ? dokumentasi.name : "Pilih file (JPG, PNG, PDF — maks. 10MB)"}
          </button>
          {dokumentasiError && <p className="mt-1 text-xs text-red-600">{dokumentasiError}</p>}
        </div>

        {formError && <p className="text-xs text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={loading || produkLoading}
          className="w-full rounded-full bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:bg-slate-300"
        >
          {loading ? "Memproses..." : "Simpan barang masuk"}
        </button>
      </div>
    </form>
  );
}
