import { NextResponse } from "next/server";
import {
  generateDecisionAnalysis,
  isGeminiConfigured,
} from "@/lib/gemini";
import type { DecisionAnalysisRequest } from "@/lib/ai-types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DecisionAnalysisRequest;

    if (!body.aspirationTitle?.trim() || !body.aspirationDescription?.trim()) {
      return NextResponse.json(
        { error: "Data aspirasi tidak lengkap" },
        { status: 400 },
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY belum dikonfigurasi",
          demo: true,
          score: 6,
          roi: "24–30 bulan",
          rationale:
            "Mode demo tanpa API key. Tambahkan GEMINI_API_KEY untuk analisis nyata.",
          decision: "Perlu evaluasi lebih lanjut oleh pengurus.",
        },
        { status: 200 },
      );
    }

    const result = await generateDecisionAnalysis(body);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menganalisis aspirasi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
