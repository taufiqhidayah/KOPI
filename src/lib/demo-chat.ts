import type { AspirationCategory } from "@/lib/mock-data";
import type {
  AspirationDetail,
  MemberChatRequest,
  MemberChatResponse,
} from "@/lib/ai-types";
import { inferAspirationCategory } from "@/lib/chat-suggestions";
import { categoryLabels } from "@/lib/mock-data";

function getUserTexts(history: MemberChatRequest["history"], message: string): string[] {
  return [
    ...history.filter((h) => h.role === "user").map((h) => h.content),
    message,
  ];
}

function historyText(history: MemberChatRequest["history"], message: string): string {
  return getUserTexts(history, message).join(" ").toLowerCase();
}

function hasLocation(text: string): boolean {
  return /balai desa|pasar|pinggir jalan|rumah warga|lahan|dekat|di desa|kios|toko|warung|kantor|masjid|sekolah/.test(
    text,
  );
}

function hasModal(text: string): boolean {
  return /rp\s*[\d.,]+|juta|modal|biaya|anggaran|\d+\s*(jt|juta|ribu)/i.test(text);
}

function hasManfaat(text: string): boolean {
  return /manfaat|memudahkan|warga|anggota|tenaga kerja|pelanggan|omzet|kebutuhan/.test(
    text,
  );
}

function hasJenisUsaha(text: string): boolean {
  return /toko|gerai|warung|usaha|sembako|pupuk|kios|unit|bisnis|jual|dagang/.test(
    text,
  );
}

function extractLocation(texts: string[]): string {
  const last = texts.find((t) =>
    /balai|pasar|rumah|lahan|dekat|jalan|desa|kios|warung/i.test(t),
  );
  return last?.trim() || texts[texts.length - 1]?.trim() || "Lokasi belum disebutkan";
}

function extractModal(text: string): string {
  const match = text.match(/rp\s*[\d.,]+|\d+\s*(jt|juta|ribu)/i);
  if (match) return match[0];
  return "Belum disebutkan";
}

function buildUsulanReply(
  input: MemberChatRequest,
  texts: string[],
  combined: string,
): MemberChatResponse {
  const firstName = input.memberName.split(" ")[0];
  const category: AspirationCategory = "usulan";

  if (!hasJenisUsaha(combined) && texts.length <= 1) {
    return {
      status: "collecting",
      category,
      reply: `Terima kasih, ${firstName}. Bisa dijelaskan jenis usaha yang ingin diusulkan?`,
      details: [],
      followUps: [
        "Toko sembako dan alat tulis",
        "Warung kebutuhan sehari-hari",
        "Gerai pupuk dan bibit",
      ],
      demo: true,
    };
  }

  if (!hasLocation(combined)) {
    return {
      status: "collecting",
      category,
      reply: `Baik, ${firstName}. Di lokasi mana rencananya dibuka?`,
      details: [],
      followUps: [
        "Di balai desa",
        "Di rumah warga yang punya lahan kosong",
        "Dekat pasar desa",
      ],
      demo: true,
    };
  }

  if (!hasModal(combined)) {
    return {
      status: "collecting",
      category,
      reply: `Lokasinya sudah jelas. Berapa perkiraan modal atau biaya awal yang dibutuhkan?`,
      details: [],
      followUps: [
        "Sekitar Rp 15 juta",
        "Sekitar Rp 25 juta",
        "Sekitar Rp 40 juta",
      ],
      demo: true,
    };
  }

  if (!hasManfaat(combined)) {
    return {
      status: "collecting",
      category,
      reply: `Terima kasih. Apa manfaat utama usaha ini bagi warga dan anggota koperasi?`,
      details: [],
      followUps: [
        "Memudahkan warga berbelanja tanpa ke kota",
        "Menyerap tenaga kerja warga desa",
        "Menambah omzet dan layanan koperasi",
      ],
      demo: true,
    };
  }

  const details: AspirationDetail[] = [
    {
      label: "Jenis Usaha",
      value: hasJenisUsaha(texts[0] ?? "")
        ? texts[0].trim()
        : "Unit usaha kebutuhan anggota desa",
    },
    { label: "Lokasi", value: extractLocation(texts) },
    { label: "Estimasi Modal", value: extractModal(combined) },
    {
      label: "Manfaat",
      value:
        texts.find((t) => hasManfaat(t.toLowerCase()))?.trim() ||
        "Meningkatkan layanan dan kesejahteraan anggota desa",
    },
  ];

  return {
    status: "complete",
    category,
    title: "Usulan unit usaha baru anggota desa",
    reply: `Terima kasih, ${firstName}. Ringkasan usulan Anda sudah lengkap sebagai ${categoryLabels[category]}. Mohon periksa detail di bawah — jika sudah benar, konfirmasi agar diteruskan ke pengurus.`,
    summary: `Anggota mengusulkan pembukaan unit usaha baru. ${details.map((d) => `${d.label}: ${d.value}`).join(". ")}.`,
    details,
    followUps: [],
    demo: true,
  };
}

