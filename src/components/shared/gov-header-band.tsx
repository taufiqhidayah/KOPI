import { cooperativeInfo } from "@/lib/mock-data";

export function GovHeaderBand() {
  return (
    <header className="bg-sim-primary text-white">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path
              d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-white/90">
            Koperasi Desa/Kelurahan Merah Putih
          </p>
          <p className="truncate text-sm font-bold leading-tight">
            {cooperativeInfo.name}
          </p>
        </div>
      </div>
      <div className="flex h-1">
        <span className="flex-1 bg-sim-red" />
        <span className="flex-1 bg-white" />
      </div>
    </header>
  );
}
