"use client";

import type { NotaUnmatchedDraft } from "@/lib/nota-queue";
import { getMissingNotaProductFields } from "@/lib/nota-queue";

export type NotaQueueItem = {
  produk_sample_id: string;
  jumlah_masuk: number;
  harga_beli: number;
  nama_produk?: string;
};

export type NotaQueueEntry = {
  id: string;
  fileName: string;
  supplier: string;
  tanggal: string;
  total: number;
  dokumentasi_url?: string;
  dokumentasiFile?: File;
  items: NotaQueueItem[];
  unmatched: NotaUnmatchedDraft[];
};

type NotaQueuePanelProps = {
  queue: NotaQueueEntry[];
  loading?: boolean;
  onRemove: (id: string) => void;
  onSaveAll: () => void;
  onClear: () => void;
  onReviewUnmatched: (notaId: string, itemIndex: number) => void;
};

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function NotaQueuePanel({
  queue,
  loading = false,
  onRemove,
  onSaveAll,
  onClear,
  onReviewUnmatched,
}: NotaQueuePanelProps) {
  if (queue.length === 0) return null;

  const totalItems = queue.reduce((sum, n) => sum + n.items.length + n.unmatched.length, 0);
  const needsReview = queue.some((n) => n.unmatched.some((u) => getMissingNotaProductFields(u).length > 0));

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Antrian Nota OCR</h3>
          <p className="text-xs text-slate-500">
            {queue.length} nota · {totalItems} item
            {needsReview ? " · perlu lengkapi data produk baru" : " · siap konfirmasi"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-red-600 disabled:opacity-40"
        >
          Kosongkan
        </button>
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto">
        {queue.map((nota, index) => (
          <div key={nota.id} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  Nota {index + 1}: {nota.supplier || "Supplier"}
                </p>
                <p className="text-xs text-slate-500">
                  {nota.fileName} · {nota.items.length + nota.unmatched.length} item · {formatRupiah(nota.total)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(nota.id)}
                disabled={loading}
                className="shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                Hapus
              </button>
            </div>
            <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
              {nota.items.slice(0, 4).map((item, i) => (
                <li key={`m-${i}`}>
                  • {item.nama_produk} {item.jumlah_masuk} @ {formatRupiah(item.harga_beli)}
                </li>
              ))}
              {nota.unmatched.slice(0, 4).map((item, i) => {
                const missing = getMissingNotaProductFields(item);
                return (
                  <li key={`u-${i}`} className="flex flex-wrap items-center gap-1 text-amber-800">
                    <span>
                      • {item.nama} {item.qty} {item.unit ?? ""} @ {formatRupiah(item.harga)}
                      {missing.length ? ` (kurang: ${missing.join(", ")})` : " (siap)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onReviewUnmatched(nota.id, i)}
                      disabled={loading}
                      className="rounded-full border border-amber-300 px-2 py-0.5 text-[10px] font-medium text-amber-900"
                    >
                      Edit
                    </button>
                  </li>
                );
              })}
              {nota.items.length + nota.unmatched.length > 4 && (
                <li className="text-slate-400">+{nota.items.length + nota.unmatched.length - 4} item lainnya</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onSaveAll}
          disabled={loading || totalItems === 0}
          className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:bg-slate-300"
        >
          Review & simpan ({queue.length} nota)
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-400">
        Lengkapi produk baru lewat Edit atau chat, lalu konfirmasi simpan
      </p>
    </div>
  );
}
