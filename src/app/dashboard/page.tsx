import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TransparencyFeed } from "@/components/member/transparency-feed";

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader
        title="Ringkasan Ekonomi Koperasi"
        subtitle="Data keuangan dan kinerja unit usaha desa"
      />

      <div className="space-y-6 p-8">
        <KpiCards />
        <RevenueChart />

        <div className="rounded-sm border border-sim-border bg-white">
          <div className="border-b border-sim-border px-5 py-4">
            <h2 className="text-sm font-semibold text-sim-primary">
              Aktivitas Aspirasi Terbaru
            </h2>
            <p className="mt-0.5 text-xs text-sim-muted">
              Transparansi keputusan pengurus kepada anggota
            </p>
          </div>
          <TransparencyFeed limit={4} showMemberName />
        </div>
      </div>
    </>
  );
}
