export const GUARDRAILS = {
  chatAllowedOps: ["SELECT"] as const,

  crudAllowedTables: [
    "profil_koperasi",
    "anggota_koperasi",
    "pengurus_koperasi",
    "produk_koperasi",
    "inventaris_produk",
    "barang_masuk_produk",
    "barang_keluar_produk",
    "transaksi_penjualan",
    "simpanan_anggota",
    "pengajuan_rekening_bank",
    "pengajuan_pembiayaan",
    "dokumen_koperasi",
  ] as const,

  requiresConfirmation: {
    CREATE: ["anggota_koperasi", "simpanan_anggota", "pengajuan_rekening_bank", "barang_masuk_produk"],
    UPDATE: ["profil_koperasi", "inventaris_produk"],
    DELETE: ["anggota_koperasi", "produk_koperasi"],
  } as Record<string, string[]>,

  forbiddenKeywords: ["DROP", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "CREATE", "INSERT", "UPDATE", "DELETE"],
  maxRowsPerQuery: 1000,
} as const;

export type CrudOperation = "CREATE" | "UPDATE" | "DELETE" | "SELECT";

export function isTableAllowed(table: string): boolean {
  return (GUARDRAILS.crudAllowedTables as readonly string[]).includes(table);
}

export function needsConfirmation(table: string, operation: CrudOperation): boolean {
  const tables = GUARDRAILS.requiresConfirmation[operation];
  return tables?.includes(table) ?? false;
}

export function assessRisk(table: string, operation: CrudOperation): "LOW" | "MEDIUM" | "HIGH" {
  if (operation === "DELETE") return "HIGH";
  if (operation === "CREATE" && needsConfirmation(table, operation)) return "MEDIUM";
  if (operation === "UPDATE" && needsConfirmation(table, operation)) return "MEDIUM";
  return "LOW";
}
