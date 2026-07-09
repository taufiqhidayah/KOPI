import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Anggota — Kopdes Intelligence",
  description: "Modul aspirasi dan transparansi untuk anggota koperasi desa.",
};

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sim-bg">
      {children}
    </div>
  );
}
