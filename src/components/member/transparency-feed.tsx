import {
  aspirations,
  categoryLabels,
  formatDateTime,
  type Aspiration,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";

interface TransparencyFeedProps {
  items?: Aspiration[];
  limit?: number;
  showMemberName?: boolean;
}

export function TransparencyFeed({
  items = aspirations,
  limit,
  showMemberName = false,
}: TransparencyFeedProps) {
  const feedItems = limit ? items.slice(0, limit) : items;

  return (
    <div className="rounded-sm border border-sim-border bg-white">
      <div className="border-b border-sim-border px-4 py-3">
        <h2 className="text-sm font-semibold text-sim-primary">
          Linimasa Transparansi
        </h2>
        <p className="mt-0.5 text-xs text-sim-muted">
          Status aspirasi dan keputusan pengurus koperasi.
        </p>
      </div>

      <div className="divide-y divide-sim-border">
        {feedItems.map((item, index) => (
          <FeedItem
            key={item.id}
            item={item}
            isLast={index === feedItems.length - 1}
            showMemberName={showMemberName}
          />
        ))}
      </div>
    </div>
  );
}

function FeedItem({
  item,
  isLast,
  showMemberName,
}: {
  item: Aspiration;
  isLast: boolean;
  showMemberName: boolean;
}) {
  return (
    <article className="relative px-4 py-4 pl-8">
      <div
        className={`absolute top-5 left-3.5 w-px bg-sim-border ${isLast ? "h-4" : "bottom-0"}`}
        aria-hidden="true"
      />
      <div
        className={`absolute top-4 left-2 h-3 w-3 rounded-full border-2 border-white ${
          item.status === "disetujui"
            ? "bg-emerald-500"
            : item.status === "ditolak"
              ? "bg-red-500"
              : item.status === "dalam_review"
                ? "bg-sky-500"
                : "bg-amber-400"
        }`}
        aria-hidden="true"
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-sim-muted">
            {item.id}
          </span>
          <StatusBadge status={item.status} />
          <span className="rounded-sm bg-sim-bg px-1.5 py-0.5 text-[10px] font-medium text-sim-muted uppercase">
            {categoryLabels[item.category]}
          </span>
        </div>

        <h3 className="text-sm leading-snug font-semibold text-sim-ink">
          {item.title}
        </h3>

        {showMemberName && (
          <p className="text-xs text-sim-muted">
            {item.memberName} · NIK {item.memberNik}
          </p>
        )}

        <p className="text-xs leading-relaxed text-sim-muted">
          {item.description}
        </p>

        <p className="text-[11px] text-sim-muted">
          Diajukan: {formatDateTime(item.submittedAt)}
        </p>

        {item.managementNote && (
          <div className="rounded-sm border border-sim-border bg-sim-bg px-3 py-2">
            <p className="text-[10px] font-semibold text-sim-primary uppercase tracking-wide">
              Catatan Pengurus
            </p>
            <p className="mt-1 text-xs leading-relaxed text-sim-ink">
              {item.managementNote}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
