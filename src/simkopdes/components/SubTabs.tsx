"use client";

import type { SimkopdesView } from "../types";
import { PENJUALAN_TABS } from "../data/navigation";

type SubTabsProps = {
  activeTab: SimkopdesView;
  onTabChange: (tab: SimkopdesView) => void;
};

export function SubTabs({ activeTab, onTabChange }: SubTabsProps) {
  return (
    <div className="sticky top-0 z-10 shrink-0 rounded-t-3xl bg-white px-6">
      <div className="flex gap-0 overflow-x-auto border-b border-slate-100">
        {PENJUALAN_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative shrink-0 px-4 py-4 text-sm font-medium transition-colors ${
                active ? "text-dark-primary" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-dark-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
