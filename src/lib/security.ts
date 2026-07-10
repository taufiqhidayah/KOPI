import { GUARDRAILS } from "./guardrails";

const FORBIDDEN_KEYWORDS = [
  "DROP",
  "DELETE",
  "UPDATE",
  "INSERT",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
];

export function validateChatSql(sql: string, koperasiRef: string): { valid: boolean; reason?: string } {
  const upper = sql.toUpperCase().trim();

  if (!upper.startsWith("SELECT")) {
    return { valid: false, reason: "Chat hanya boleh menjalankan query SELECT" };
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (new RegExp(`\\b${keyword}\\b`).test(upper)) {
      return { valid: false, reason: `Keyword terlarang: ${keyword}` };
    }
  }

  if (!sql.includes(koperasiRef)) {
    return { valid: false, reason: "Query harus memfilter koperasi_ref" };
  }

  if (upper.includes("SELECT *") && !upper.includes("LIMIT")) {
    return { valid: false, reason: "Query harus menyertakan LIMIT" };
  }

  return { valid: true };
}

export function enforceRowLimit(sql: string): string {
  const upper = sql.toUpperCase();
  if (!upper.includes("LIMIT")) {
    return `${sql.trim().replace(/;$/, "")} LIMIT ${GUARDRAILS.maxRowsPerQuery}`;
  }
  return sql;
}

export function generateRef(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}
