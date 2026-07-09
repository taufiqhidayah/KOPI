"use client";

import { currentMember } from "@/lib/mock-data";

export type MemberTab = "beranda" | "usulan" | "riwayat";

interface MemberBottomNavProps {
  active: MemberTab;
  onChange: (tab: MemberTab) => void;
}

const tabs: Array<{ id: MemberTab; label: string; icon: string }> = [
  { id: "beranda", label: "Beranda", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "usulan", label: "Chat", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { id: "riwayat", label: "Riwayat", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export function MemberBottomNav({ active, onChange }: MemberBottomNavProps) {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-sim-border bg-white">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              active === tab.id
                ? "text-sim-primary"
                : "text-sim-muted hover:text-sim-primary"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function MemberProfileCard() {
  return (
    <div className="rounded-sm border border-sim-border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-sim-primary text-sm font-bold text-white">
          {currentMember.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sim-ink">{currentMember.name}</p>
          <p className="text-xs text-sim-muted">
            NIK: {currentMember.nik}
          </p>
          <p className="text-xs text-sim-muted">
            No. Anggota: {currentMember.memberId}
          </p>
        </div>
        <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase">
          Aktif
        </span>
      </div>
    </div>
  );
}
