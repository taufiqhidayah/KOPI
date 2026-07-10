import { GoogleGenerativeAI } from "@google/generative-ai";

const PRIMARY_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const MODEL_FALLBACKS = [PRIMARY_MODEL];
const VISION_FALLBACKS = [process.env.GEMINI_VISION_MODEL ?? PRIMARY_MODEL];

let client: GoogleGenerativeAI | null = null;
let quotaBlockedUntil = 0;

function getClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY belum diisi di .env.local");
  }
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

function stripCodeFence(raw: string): string {
  return raw.replace(/^```(?:json|sql)?\n?/i, "").replace(/```$/i, "").trim();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isNotFoundError(error: unknown): boolean {
  return errorMessage(error).includes("404");
}

function isQuotaError(error: unknown): boolean {
  const msg = errorMessage(error);
  return msg.includes("429") || msg.includes("quota") || msg.includes("Quota exceeded");
}

function isQuotaBlocked(): boolean {
  return Date.now() < quotaBlockedUntil;
}

function markQuotaBlocked(): void {
  quotaBlockedUntil = Date.now() + 90_000;
}

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && process.env.GEMINI_ENABLED !== "false" && !isQuotaBlocked();
}

async function generateWithFallback(
  models: string[],
  run: (model: string) => Promise<string>,
): Promise<string | null> {
  if (!isGeminiAvailable()) return null;

  let lastError: unknown;

  for (const model of [...new Set(models)]) {
    try {
      return await run(model);
    } catch (error) {
      lastError = error;
      if (isQuotaError(error)) {
        markQuotaBlocked();
        return null;
      }
      if (isNotFoundError(error)) {
        throw new Error(
          `Model "${model}" tidak tersedia. Set GEMINI_MODEL=gemini-2.5-flash di .env.local`,
        );
      }
      break;
    }
  }

  return null;
}

export async function geminiText(
  system: string,
  user: string,
  temperature = 0,
): Promise<string | null> {
  return generateWithFallback(MODEL_FALLBACKS, async (model) => {
    const genModel = getClient().getGenerativeModel({
      model,
      systemInstruction: system,
      generationConfig: { temperature, maxOutputTokens: 512 },
    });
    const result = await genModel.generateContent(user);
    return result.response.text().trim();
  });
}

export async function geminiJson<T>(system: string, user: string): Promise<T | null> {
  const raw = await geminiText(system, user, 0);
  if (!raw) return null;
  try {
    return JSON.parse(stripCodeFence(raw)) as T;
  } catch {
    return null;
  }
}

export async function geminiVision(
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<string | null> {
  return generateWithFallback(VISION_FALLBACKS, async (model) => {
    const genModel = getClient().getGenerativeModel({
      model,
      generationConfig: { temperature: 0, maxOutputTokens: 512 },
    });
    const result = await genModel.generateContent([
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType } },
    ]);
    return stripCodeFence(result.response.text());
  });
}
