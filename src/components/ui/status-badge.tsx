import type { AspirationStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<AspirationStatus, string> = {
  menunggu: "bg-amber-50 text-amber-800 border-amber-200",
  dalam_review: "bg-sky-50 text-sky-800 border-sky-200",
  disetujui: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ditolak: "bg-red-50 text-red-800 border-red-200",
};

const statusLabels: Record<AspirationStatus, string> = {
  menunggu: "Menunggu Review",
  dalam_review: "Sedang Ditinjau",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

interface StatusBadgeProps {
  status: AspirationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
