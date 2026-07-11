"use client";

import type { ReportView } from "@/lib/report-format";

type ReportPreviewProps = {
  report: ReportView;
};

function cellValue(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function buildCsv(report: ReportView): string {
  const header = report.columns.map((c) => c.label).join(",");
  const rows = report.rows.map((row) =>
    report.columns
      .map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportPreview({ report }: ReportPreviewProps) {
  const handleCsv = () => {
    const slug = report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    downloadBlob(`${slug || "laporan"}.csv`, buildCsv(report), "text/csv;charset=utf-8;");
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCsv}
          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white"
        >
          Unduh CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
        <table className="min-w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              {report.columns.map((col) => (
                <th key={col.key} className="px-3 py-2 font-medium whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-200">
                {report.columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                    {cellValue(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">{report.rows.length} baris</p>
    </div>
  );
}
