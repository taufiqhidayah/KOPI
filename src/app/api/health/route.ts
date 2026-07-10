import { NextResponse } from "next/server";
import { checkDbConnection } from "@/lib/db";

export async function GET() {
  const dbConnected = await checkDbConnection().catch(() => false);

  return NextResponse.json({
    status: "ok",
    service: "kopdes-copilot",
    db: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
}
