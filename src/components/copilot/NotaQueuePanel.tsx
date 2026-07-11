"use client";

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
  dokumentasi_url: string;
  items: NotaQueueItem[];
  unmatched: { nama: string; qty: number }[];
};

type NotaQueuePanelProps = {
  queue: NotaQueueEntry[];
  loading?: boolean;
  onRemove: (id: string) => void;
  onSaveAll: () => void;
  onClear: () => void;
};

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function NotaQueuePanel({ queue, loading = false, onRemove, onSaveAll, onClear }: NotaQueuePanelProps) {
  if (queue.length === 0) return null;

  const totalItems = queue.reduce((sum, n) => sum + n.items.length, 0);
  const totalUnmatched = queue.reduce((sum, n) => sum + n.unmatched.length, 0);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Antrian Nota OCR</h3>
          <p className="text-xs text-slate-500">
            {queue.length} nota · {totalItems} item siap simpan
            {totalUnmatched > 0 ? ` · ${totalUnmatched} belum cocok` : ""}
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
                  {nota.fileName} · {nota.items.length} item · {formatRupiah(nota.total)}
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
                <li key={i}>
                  • {item.nama_produk} {item.jumlah_masuk} @ {formatRupiah(item.harga_beli)}
                </li>
              ))}
              {nota.items.length > 4 && (
                <li className="text-slate-400">+{nota.items.length - 4} item lainnya</li>
              )}
              {nota.unmatched.length > 0 && (
                <li className="text-amber-600">
                  ⚠ {nota.unmatched.length} item belum di master
                </li>
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
          Simpan semua ({queue.length} nota)
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-400">
        Upload 📷 lagi untuk tambah nota, atau tap Simpan semua
      </p>
    </div>
  );
}
