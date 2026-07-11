"use client";

import type { SimkopdesView } from "../types";

type PlaceholderViewProps = {
  tab: SimkopdesView;
};

const LABELS: Record<SimkopdesView, string> = {
  transaksi: "Transaksi",
  produk: "Produk",
  "barang-masuk": "Barang Masuk",
  "barang-keluar": "Barang Keluar",
  inventaris: "Inventaris",
};

export function PlaceholderView({ tab }: PlaceholderViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-4xl">📋</div>
      <h2 className="text-lg font-semibold text-dark-primary">{LABELS[tab]}</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Modul {LABELS[tab]} SIMKOPDES. Gunakan Kopdes Copilot untuk input cepat lewat chat.
      </p>
    </div>
  );
}
