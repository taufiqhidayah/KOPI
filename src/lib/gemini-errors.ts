export type GeminiErrorCode =
  | "quota_exceeded"
  | "rate_limited"
  | "config_error"
  | "unknown";

export interface ParsedGeminiError {
  code: GeminiErrorCode;
  retryAfterSeconds?: number;
  userMessage: string;
  technicalMessage: string;
}

function parseRetryDelaySeconds(message: string): number | undefined {
  const retryMatch = message.match(/retry in ([\d.]+)s/i);
  if (retryMatch) {
    return Math.ceil(Number(retryMatch[1]));
  }

  const retryDelayMatch = message.match(/"retryDelay":"(\d+)s"/i);
  if (retryDelayMatch) {
    return Number(retryDelayMatch[1]);
  }

  return undefined;
}

export function parseGeminiApiError(error: unknown): ParsedGeminiError {
  const technicalMessage =
    error instanceof Error ? error.message : "Gagal menghubungi layanan AI";

  const lower = technicalMessage.toLowerCase();
  const retryAfterSeconds = parseRetryDelaySeconds(technicalMessage);

  if (
    lower.includes("quota exceeded") ||
    lower.includes("exceeded your current quota")
  ) {
    const isDaily =
      lower.includes("perday") ||
      lower.includes("per_day") ||
      lower.includes("freetier_requests");

    if (isDaily && !retryAfterSeconds) {
      return {
        code: "quota_exceeded",
        userMessage:
          "Kuota harian layanan AI untuk proyek ini sudah habis. Coba lagi besok, atau hubungi pengurus untuk mengaktifkan paket berbayar Gemini API.",
        technicalMessage,
      };
    }

    return {
      code: "rate_limited",
      retryAfterSeconds: retryAfterSeconds ?? 30,
      userMessage: retryAfterSeconds
        ? `Layanan AI sibuk. Silakan tunggu sekitar ${retryAfterSeconds} detik lalu kirim ulang pesan Anda.`
        : "Layanan AI sibuk. Silakan tunggu beberapa saat lalu coba lagi.",
      technicalMessage,
    };
  }

  if (lower.includes("429") || lower.includes("too many requests")) {
    return {
      code: "rate_limited",
      retryAfterSeconds: retryAfterSeconds ?? 30,
      userMessage: retryAfterSeconds
        ? `Terlalu banyak permintaan. Coba lagi dalam ${retryAfterSeconds} detik.`
        : "Terlalu banyak permintaan. Silakan coba lagi sebentar lagi.",
      technicalMessage,
    };
  }

  if (lower.includes("gemini_api_key") || lower.includes("api key")) {
    return {
      code: "config_error",
      userMessage: "Layanan AI belum dikonfigurasi dengan benar.",
      technicalMessage,
    };
  }

  return {
    code: "unknown",
    userMessage: "Maaf, asisten sementara tidak tersedia. Silakan coba lagi.",
    technicalMessage,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
