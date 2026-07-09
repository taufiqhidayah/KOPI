import type { AspirationCategory } from "@/lib/mock-data";

export interface ChatSuggestion {
  id: string;
  label: string;
  message: string;
  /** Hint for mock/AI classification — not shown in UI */
  category: AspirationCategory;
  tags: string[];
}

const allSuggestions: ChatSuggestion[] = [
  {
    id: "usul-gerai-sembako",
    label: "Usul gerai sembako desa",
    message:
      "Saya mengusulkan pembukaan gerai sembako di balai desa agar anggota tidak perlu ke pasar kota. Perkiraan modal awal Rp 25 juta.",
    category: "usulan",
    tags: ["unit-usaha", "ritel", "investasi"],
  },
  {
    id: "usul-agen-pupuk",
    label: "Usul agen pupuk subsidi",
    message:
      "Mengajukan kerjasama dengan distributor pupuk untuk menjadi agen resmi di desa menjelang musim tanam.",
    category: "usulan",
    tags: ["pertanian", "kerjasama", "musim-tanam"],
  },
  {
    id: "keluhan-pencairan",
    label: "Keterlambatan pencairan",
    message:
      "Pengajuan pencairan simpanan sukarela saya belum diproses. Mohon bantu cek status dan estimasi waktu pencairan.",
    category: "keluhan",
    tags: ["simpanan", "pencairan", "layanan"],
  },
  {
    id: "tanya-shu",
    label: "Cara hitung SHU",
    message:
      "Bagaimana perhitungan pembagian SHU tahun ini dan kapan biasanya dibagikan ke anggota?",
    category: "pertanyaan",
    tags: ["shu", "keuangan", "edukasi"],
  },
  {
    id: "tanya-laporan",
    label: "Akses laporan keuangan",
    message:
      "Di mana saya bisa melihat ringkasan omzet, kas, dan laporan keuangan koperasi secara transparan?",
    category: "pertanyaan",
    tags: ["laporan", "transparansi", "omzet"],
  },
  {
    id: "usul-kelayakan",
    label: "Cek kelayakan usaha baru",
    message:
      "Bagaimana cara menilai apakah usulan unit usaha baru layak dijalankan berdasarkan kondisi keuangan koperasi saat ini?",
    category: "usulan",
    tags: ["analisis", "kelayakan", "keuangan"],
  },
];

const followUpSuggestions: ChatSuggestion[] = [
  {
    id: "followup-detail",
    label: "Tambah detail usulan",
    message:
      "Saya ingin menambahkan detail estimasi biaya operasional dan target anggota yang akan dilayani.",
    category: "usulan",
    tags: ["follow-up", "detail"],
  },
  {
    id: "followup-dampak",
    label: "Jelaskan manfaat desa",
    message:
      "Usulan ini diharapkan meningkatkan akses sembako murah dan menyerap tenaga kerja warga desa setempat.",
    category: "usulan",
    tags: ["follow-up", "dampak-sosial"],
  },
  {
    id: "followup-riwayat",
    label: "Lihat riwayat aspirasi",
    message:
      "Bagaimana cara melihat riwayat aspirasi dan keputusan pengurus yang sudah dipublikasikan?",
    category: "pertanyaan",
    tags: ["follow-up", "riwayat", "transparansi"],
  },
  {
    id: "keluhan-transparansi",
    label: "Informasi tidak jelas",
    message:
      "Saya kesulitan memahami status pengajuan saya. Mohon diperjelas lewat linimasa transparansi di aplikasi.",
    category: "keluhan",
    tags: ["transparansi", "status", "komunikasi"],
  },
];

/** Mock classifier — replace with OpenAI category detection later */
export function inferAspirationCategory(text: string): AspirationCategory {
  const lower = text.toLowerCase();

  const keluhanKeywords = [
    "keluhan",
    "komplain",
    "lambat",
    "belum diproses",
    "keterlambatan",
    "kesulitan",
    "tidak jelas",
    "mohon bantu",
    "belum",
  ];
  if (keluhanKeywords.some((k) => lower.includes(k))) return "keluhan";

  const pertanyaanKeywords = [
    "bagaimana",
    "berapa",
    "kapan",
    "di mana",
    "apa perbedaan",
    "cara ",
    "?",
    "jelaskan",
    "tanya",
  ];
  if (pertanyaanKeywords.some((k) => lower.includes(k))) return "pertanyaan";

  const usulanKeywords = [
    "usul",
    "usulan",
    "mengajukan",
    "mengusulkan",
    "investasi",
    "buka",
    "pembukaan",
    "kerjasama",
    "unit usaha",
    "modal",
  ];
  if (usulanKeywords.some((k) => lower.includes(k))) return "usulan";

  return "pertanyaan";
}

export function getStarterSuggestions(): ChatSuggestion[] {
  return allSuggestions.slice(0, 5);
}

export function getFollowUpSuggestions(
  usedIds: string[],
  lastCategory?: AspirationCategory,
): ChatSuggestion[] {
  const related = lastCategory
    ? followUpSuggestions.filter((s) => s.category === lastCategory)
    : followUpSuggestions;

  const pool = [...related, ...allSuggestions];
  return pool.filter((s) => !usedIds.includes(s.id)).slice(0, 3);
}

export interface ChatContextPayload {
  category: AspirationCategory;
  memberId: string;
  cooperativeCode: string;
  suggestionTags?: string[];
  recentMessages: Array<{ role: "user" | "assistant"; content: string }>;
}

export function buildChatContextPayload(
  category: AspirationCategory,
  messages: Array<{ role: "system" | "user"; text: string }>,
  memberId: string,
  cooperativeCode: string,
  suggestionTags?: string[],
): ChatContextPayload {
  return {
    category,
    memberId,
    cooperativeCode,
    suggestionTags,
    recentMessages: messages
      .filter((m) => m.role === "user")
      .slice(-6)
      .map((m) => ({ role: "user" as const, content: m.text })),
  };
}
