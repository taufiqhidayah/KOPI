"use client";

import { useState } from "react";
import {
  aspirations,
  categoryLabels,
  formatDateTime,
  type Aspiration,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { DecisionPanel } from "@/components/dashboard/decision-panel";

export function PendingAspirations() {
  const pending = aspirations.filter(
    (a) => a.status === "menunggu" || a.status === "dalam_review",
  );
  const [selected, setSelected] = useState<Aspiration | null>(
    pending.find((a) => a.status === "dalam_review") ?? pending[0] ?? null,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="rounded-sm border border-sim-border bg-white">
          <div className="border-b border-sim-border px-5 py-4">
            <h2 className="text-sm font-semibold text-sim-primary">
              Aspirasi Perlu Tindakan
            </h2>
            <p className="mt-0.5 text-xs text-sim-muted">
              {pending.length} aspirasi menunggu keputusan pengurus
            </p>
          </div>

          <div className="divide-y divide-sim-border">
            {pending.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-sim-muted">
                Tidak ada aspirasi yang perlu ditinjau.
              </p>
            ) : (
              pending.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`w-full px-5 py-4 text-left transition-colors hover:bg-sim-bg ${
                    selected?.id === item.id ? "bg-sky-50/60" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-sim-muted">
                      {item.id}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-sim-ink">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-sim-muted">
                    {item.memberName} · {categoryLabels[item.category]} ·{" "}
                    {formatDateTime(item.submittedAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {selected ? (
          <DecisionPanel aspiration={selected} />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-sm border border-dashed border-sim-border bg-white p-8">
            <p className="text-sm text-sim-muted">
              Pilih aspirasi untuk melihat analisis dan mengambil keputusan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
