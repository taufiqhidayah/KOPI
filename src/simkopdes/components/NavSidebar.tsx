"use client";

import { MAIN_NAV } from "../data/navigation";
import { NavIcon } from "./icons";

type NavSidebarProps = {
  activeNav: string;
  onNavChange: (id: string) => void;
};

export function NavSidebar({ activeNav, onNavChange }: NavSidebarProps) {
  return (
    <aside
      className="sticky top-0 z-40 hidden h-[calc(100dvh-120px)] w-[250px] shrink-0 overflow-y-auto rounded-tr-3xl bg-dark-primary [scrollbar-width:none] lg:ml-4 lg:block lg:rounded-3xl"
    >
      <nav className="py-2">
        {MAIN_NAV.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavChange(item.id)}
              className={`flex w-full items-center gap-3 px-6 py-3 text-left text-sm transition-colors ${
                active
                  ? "bg-white font-medium text-dark-primary"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <span className="shrink-0 opacity-90">
                <NavIcon name={item.icon} />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