function buildPertanyaanReply(
  input: MemberChatRequest,
  message: string,
): MemberChatResponse {
  const firstName = input.memberName.split(" ")[0];
  const category: AspirationCategory = "pertanyaan";
  const lower = message.toLowerCase();

  let answer =
    "Informasi tersebut dapat ditanyakan langsung ke pengurus koperasi melalui rapat anggota atau layanan kantor desa.";

  if (lower.includes("shu")) {
    answer =
      "SHU dibagikan berdasarkan partisipasi simpanan dan transaksi anggota sesuai AD/ART koperasi, biasanya diumumkan setelah RAT tahunan.";
  } else if (lower.includes("rapat") || lower.includes("rat")) {
    answer =
      "Rapat Anggota Tahunan (RAT) biasanya diadakan setahun sekali. Jadwal resmi diumumkan pengurus melalui pengumuman desa dan aplikasi SIMKOPDES.";
  } else if (lower.includes("laporan") || lower.includes("omzet")) {
    answer =
      "Ringkasan omzet, kas, dan laporan keuangan dapat dilihat di tab transparansi aplikasi setelah dipublikasikan pengurus.";
  }

  const details: AspirationDetail[] = [
    { label: "Jenis Aspirasi", value: "Pertanyaan" },
    { label: "Pertanyaan Anggota", value: message.trim() },
    { label: "Ringkasan Jawaban", value: answer },
  ];

  return {
    status: "complete",
    category,
    title: "Pertanyaan seputar koperasi desa",
    reply: `Terima kasih, ${firstName}. Berikut ringkasan pertanyaan dan jawaban sementara. Mohon periksa apakah sudah sesuai sebelum dicatat.`,
    summary: `${message.trim()} Jawaban: ${answer}`,
    details,
    followUps: [],
    demo: true,
  };
}

function buildKeluhanReply(
  input: MemberChatRequest,
  texts: string[],
  combined: string,
): MemberChatResponse {
  const firstName = input.memberName.split(" ")[0];
  const category: AspirationCategory = "keluhan";

  if (texts.length < 2 || combined.length < 40) {
    return {
      status: "collecting",
      category,
      reply: `Maaf atas kendalanya, ${firstName}. Bisa dijelaskan kapan masalah ini mulai terjadi dan bagaimana dampaknya bagi Anda?`,
      details: [],
      followUps: [
        "Sudah lebih dari 2 minggu",
        "Bulan lalu sampai sekarang",
        "Sulit mengakses layanan simpanan",
      ],
      demo: true,
    };
  }

  const details: AspirationDetail[] = [
    { label: "Masalah", value: texts[0]?.trim() || "Keluhan layanan koperasi" },
    {
      label: "Kronologi",
      value: texts.slice(1).join(" ").trim() || "Belum dijelaskan",
    },
    {
      label: "Dampak",
      value: "Menghambat kebutuhan layanan anggota",
    },
  ];

  return {
    status: "complete",
    category,
    title: "Keluhan layanan koperasi desa",
    reply: `Terima kasih, ${firstName}. Keluhan Anda sudah dirangkum. Mohon periksa detail berikut sebelum dikirim ke pengurus.`,
    summary: details.map((d) => `${d.label}: ${d.value}`).join(". "),
    details,
    followUps: [],
    demo: true,
  };
}

export function generateDemoMemberChatReply(
  input: MemberChatRequest,
): MemberChatResponse {
  const message = input.message.trim();
  const texts = getUserTexts(input.history ?? [], message);
  const combined = historyText(input.history ?? [], message);
  const category = inferAspirationCategory(combined);

  if (input.pendingDraft) {
    const draft = input.pendingDraft;
    const lower = message.toLowerCase();
    const updatedDetails = draft.details.map((item) => {
      if (/lokasi|tempat|di /.test(lower) && item.label.toLowerCase().includes("lokasi")) {
        return { ...item, value: message.trim() };
      }
      if (/rp|juta|modal|biaya/.test(lower) && item.label.toLowerCase().includes("modal")) {
        return { ...item, value: message.trim() };
      }
      return item;
    });

    return {
      status: "complete",
      category: draft.category,
      title: draft.title ?? "Aspirasi anggota (diperbarui)",
      reply: `Baik, perubahan sudah diterapkan. Mohon periksa kembali ringkasan aspirasi Anda.`,
      summary: draft.summary ?? message,
      details: updatedDetails.length ? updatedDetails : draft.details,
      followUps: [],
      demo: true,
    };
  }

  if (category === "usulan") {
    return buildUsulanReply(input, texts, combined);
  }

  if (category === "keluhan") {
    return buildKeluhanReply(input, texts, combined);
  }

  return buildPertanyaanReply(input, message);
}

export function isDemoFallbackEnabled(): boolean {
  return process.env.GEMINI_FALLBACK_DEMO !== "false";
}
