"use client";

import Image from "next/image";

type TopHeaderProps = {
  userName?: string;
};

export function TopHeader({ userName = "Manajer Uxdxy" }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-[85px] shrink-0 items-center justify-between bg-white px-4 shadow-sm lg:h-[120px] lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src="/simkopdes-logo.png"
          alt="Simkopdes"
          width={200}
          height={56}
          className="h-10 w-auto shrink-0 object-contain lg:h-14"
          priority
        />
        <div className="min-w-0">
          <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 lg:text-xs">
            Demo
          </span>
          <p className="mt-0.5 truncate text-[10px] text-slate-500 lg:text-xs">
            Hackathon SIMKOPDES 2026 · KOPDES-DEMO-001
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-md bg-red-500 px-3 py-2 text-xs font-medium text-white sm:flex"
        >
          <span>🔔</span>
          Verifikasi Email Anda
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-dark-primary">
            {userName.charAt(0)}
          </span>
          <span className="hidden sm:inline">{userName}</span>
          <span className="text-slate-400">▾</span>
        </button>
      </div>
    </header>
  );
}
