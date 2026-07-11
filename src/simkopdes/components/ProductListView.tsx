"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ProductRow } from "../types";
import { EditIcon, PlusIcon, SearchIcon } from "./icons";

const PAGE_SIZE = 10;

function ProductThumbnail({ product }: { product: ProductRow }) {
  if (product.thumbnail_url) {
    return (
      <div className="relative h-[50px] w-[50px] overflow-hidden rounded bg-slate-100">
        <Image
          src={product.thumbnail_url}
          alt={product.nama_produk}
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

type ProductListViewProps = {
  onTambahProduk?: () => void;
  refreshKey?: number;
};

export function ProductListView({ onTambahProduk, refreshKey = 0 }: ProductListViewProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/produk?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Gagal memuat produk");

      setItems(data.items as ProductRow[]);
      setTotal(data.total as number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat produk");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4 p-4 lg:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-800">Daftar Produk</h1>
        <button
          type="button"
          onClick={onTambahProduk}
          className="inline-flex items-center gap-2 rounded-md bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <PlusIcon />
          Tambah Produk
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="flex max-w-sm overflow-hidden rounded-md border border-slate-200">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari SKU atau Nama"
              className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              className="flex items-center justify-center border-l border-slate-200 px-3 text-slate-500"
              aria-label="Cari"
            >
              <SearchIcon />
            </button>
          </div>
        </div>

        {error && (
          <p className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-slate-600">
                <th className="px-4 py-3 text-center font-medium">No</th>
                <th className="px-4 py-3 font-medium">Thumbnail</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Jenis Barang</th>
                <th className="px-4 py-3 font-medium">Nama Produk</th>
                <th className="px-4 py-3 font-medium">Potensi Desa</th>
                <th className="px-4 py-3 text-center font-medium">Satuan</th>
                <th className="px-4 py-3 font-medium">Penyedia</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    Produk tidak ditemukan.
                  </td>
                </tr>
              ) : (
                items.map((product, i) => (
                  <tr key={product.produk_sample_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-center text-slate-500">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <ProductThumbnail product={product} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{product.sku}</td>
                    <td className="px-4 py-3">{product.kategori}</td>
                    <td className="px-4 py-3">{product.jenis_barang}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{product.nama_produk}</td>
                    <td className="px-4 py-3 text-slate-600">{product.potensi_desa}</td>
                    <td className="px-4 py-3 text-center">{product.unit}</td>
                    <td className="px-4 py-3 text-slate-600">{product.penyedia}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded bg-yellow-green px-3 py-1 text-xs font-medium text-slate-900 hover:opacity-90"
                      >
                        <EditIcon />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              disabled={loading}
              onClick={() => setPage(n)}
              className={`min-w-8 rounded px-2 py-1 text-sm ${
                n === page
                  ? "border border-dark-primary font-medium text-dark-primary"
                  : "border border-transparent text-slate-600 hover:border-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
          >
            ›
          </button>
          <span className="ml-2 text-xs text-slate-500">
            {PAGE_SIZE} / page · {total} produk
          </span>
        </div>
      </div>
    </div>
  );
}
