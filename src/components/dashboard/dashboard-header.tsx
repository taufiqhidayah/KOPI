import { cooperativeInfo } from "@/lib/mock-data";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="border-b border-sim-border bg-white px-8 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-sim-muted uppercase tracking-wide">
            {cooperativeInfo.village} · {cooperativeInfo.regency}
          </p>
          <h1 className="mt-1 text-xl font-bold text-sim-primary">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-sim-muted">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-sim-ink">Bapak Joko Widodo</p>
            <p className="text-xs text-sim-muted">Ketua Pengurus</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-sim-primary text-xs font-bold text-white">
            JW
          </div>
        </div>
      </div>
    </header>
  );
}
