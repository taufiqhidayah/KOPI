import { NextResponse } from "next/server";
import {
  generateDemoMemberChatReply,
  isDemoFallbackEnabled,
} from "@/lib/demo-chat";
import { parseGeminiApiError } from "@/lib/gemini-errors";
import {
  generateMemberChatReply,
  isGeminiConfigured,
} from "@/lib/gemini";
import type { MemberChatRequest } from "@/lib/ai-types";

function buildChatInput(body: MemberChatRequest) {
  return {
    message: body.message.trim(),
    history: body.history ?? [],
    memberName: body.memberName,
    memberId: body.memberId,
    cooperativeName: body.cooperativeName,
    cooperativeCode: body.cooperativeCode,
    village: body.village,
    pendingDraft: body.pendingDraft,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MemberChatRequest;

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong", code: "unknown" },
        { status: 400 },
      );
    }

    const input = buildChatInput(body);

    if (!isGeminiConfigured()) {
      return NextResponse.json(generateDemoMemberChatReply(input));
    }

    try {
      const result = await generateMemberChatReply(input);
      return NextResponse.json(result);
    } catch (error) {
      const parsed = parseGeminiApiError(error);

      if (isDemoFallbackEnabled()) {
        const demo = generateDemoMemberChatReply(input);
        return NextResponse.json({
          ...demo,
          reply: `${demo.reply}\n\n(Catatan: respons otomatis sementara karena kuota API Gemini habis.)`,
        });
      }

      const status = parsed.code === "rate_limited" ? 429 : 503;
      return NextResponse.json(
        {
          error: parsed.userMessage,
          code: parsed.code,
          retryAfterSeconds: parsed.retryAfterSeconds,
        },
        { status },
      );
    }
  } catch (error) {
    const parsed = parseGeminiApiError(error);
    return NextResponse.json(
      {
        error: parsed.userMessage,
        code: parsed.code,
        retryAfterSeconds: parsed.retryAfterSeconds,
      },
      { status: 500 },
    );
  }
}
