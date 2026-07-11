import { ApiError, GoogleGenAI } from "@google/genai";

function uniqueModels(...candidates: (string | undefined)[]): string[] {
  return [...new Set(candidates.filter((m): m is string => Boolean(m?.trim())))];
}

const TEXT_MODELS = uniqueModels(
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
);

const VISION_MODELS = uniqueModels(
  process.env.GEMINI_VISION_MODEL,
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
);

let client: GoogleGenAI | null = null;
let quotaBlockedUntil = 0;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diisi di .env.local");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function stripCodeFence(raw: string): string {
  return raw.replace(/^```(?:json|sql)?\n?/i, "").replace(/```$/i, "").trim();
}

function extractJsonPayload(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = raw.indexOf("{");
  if (start < 0) return stripCodeFence(raw);

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }

  return stripCodeFence(raw);
}

function parseModelJson<T>(raw: string): T {
  const payload = extractJsonPayload(raw);
  return JSON.parse(payload) as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 404;
  const msg = errorMessage(error).toLowerCase();
  return msg.includes("404") || msg.includes("not found");
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 429;
  const msg = errorMessage(error).toLowerCase();
  return msg.includes("429") || msg.includes("quota");
}

function isQuotaBlocked(): boolean {
  return Date.now() < quotaBlockedUntil;
}

function markQuotaBlocked(): void {
  quotaBlockedUntil = Date.now() + 90_000;
}

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim()) && process.env.GEMINI_ENABLED !== "false" && !isQuotaBlocked();
}

async function generateWithFallback<T>(
  models: string[],
  run: (model: string) => Promise<T>,
): Promise<T | null> {
  if (!isGeminiAvailable()) return null;

  const notFoundModels: string[] = [];

  for (const model of models) {
    try {
      return await run(model);
    } catch (error) {
      if (isQuotaError(error)) {
        markQuotaBlocked();
        return null;
      }
      if (isNotFoundError(error)) {
        notFoundModels.push(model);
        continue;
      }
      break;
    }
  }

  if (notFoundModels.length === models.length) {
    throw new Error(
      `Model Gemini tidak tersedia (${notFoundModels.join(", ")}). Periksa GEMINI_API_KEY dan GEMINI_MODEL di .env.local, lalu restart dev server.`,
    );
  }

  return null;
}

export async function geminiText(
  system: string,
  user: string,
  temperature = 0,
): Promise<string | null> {
  return generateWithFallback(TEXT_MODELS, async (model) => {
    const response = await getClient().models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        temperature,
        maxOutputTokens: 512,
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini mengembalikan respons kosong");
    return text;
  });
}

export async function geminiJson<T>(system: string, user: string): Promise<T | null> {
  const raw = await geminiText(system, user, 0);
  if (!raw) return null;
  try {
    return parseModelJson<T>(raw);
  } catch {
    return null;
  }
}

export async function geminiVision(
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<string | null> {
  return generateWithFallback(VISION_MODELS, async (model) => {
    const response = await getClient().models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: imageBase64, mimeType } },
          ],
        },
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini vision mengembalikan respons kosong");
    return stripCodeFence(text);
  });
}

const NOTE_OCR_SCHEMA = {
  type: "object",
  properties: {
    tanggal: { type: "string" },
    supplier: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nama: { type: "string" },
          qty: { type: "number" },
          harga: { type: "number" },
        },
        required: ["nama", "qty", "harga"],
      },
    },
    total: { type: "number" },
  },
  required: ["tanggal", "supplier", "items", "total"],
} as const;

export async function geminiVisionJson<T>(
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<T | null> {
  return generateWithFallback(VISION_MODELS, async (model) => {
    const response = await getClient().models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: imageBase64, mimeType } },
          ],
        },
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseJsonSchema: NOTE_OCR_SCHEMA,
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini vision mengembalikan respons kosong");
    return parseModelJson<T>(text);
  });
}
