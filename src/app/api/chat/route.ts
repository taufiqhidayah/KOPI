import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { orchestrateChat } from "@/lib/copilot";

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();
    const command = body.command as string;
    const context = body.context as {
      user_id?: string;
      user_role?: string;
      pending_barang_masuk?: import("@/lib/copilot").PendingBarangMasukDraft;
      pending_tambah_produk?: import("@/lib/copilot").PendingTambahProdukDraft;
    } | undefined;

    if (!command?.trim()) {
      return NextResponse.json({ success: false, error: "Perintah tidak boleh kosong" }, { status: 400 });
    }

    const result = await orchestrateChat(command, {
      pending_barang_masuk: context?.pending_barang_masuk,
      pending_tambah_produk: context?.pending_tambah_produk,
    });

    await logAudit({
      userId: context?.user_id ?? "anonymous",
      actionType: "SELECT",
      tableName: result.intent,
      inputText: command,
      sqlGenerated: result.sql,
      status: result.success ? "success" : "failed",
      executionTimeMs: Date.now() - start,
      errorMessage: result.error,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await logAudit({
      userId: "anonymous",
      actionType: "SELECT",
      tableName: "chat",
      status: "failed",
      executionTimeMs: Date.now() - start,
      errorMessage: message,
    });

    return NextResponse.json({ success: false, error: message, in_scope: false }, { status: 500 });
  }
}
