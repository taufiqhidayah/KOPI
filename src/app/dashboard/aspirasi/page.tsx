import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PendingAspirations } from "@/components/dashboard/pending-aspirations";

export default function AspirasiPage() {
  return (
    <>
      <DashboardHeader
        title="Peninjauan Aspirasi Anggota"
        subtitle="Analisis kelayakan usaha dan pengambilan keputusan pengurus"
      />

      <div className="p-8">
        <PendingAspirations />
      </div>
    </>
  );
}
