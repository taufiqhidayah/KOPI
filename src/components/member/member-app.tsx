"use client";

import { useState } from "react";
import { GovHeaderBand } from "@/components/shared/gov-header-band";
import { AspirationChat } from "@/components/member/aspiration-chat";
import { TransparencyFeed } from "@/components/member/transparency-feed";
import {
  MemberBottomNav,
  MemberProfileCard,
  type MemberTab,
} from "@/components/member/member-nav";
import { cooperativeInfo, formatCurrency, financialSummary } from "@/lib/mock-data";

export function MemberApp() {
  const [activeTab, setActiveTab] = useState<MemberTab>("beranda");

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-sim-bg pb-20">
      <GovHeaderBand />

      <div className="px-4 py-4">
        {activeTab === "beranda" && <BerandaTab />}
        {activeTab === "usulan" && <UsulanTab />}
        {activeTab === "riwayat" && <RiwayatTab />}
      </div>

      <MemberBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

function BerandaTab() {
  return (
    <div className="animate-fade-in space-y-4">
      <MemberProfileCard />

      <div className="grid grid-cols-2 gap-3">
        <SummaryMini
          label="Omzet Bulan Ini"
          value={formatCurrency(28900000)}
          change="+6,2%"
        />
        <SummaryMini
          label="SHU Tahun Berjalan"
          value={formatCurrency(financialSummary.shu)}
          change={`+${financialSummary.shuChange}%`}
        />
      </div>

      <div className="rounded-sm border border-sim-border bg-white p-4">
        <h2 className="text-sm font-semibold text-sim-primary">
          Informasi Koperasi
        </h2>
        <dl className="mt-3 space-y-2 text-xs">
          <InfoRow label="Kode" value={cooperativeInfo.code} />
          <InfoRow label="Desa" value={cooperativeInfo.village} />
          <InfoRow
            label="Wilayah"
            value={`${cooperativeInfo.district}, ${cooperativeInfo.regency}`}
          />
        </dl>
      </div>

      <TransparencyFeed limit={3} />
    </div>
  );
}

function UsulanTab() {
  return <AspirationChat />;
}

function RiwayatTab() {
  return (
    <div className="animate-fade-in">
      <TransparencyFeed />
    </div>
  );
}

function SummaryMini({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  const isPositive = change.startsWith("+");
  return (
    <div className="rounded-sm border border-sim-border bg-white p-3">
      <p className="text-[10px] font-medium text-sim-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-sim-primary">{value}</p>
      <p
        className={`mt-0.5 text-[11px] font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}
      >
        {change} dari periode lalu
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sim-muted">{label}</dt>
      <dd className="text-right font-medium text-sim-ink">{value}</dd>
    </div>
  );
}
