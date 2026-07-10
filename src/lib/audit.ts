import type { CrudOperation } from "./guardrails";

export type AuditEntry = {
  userId: string;
  actionType: CrudOperation;
  tableName: string;
  recordRef?: string;
  inputText?: string;
  sqlGenerated?: string;
  status: "success" | "failed";
  executionTimeMs: number;
  errorMessage?: string;
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  const payload = {
    severity: entry.status === "success" ? "INFO" : "ERROR",
    component: "kopdes-copilot",
    timestamp: new Date().toISOString(),
    ...entry,
  };

  if (entry.status === "failed") {
    process.stderr.write(`${JSON.stringify(payload)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }
}
