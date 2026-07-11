"use client";

import type { CrudConfirmView } from "@/lib/crud-confirm";

type CrudConfirmCardProps = {
  confirm: CrudConfirmView;
  onConfirm: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
};

export function CrudConfirmCard({ confirm, onConfirm, onEdit, onCancel, loading = false }: CrudConfirmCardProps) {
  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
      <p className="text-xs font-semibold text-amber-900">{confirm.title}</p>
      <p className="mt-0.5 text-xs text-amber-800/80">{confirm.description}</p>

      <dl className="mt-2 space-y-1">
        {confirm.fields.map((field) => (
          <div key={field.label} className="flex gap-2 text-xs">
            <dt className="w-24 shrink-0 text-slate-500">{field.label}</dt>
            <dd className="min-w-0 flex-1 break-words font-medium text-slate-800">{field.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex gap-2">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={loading}
            className="flex-1 rounded-full border border-amber-300 bg-white py-2 text-xs font-medium text-amber-900 disabled:opacity-50"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Ya, simpan"}
        </button>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          Batalkan
        </button>
      )}
    </div>
  );
}
