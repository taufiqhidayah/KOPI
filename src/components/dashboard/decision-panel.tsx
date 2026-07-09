"use client";

import { useState } from "react";
import {
  categoryLabels,
  formatDateTime,
  type Aspiration,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";

interface DecisionPanelProps {
  aspiration: Aspiration;
}

export function DecisionPanel({ aspiration }: DecisionPanelProps) {
  const [status, setStatus] = useState(aspiration.status);
  const [note, setNote] = useState(aspiration.managementNote ?? "");
  const [decided, setDecided] = useState(false);

  function handleDecision(decision: "disetujui" | "ditolak") {
    setStatus(decision);
    setDecided(true);
  }

  return (
    <div className="rounded-sm border border-sim-border bg-white">
      <div className="border-b border-sim-border px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-sim-muted">
            {aspiration.id}
          </span>
          <StatusBadge status={status} />
          <span className="rounded-sm bg-sim-bg px-1.5 py-0.5 text-[10px] font-medium text-sim-muted uppercase">
            {categoryLabels[aspiration.category]}
          </span>
        </div>
        <h2 className="mt-2 text-base font-bold text-sim-primary">
          {aspiration.title}
        </h2>
        <p className="mt-1 text-xs text-sim-muted">
          {aspiration.memberName} · NIK {aspiration.memberNik} ·{" "}
          {formatDateTime(aspiration.submittedAt)}
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h3 className="text-xs font-semibold text-sim-ink uppercase tracking-wide">
            Uraian Aspirasi
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-sim-ink">
            {aspiration.description}
          </p>
        </div>

        {aspiration.decisionScore !== undefined && (
          <div className="rounded-sm border border-sim-border bg-sim-bg p-4">
            <h3 className="text-xs font-semibold text-sim-primary uppercase tracking-wide">
              Analisis Kelayakan Usaha
            </h3>
            <p className="mt-1 text-xs text-sim-muted">
              Berdasarkan data keuangan koperasi dan parameter usulan.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <MetricBox
                label="Skor Kelayakan"
                value={`${aspiration.decisionScore}/10`}
              />
              <MetricBox
                label="Proyeksi Balik Modal"
                value={aspiration.roiProjection ?? "—"}
              />
              <MetricBox
                label="Rekomendasi"
                value={
                  aspiration.decisionScore >= 6
                    ? "Layak Ditinjau"
                    : "Perlu Evaluasi"
                }
              />
            </div>

            {aspiration.recommendation && (
              <div className="mt-4 border-t border-sim-border pt-4">
                <p className="text-xs font-semibold text-sim-muted uppercase tracking-wide">
                  Ringkasan Analisis
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-sim-ink">
                  {aspiration.recommendation}
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="management-note"
            className="mb-1.5 block text-xs font-semibold text-sim-ink uppercase tracking-wide"
          >
            Catatan Pengurus
          </label>
          <textarea
            id="management-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tambahkan catatan keputusan untuk ditampilkan kepada anggota..."
            rows={3}
            className="w-full resize-none rounded-sm border border-sim-border bg-white px-3 py-2.5 text-sm focus:border-sim-primary focus:ring-1 focus:ring-sim-primary focus:outline-none"
          />
        </div>

        {decided ? (
          <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Keputusan telah dicatat. Status diperbarui di Linimasa Transparansi
            anggota.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 border-t border-sim-border pt-4">
            <button
              type="button"
              onClick={() => handleDecision("disetujui")}
              className="rounded-full bg-sim-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sim-primary-dark"
            >
              Setujui Usulan
            </button>
            <button
              type="button"
              onClick={() => handleDecision("ditolak")}
              className="rounded-sm border border-sim-border bg-white px-5 py-2.5 text-sm font-semibold text-sim-ink transition-colors hover:bg-sim-bg"
            >
              Tolak Usulan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-sim-border bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium text-sim-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-sim-primary">{value}</p>
    </div>
  );
}
