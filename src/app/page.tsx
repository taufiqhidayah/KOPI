import Link from "next/link";
import { GovHeaderBand } from "@/components/shared/gov-header-band";
import { cooperativeInfo } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sim-bg">
      <GovHeaderBand />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold text-sim-primary">
            Koperasi Desa/Kelurahan Merah Putih
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-sim-ink">
            Kopdes Intelligence
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-sim-muted">
            Sistem informasi terintegrasi SIMKOPDES untuk transparansi anggota
            dan pengambilan keputusan pengurus {cooperativeInfo.name}.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <PortalCard
            href="/member"
            title="Portal Anggota"
            description="Akses melalui aplikasi SIMKOPDES Mobile. Kirim aspirasi dan pantau status keputusan pengurus."
            badge="WebView Mobile"
          />
          <PortalCard
            href="/dashboard"
            title="Panel Pengurus"
            description="Ringkasan ekonomi, analisis kelayakan usaha, dan peninjauan aspirasi anggota."
            badge="Dashboard Web"
          />
        </div>

        <footer className="mt-14 rounded-2xl bg-sim-bg-muted px-6 py-5 text-center text-xs text-sim-muted">
          <p className="font-bold text-sim-primary">
            Deputi Bidang Kelembagaan dan Digitalisasi Koperasi
          </p>
          <p className="mt-1">Kementerian Koperasi dan UKM Republik Indonesia</p>
          <p className="mt-2">
            {cooperativeInfo.code} · {cooperativeInfo.village}, {cooperativeInfo.regency}
          </p>
        </footer>
      </div>
    </div>
  );
}

function PortalCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-sim-border bg-white p-6 shadow-sm transition-all hover:border-sim-primary/40 hover:shadow-md"
    >
      <span className="inline-block rounded-full bg-sim-primary/10 px-3 py-1 text-[10px] font-bold text-sim-primary uppercase tracking-wide">
        {badge}
      </span>
      <h2 className="mt-3 text-lg font-bold text-sim-ink group-hover:text-sim-primary">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-sim-muted">{description}</p>
      <span className="mt-5 inline-flex items-center justify-center gap-1 rounded-full bg-sim-primary px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-sim-primary-dark">
        Buka modul
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </Link>
  );
}
