import { financialSummary, formatCurrency } from "@/lib/mock-data";

export function KpiCards() {
  const cards = [
    {
      label: "Total Omzet",
      value: formatCurrency(financialSummary.omzet),
      change: financialSummary.omzetChange,
      period: "tahun berjalan",
    },
    {
      label: "SHU (Sisa Hasil Usaha)",
      value: formatCurrency(financialSummary.shu),
      change: financialSummary.shuChange,
      period: "tahun berjalan",
    },
    {
      label: "Saldo Kas",
      value: formatCurrency(financialSummary.kas),
      change: financialSummary.kasChange,
      period: "posisi terkini",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-sm border border-sim-border bg-white p-5"
        >
          <p className="text-xs font-semibold text-sim-muted uppercase tracking-wide">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-sim-primary">{card.value}</p>
          <p className="mt-2 text-xs text-sim-muted">
            <span
              className={`font-semibold ${
                card.change >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {card.change >= 0 ? "+" : ""}
              {card.change}%
            </span>{" "}
            {card.period}
          </p>
        </div>
      ))}
    </div>
  );
}
