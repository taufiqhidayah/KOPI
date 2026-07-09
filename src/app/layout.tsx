import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kopdes Intelligence — SIMKOPDES",
  description:
    "Modul cerdas koperasi desa untuk transparansi anggota dan pengambilan keputusan pengurus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full bg-sim-bg text-sim-ink antialiased">
        {children}
      </body>
    </html>
  );
}
