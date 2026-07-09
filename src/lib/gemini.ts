import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
  type ObjectSchema,
} from "@google/generative-ai";
import type { AspirationCategory } from "@/lib/mock-data";
import type {
  AspirationDetail,
  ChatConversationStatus,
  DecisionAnalysisRequest,
  DecisionAnalysisResponse,
  MemberChatRequest,
  MemberChatResponse,
} from "@/lib/ai-types";
import { parseGeminiApiError, sleep } from "@/lib/gemini-errors";

const MEMBER_CHAT_SYSTEM = `Anda adalah asisten resmi SIMKOPDES untuk koperasi desa/kelurahan Merah Putih di Indonesia.

Anda memimpin percakapan multi-turn untuk mencatat aspirasi anggota. SELALU tinjau SELURUH riwayat percakapan, bukan hanya pesan terakhir.

## Alur
1. IDENTIFIKASI kategori: usulan | keluhan | pertanyaan | belum_jelas
2. KUMPULKAN (status: collecting) — ajukan SATU pertanyaan lanjutan spesifik tentang detail yang BELUM ada di riwayat chat
3. SELESAI (status: complete) — hanya jika informasi minimum terpenuhi (lihat checklist)

## Checklist sebelum status "complete"

### usulan — WAJIB kumpulkan minimal 4 detail ini (tanya bertahap jika belum ada):
- Jenis / nama usaha
- Lokasi
- Estimasi modal atau biaya
- Manfaat untuk warga/anggota desa
Opsional: target pelanggan, perkiraan omzet, tenaga kerja

JANGAN set complete hanya dari 1 pesan singkat. Minimal 2-3 giliran tanya jawab untuk usulan bisnis.

### keluhan — WAJIB minimal 3 detail:
- Masalah spesifik
- Kapan terjadi / sejak kapan
- Dampak bagi anggota

### pertanyaan — boleh complete setelah pertanyaan terjawab jelas

## Field output

### reply
- collecting: 1-2 kalimat + 1 pertanyaan lanjutan yang jelas
- complete: 3-5 kalimat. Ucapkan terima kasih, sebut kategori, ULANGI detail penting yang sudah dikumpulkan (lokasi, modal, dll). Akhiri dengan meminta anggota memeriksa ringkasan dan memastikan data sudah benar. JANGAN bilang aspirasi sudah dicatat ke pengurus — itu terjadi setelah anggota konfirmasi.

### title (hanya saat complete)
Judul aspirasi singkat max 12 kata.

### summary (hanya saat complete)
Paragraf lengkap 4-6 kalimat yang menggabungkan SEMUA informasi dari setiap pesan anggota dalam riwayat chat.

### details (hanya saat complete)
Array label-value untuk SETIAP aspek yang terkumpul dari percakapan, contoh:
- { label: "Jenis Usaha", value: "Toko sembako dan alat tulis sekolah" }
- { label: "Lokasi", value: "Balai desa, dekat pasar minggu" }
- { label: "Estimasi Modal", value: "Rp 25.000.000" }
Minimal 3 item saat complete. Gunakan label Bahasa Indonesia.

### followUps
- collecting: 2-3 jawaban singkat yang LANGSUNG menjawab pertanyaan Anda di reply (bukan topik umum)
- complete: array kosong []

## Revisi sebelum konfirmasi
Jika ada "Draft aspirasi sebelumnya" di pesan, anggota sedang memperbaiki data.
- Terapkan koreksi ke summary dan details
- Kembalikan status "complete" dengan data yang diperbarui
- Di reply, sebut perubahan yang dilakukan dan minta anggota periksa kembali

## Gaya
Bahasa Indonesia sopan, sederhana, persona Bu Sari. Jangan sebut diri Anda sebagai AI.`;

const DECISION_SYSTEM = `Anda adalah konsultan bisnis profesional untuk koperasi desa di Indonesia.
Analisis aspirasi anggota berdasarkan data keuangan koperasi yang diberikan.
Berikan skor kelayakan 1-10, proyeksi balik modal, ringkasan rationale, dan rekomendasi keputusan singkat dalam Bahasa Indonesia.`;

function getConfiguredModels(): string[] {
  const primary = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const fallbacks = (process.env.GEMINI_MODEL_FALLBACK ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return [...new Set([primary, ...fallbacks])];
}

function createModel(
  modelName: string,
  systemInstruction: string,
  jsonSchema: ObjectSchema,
): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak dikonfigurasi");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: jsonSchema,
    },
  });
}

