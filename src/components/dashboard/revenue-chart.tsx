import { monthlyRevenue } from "@/lib/mock-data";

export function RevenueChart() {
  const maxOmzet = Math.max(...monthlyRevenue.map((d) => d.omzet));

  return (
    <div className="rounded-sm border border-sim-border bg-white">
      <div className="border-b border-sim-border px-5 py-4">
        <h2 className="text-sm font-semibold text-sim-primary">
          Grafik Omzet & SHU Bulanan
        </h2>
        <p className="mt-0.5 text-xs text-sim-muted">
          Periode Januari — Desember 2026
        </p>
      </div>

      <div className="p-5">
        <div className="flex items-end gap-2" style={{ height: 180 }}>
          {monthlyRevenue.map((data) => {
            const omzetHeight = (data.omzet / maxOmzet) * 100;
            const shuHeight = (data.shu / maxOmzet) * 100;

            return (
              <div
                key={data.month}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 150 }}>
                  <div
                    className="w-[40%] rounded-t-sm bg-sim-primary"
                    style={{ height: `${omzetHeight}%`, minHeight: 4 }}
                    title={`Omzet: ${data.omzet.toLocaleString("id-ID")}`}
                  />
                  <div
                    className="w-[40%] rounded-t-sm bg-sim-accent"
                    style={{ height: `${shuHeight}%`, minHeight: 2 }}
                    title={`SHU: ${data.shu.toLocaleString("id-ID")}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-sim-muted">
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 border-t border-sim-border pt-4">
          <div className="flex items-center gap-2 text-xs text-sim-muted">
            <span className="h-3 w-3 rounded-sm bg-sim-primary" />
            Omzet
          </div>
          <div className="flex items-center gap-2 text-xs text-sim-muted">
            <span className="h-3 w-3 rounded-sm bg-sim-accent" />
            SHU
          </div>
        </div>
      </div>
    </div>
  );
}
