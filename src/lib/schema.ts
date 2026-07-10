import { query } from "./db";

export type SchemaColumn = {
  table_name: string;
  column_name: string;
  data_type: string;
};

let schemaCache: string | null = null;
let schemaCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const KEY_TABLES = [
  "profil_koperasi",
  "pengurus_koperasi",
  "produk_koperasi",
  "inventaris_produk",
  "barang_masuk_produk",
  "barang_keluar_produk",
  "transaksi_penjualan",
  "anggota_koperasi",
  "simpanan_anggota",
  "pengajuan_rekening_bank",
  "dokumen_koperasi",
];

export async function getSchemaDescription(): Promise<string> {
  const now = Date.now();
  if (schemaCache && now - schemaCacheTime < CACHE_TTL_MS) {
    return schemaCache;
  }

  const columns = await query<SchemaColumn>(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
    ORDER BY table_name, ordinal_position
  `, [KEY_TABLES]);

  const tables = new Map<string, string[]>();
  for (const col of columns) {
    const existing = tables.get(col.table_name) ?? [];
    existing.push(`${col.column_name} (${col.data_type})`);
    tables.set(col.table_name, existing);
  }

  const lines: string[] = [];
  for (const [table, cols] of tables) {
    lines.push(`TABLE ${table}: ${cols.join(", ")}`);
  }

  schemaCache = lines.join("\n");
  schemaCacheTime = now;
  return schemaCache;
}

export async function getTableColumns(tableName: string): Promise<SchemaColumn[]> {
  return query<SchemaColumn>(
    `
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
    `,
    [tableName],
  );
}
