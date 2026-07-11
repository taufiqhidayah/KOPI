"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { PlusIcon, SearchIcon } from "./icons";

const PAGE_SIZE = 10;

type BarangMasukRow = {
  barang_masuk_ref: string;
  sku: string;
  gambar_url: string | null;
  nama_produk: string;
  nama_tampilan: string | null;
  jumlah_masuk: number;
  jumlah_tersedia: number;
  unit: string;
  harga_beli: number;
};

type BarangMasukListViewProps = {
  onTambahBarangMasuk?: () => void;
  refreshKey?: number;
};

function BarangMasukGambar({ row }: { row: BarangMasukRow }) {
  if (row.gambar_url) {
    return (
      <div className="relative h-[50px] w-[50px] overflow-hidden rounded bg-slate-100">
        <Image
          src={row.gambar_url}
          alt={row.nama_produk}
          fill
          className="object-cover"
          sizes="50px"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div className="flex h-[50px] w-[50px] items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">
      No Image
    </div>
  );
}

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function BarangMasukListView({ onTambahBarangMasuk, refreshKey = 0 }: BarangMasukListViewProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<BarangMasukRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/barang-masuk?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Gagal memuat barang masuk");

      setItems(data.items as BarangMasukRow[]);
      setTotal(data.total as number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat barang masuk");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4 p-4 lg:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-800">Barang Masuk</h1>
        <button
          type="button"
          onClick={onTambahBarangMasuk}
          className="inline-flex items-center gap-2 rounded-md bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <PlusIcon />
          Tambah Barang Masuk
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari SKU atau Nama"
              className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-dark-primary focus:ring-1 focus:ring-dark-primary/20"
            />
          </div>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 text-center font-medium">No</th>
                <th className="px-4 py-3 font-medium">Gambar</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Nama Produk</th>
                <th className="px-4 py-3 font-medium">Nama Tampilan</th>
                <th className="px-4 py-3 text-center font-medium">Jumlah Masuk</th>
                <th className="px-4 py-3 text-center font-medium">Jumlah Tersedia</th>
                <th className="px-4 py-3 font-medium">Harga Beli</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Belum ada data barang masuk.
                  </td>
                </tr>
              ) : (
                items.map((row, i) => (
                  <tr key={row.barang_masuk_ref} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-center text-slate-500">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <BarangMasukGambar row={row} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.nama_produk}</td>
                    <td className="px-4 py-3 text-slate-700">{row.nama_tampilan ?? row.nama_produk}</td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {row.jumlah_masuk} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {row.jumlah_tersedia} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatRupiah(row.harga_beli)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            {total} entri · halaman {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
