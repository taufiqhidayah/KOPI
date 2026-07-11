"use client";

import { MAIN_NAV } from "../data/navigation";

type MobileNavProps = {
  activeNav: string;
  onNavChange: (id: string) => void;
};

export function MobileNav({ activeNav, onNavChange }: MobileNavProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
      <select
        value={activeNav}
        onChange={(e) => onNavChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-dark-primary"
      >
        {MAIN_NAV.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
            {item.badge ? ` (${item.badge})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
