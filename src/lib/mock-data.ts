export type AspirationStatus =
  | "menunggu"
  | "dalam_review"
  | "disetujui"
  | "ditolak";

export type AspirationCategory = "usulan" | "keluhan" | "pertanyaan";

export interface Aspiration {
  id: string;
  memberName: string;
  memberNik: string;
  category: AspirationCategory;
  title: string;
  description: string;
  submittedAt: string;
  status: AspirationStatus;
  managementNote?: string;
  decisionScore?: number;
  roiProjection?: string;
  recommendation?: string;
}

export interface FinancialSummary {
  omzet: number;
  shu: number;
  kas: number;
  omzetChange: number;
  shuChange: number;
  kasChange: number;
}

export interface MonthlyRevenue {
  month: string;
  omzet: number;
  shu: number;
}

export const cooperativeInfo = {
  name: "Koperasi Desa Makmur Sejahtera",
  code: "KOPDES-3301-0042",
  village: "Desa Sumber Rejo",
  district: "Kec. Ngawi",
  regency: "Kab. Ngawi",
};

export const currentMember = {
  name: "Sari Wulandari",
  nik: "3301****4521",
  memberId: "AGT-2024-0187",
  joinYear: 2019,
};

export const financialSummary: FinancialSummary = {
  omzet: 284750000,
  shu: 42350000,
  kas: 156200000,
  omzetChange: 8.4,
  shuChange: 5.2,
  kasChange: -2.1,
};

export const monthlyRevenue: MonthlyRevenue[] = [
  { month: "Jan", omzet: 19800000, shu: 2850000 },
  { month: "Feb", omzet: 21400000, shu: 3100000 },
  { month: "Mar", omzet: 23100000, shu: 3350000 },
  { month: "Apr", omzet: 22600000, shu: 3280000 },
  { month: "Mei", omzet: 24500000, shu: 3520000 },
  { month: "Jun", omzet: 25200000, shu: 3680000 },
  { month: "Jul", omzet: 26100000, shu: 3810000 },
  { month: "Agu", omzet: 24800000, shu: 3590000 },
  { month: "Sep", omzet: 25700000, shu: 3720000 },
  { month: "Okt", omzet: 26900000, shu: 3890000 },
  { month: "Nov", omzet: 27800000, shu: 4010000 },
  { month: "Des", omzet: 28900000, shu: 4180000 },
];

export const aspirations: Aspiration[] = [
  {
    id: "ASP-2026-0041",
    memberName: "Sari Wulandari",
    memberNik: "3301****4521",
    category: "usulan",
    title: "Pembukaan unit usaha gerai sembako desa",
    description:
      "Usulan pembukaan gerai sembako di balai desa agar anggota tidak perlu ke pasar kota. Modal awal diperkirakan Rp 25 juta dengan target omzet Rp 8 juta per bulan.",
    submittedAt: "2026-07-08T09:14:00",
    status: "dalam_review",
    decisionScore: 7,
    roiProjection: "18–24 bulan",
    recommendation:
      "Kas koperasi mencukupi. Permintaan anggota tinggi berdasarkan survei internal. Disarankan pilot 3 bulan dengan evaluasi berkala.",
  },
  {
    id: "ASP-2026-0038",
    memberName: "Budi Santoso",
    memberNik: "3301****7832",
    category: "usulan",
    title: "Kerjasama pengadaan pupuk subsidi",
    description:
      "Mengajukan kerjasama dengan distributor pupuk untuk menjadi agen resmi di desa menjelang musim tanam.",
    submittedAt: "2026-07-05T14:22:00",
    status: "menunggu",
  },
  {
    id: "ASP-2026-0035",
    memberName: "Dewi Lestari",
    memberNik: "3301****2198",
    category: "keluhan",
    title: "Keterlambatan pencairan simpanan sukarela",
    description:
      "Pengajuan pencairan simpanan sukarela tanggal 28 Juni belum diproses hingga saat ini.",
    submittedAt: "2026-07-02T11:05:00",
    status: "disetujui",
    managementNote:
      "Pencairan telah diproses tanggal 3 Juli. Keterlambatan disebabkan verifikasi saldo akhir bulan.",
  },
  {
    id: "ASP-2026-0031",
    memberName: "Hendra Wijaya",
    memberNik: "3301****6644",
    category: "pertanyaan",
    title: "Rincian pembagian SHU tahun 2025",
    description:
      "Meminta rincian perhitungan SHU yang dibagikan pada Rapat Anggota Tahunan bulan Maret.",
    submittedAt: "2026-06-28T16:40:00",
    status: "disetujui",
    managementNote:
      "Dokumen rincian SHU telah diunggah ke portal anggota dan dibacakan ulang di pertemuan kelompok.",
  },
  {
    id: "ASP-2026-0027",
    memberName: "Rina Kusuma",
    memberNik: "3301****9012",
    category: "usulan",
    title: "Pembelian mesin penggiling padi",
    description:
      "Usulan investasi mesin penggiling untuk unit usaha tani guna meningkatkan layanan ke petani anggota.",
    submittedAt: "2026-06-20T08:30:00",
    status: "ditolak",
    managementNote:
      "Belum sesuai prioritas investasi tahun ini. Diusulkan masuk rencana kerja 2027.",
    decisionScore: 4,
    roiProjection: "36+ bulan",
    recommendation:
      "Proyeksi pengembalian modal terlalu panjang dengan beban operasional tinggi pada kondisi saat ini.",
  },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export const statusLabels: Record<AspirationStatus, string> = {
  menunggu: "Menunggu Review",
  dalam_review: "Sedang Ditinjau",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export const categoryLabels: Record<AspirationCategory, string> = {
  usulan: "Usulan",
  keluhan: "Keluhan",
  pertanyaan: "Pertanyaan",
};
