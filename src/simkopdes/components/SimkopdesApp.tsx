"use client";

import { useEffect, useState } from "react";
import type { SimkopdesView } from "../types";
import { NavSidebar } from "./NavSidebar";
import { TopHeader } from "./TopHeader";
import { SubTabs } from "./SubTabs";
import { ProductListView } from "./ProductListView";
import { BarangMasukListView } from "./BarangMasukListView";
import { PlaceholderView } from "./PlaceholderView";
import { CopilotEmbedPanel } from "./CopilotEmbedPanel";
import { CopilotFab } from "./CopilotFab";
import { MobileNav } from "./MobileNav";

function openCopilot(
  setCopilotOpen: (v: boolean) => void,
  setCopilotView: (v: "chat" | "barang_masuk_form") => void,
  setCopilotPrompt: (v: string | undefined) => void,
  opts?: { prompt?: string; view?: "chat" | "barang_masuk_form" },
) {
  setCopilotView(opts?.view ?? "chat");
  setCopilotPrompt(opts?.prompt);
  setCopilotOpen(true);
}

export function SimkopdesApp() {
  const [activeNav, setActiveNav] = useState("penjualan");
  const [activeTab, setActiveTab] = useState<SimkopdesView>("produk");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotView, setCopilotView] = useState<"chat" | "barang_masuk_form">("chat");
  const [copilotPrompt, setCopilotPrompt] = useState<string | undefined>();
  const [productRefresh, setProductRefresh] = useState(0);
  const [barangMasukRefresh, setBarangMasukRefresh] = useState(0);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "kopdes-copilot-saved") {
        setProductRefresh((n) => n + 1);
        setBarangMasukRefresh((n) => n + 1);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const showPenjualan = activeNav === "penjualan";

  const renderMainView = () => {
    if (!showPenjualan) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 text-4xl">🏛️</div>
          <h2 className="text-lg font-semibold text-slate-700">
            {MAIN_NAV_LABEL(activeNav)}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Modul SIMKOPDES. Buka Kopdes Copilot untuk bantuan input data lewat chat.
          </p>
          <button
            type="button"
            onClick={() => openCopilot(setCopilotOpen, setCopilotView, setCopilotPrompt)}
            className="mt-4 rounded-md bg-dark-primary px-4 py-2 text-sm font-medium text-white"
          >
            Buka Copilot
          </button>
        </div>
      );
    }

    if (activeTab === "produk") {
      return (
        <ProductListView
          refreshKey={productRefresh}
          onTambahProduk={() => openCopilot(setCopilotOpen, setCopilotView, setCopilotPrompt)}
        />
      );
    }

    if (activeTab === "barang-masuk") {
      return (
        <BarangMasukListView
          refreshKey={barangMasukRefresh}
          onTambahBarangMasuk={() =>
            openCopilot(setCopilotOpen, setCopilotView, setCopilotPrompt, {
              prompt: "Tambah barang masuk",
            })
          }
        />
      );
    }

    return <PlaceholderView tab={activeTab} />;
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5]">
      <TopHeader />

      <div className="flex min-h-0 flex-1 lg:px-4">
        <NavSidebar
          activeNav={activeNav}
          onNavChange={(id) => {
            setActiveNav(id);
            if (id === "penjualan") setActiveTab("produk");
          }}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:px-4">
          <MobileNav
            activeNav={activeNav}
            onNavChange={(id) => {
              setActiveNav(id);
              if (id === "penjualan") setActiveTab("produk");
            }}
          />
          <div className="flex h-[calc(100dvh-85px)] min-h-0 flex-col lg:h-[calc(100dvh-120px)]">
            {showPenjualan && (
              <SubTabs activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            <div className="flex min-h-0 flex-1">
              <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-b-3xl bg-white p-6 lg:mt-2">
                {renderMainView()}
              </main>

              <CopilotEmbedPanel
                open={copilotOpen}
                initialView={copilotView}
                initialPrompt={copilotPrompt}
              />
            </div>
          </div>
        </div>
      </div>

      <CopilotFab open={copilotOpen} onClick={() => setCopilotOpen((v) => !v)} />
    </div>
  );
}

function MAIN_NAV_LABEL(id: string): string {
  const labels: Record<string, string> = {
    beranda: "Beranda",
    formulir: "Formulir Permohonan",
    anggota: "Anggota",
    karyawan: "Karyawan",
    rat: "Rapat Anggota Tahunan",
    simpanan: "Simpanan",
    pinjaman: "Pinjaman",
    penjualan: "Penjualan",
    "off-taker": "Off-Taker",
    klinik: "Klinik Desa",
    apotek: "Apotek Desa",
    laporan: "Laporan Keuangan",
    shu: "SHU",
    magang: "Program Magang",
    artikel: "Artikel Koperasi",
    layanan: "Penyedia Layanan Teknologi",
    pengaduan: "Pengaduan Anggota",
    "jaga-desa": "Jaga Desa",
  };
  return labels[id] ?? id;
}