async function withGeminiRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const parsed = parseGeminiApiError(error);

      if (
        parsed.code === "rate_limited" &&
        parsed.retryAfterSeconds &&
        attempt < maxAttempts - 1
      ) {
        await sleep(Math.min(parsed.retryAfterSeconds * 1000, 30_000));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function withModelFallback<T>(
  schema: ObjectSchema,
  systemInstruction: string,
  operation: (model: GenerativeModel, modelName: string) => Promise<T>,
): Promise<T> {
  const models = getConfiguredModels();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const model = createModel(modelName, systemInstruction, schema);
      return await withGeminiRetry(() => operation(model, modelName));
    } catch (error) {
      lastError = error;
      const parsed = parseGeminiApiError(error);
      if (parsed.code === "quota_exceeded" && models.indexOf(modelName) < models.length - 1) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

const memberChatSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    status: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["collecting", "complete"],
    },
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["usulan", "keluhan", "pertanyaan", "belum_jelas"],
    },
    reply: { type: SchemaType.STRING },
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    details: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          value: { type: SchemaType.STRING },
        },
        required: ["label", "value"],
      },
    },
    followUps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["status", "category", "reply", "details", "followUps"],
};

const decisionSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.NUMBER },
    roi: { type: SchemaType.STRING },
    rationale: { type: SchemaType.STRING },
    decision: { type: SchemaType.STRING },
  },
  required: ["score", "roi", "rationale", "decision"],
};

function isValidCategory(
  value: string,
): value is AspirationCategory | "belum_jelas" {
  return (
    value === "usulan" ||
    value === "keluhan" ||
    value === "pertanyaan" ||
    value === "belum_jelas"
  );
}

function isValidStatus(value: string): value is ChatConversationStatus {
  return value === "collecting" || value === "complete";
}

function normalizeDetails(details: unknown): AspirationDetail[] {
  if (!Array.isArray(details)) return [];
  return details
    .filter(
      (d): d is AspirationDetail =>
        typeof d === "object" &&
        d !== null &&
        typeof (d as AspirationDetail).label === "string" &&
        typeof (d as AspirationDetail).value === "string",
    )
    .map((d) => ({ label: d.label.trim(), value: d.value.trim() }))
    .filter((d) => d.label && d.value);
}

export async function generateMemberChatReply(
  input: MemberChatRequest,
): Promise<MemberChatResponse> {
  return withModelFallback(memberChatSchema, MEMBER_CHAT_SYSTEM, async (model) => {
  const userTurnCount = input.history.filter((h) => h.role === "user").length + 1;

  const contextBlock = `
Konteks koperasi:
- Nama: ${input.cooperativeName}
- Kode: ${input.cooperativeCode}
- Desa: ${input.village}
- Anggota: ${input.memberName} (${input.memberId})
- Giliran pesan anggota ke-${userTurnCount} dalam percakapan ini
`;

  const chat = model.startChat({
    history: input.history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    })),
  });

  const draftBlock = input.pendingDraft
    ? `
Draft aspirasi sebelumnya (anggota mungkin ingin memperbaiki):
- Kategori: ${input.pendingDraft.category}
- Judul: ${input.pendingDraft.title ?? "-"}
- Ringkasan: ${input.pendingDraft.summary ?? "-"}
- Detail: ${JSON.stringify(input.pendingDraft.details)}
`
    : "";

  const result = await chat.sendMessage(
    `${contextBlock}${draftBlock}
Pesan baru anggota:
${input.message}

Ingat: gabungkan SEMUA jawaban anggota dari riwayat chat ke summary dan details saat complete. Jangan complete usulan bisnis jika belum ada minimal lokasi, modal, dan manfaat.`,
  );

  const parsed = JSON.parse(result.response.text()) as MemberChatResponse;

  if (
    !isValidStatus(parsed.status) ||
    !isValidCategory(parsed.category) ||
    !parsed.reply?.trim()
  ) {
    throw new Error("Format respons Gemini tidak valid");
  }

  return {
    status: parsed.status,
    category: parsed.category,
    reply: parsed.reply.trim(),
    title: parsed.title?.trim() || undefined,
    summary: parsed.summary?.trim() || undefined,
    details: normalizeDetails(parsed.details),
    followUps: Array.isArray(parsed.followUps)
      ? parsed.followUps.filter((f) => f?.trim()).slice(0, 3)
      : [],
  };
  });
}

export async function generateDecisionAnalysis(
  input: DecisionAnalysisRequest,
): Promise<DecisionAnalysisResponse> {
  return withModelFallback(decisionSchema, DECISION_SYSTEM, async (model) => {
  const prompt = `
Aspirasi:
- Kategori: ${input.category}
- Anggota: ${input.memberName}
- Judul: ${input.aspirationTitle}
- Uraian: ${input.aspirationDescription}

Data keuangan koperasi (IDR):
- Omzet tahun berjalan: ${input.omzet}
- SHU: ${input.shu}
- Kas: ${input.kas}
`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text()) as DecisionAnalysisResponse;

  if (
    typeof parsed.score !== "number" ||
    !parsed.roi ||
    !parsed.rationale ||
    !parsed.decision
  ) {
    throw new Error("Format analisis Gemini tidak valid");
  }

  return parsed;
  });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
