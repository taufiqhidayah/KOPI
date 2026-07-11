"use client";

import type { CrudConfirmField } from "@/lib/crud-confirm";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  preview?: Record<string, unknown> | CrudConfirmField[] | null;
  onConfirm: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
};

function PreviewFields({ fields }: { fields: CrudConfirmField[] }) {
  return (
    <dl className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-3">
      {fields.map((field) => (
        <div key={field.label} className="flex gap-2 text-sm">
          <dt className="w-28 shrink-0 text-slate-500">{field.label}</dt>
          <dd className="min-w-0 flex-1 break-words font-medium text-slate-800">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  preview,
  onConfirm,
  onEdit,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const previewFields = Array.isArray(preview) ? preview : null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="w-full rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>

        {previewFields && <PreviewFields fields={previewFields} />}

        <div className="mt-5 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={loading}
              className="flex-1 rounded-full border border-amber-300 py-2.5 text-sm font-medium text-amber-900 disabled:opacity-50"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Ya, simpan"}
          </button>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Batalkan
          </button>
        )}
      </div>
    </div>
  );
}
