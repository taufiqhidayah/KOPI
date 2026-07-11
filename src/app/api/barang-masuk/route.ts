import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { logAudit } from "@/lib/audit";
import { getKoperasiRef, query, withTransaction } from "@/lib/db";
import { generateRef } from "@/lib/security";
import { saveBarangMasukDokumentasi, canWriteUploadsToDisk } from "@/lib/uploads";
import { buildKeteranganWithDokumentasi, DOKUMENTASI_MAX_BYTES, DOKUMENTASI_MIME, listBarangMasuk } from "@/lib/barang-masuk";
import { normalizeUnit, sanitizeProdukName } from "@/lib/tambah-produk-guide";
import {
  encodeProdukMetaKeterangan,
  parseProdukMetaFromText,
  resolveProdukMeta,
} from "@/lib/produk-meta";
import { resolveUnmatchedNotaItems, type NotaUnmatchedDraft } from "@/lib/nota-save";
import { isNotaUnmatchedComplete } from "@/lib/nota-queue";

type BarangMasukItem = {
  produk_sample_id: string;
  jumlah_masuk: number;
  harga_beli: number;
  nama_produk?: string;
  nama_tampilan?: string;
  harga_jual?: number;
  keterangan?: string;
  unit?: string;
};

type BarangMasukPayload = {
  koperasi_ref?: string;
  tanggal_masuk?: string;
  keterangan?: string;
  items: BarangMasukItem[];
  unmatched_items?: NotaUnmatchedDraft[];
  confirmed_by?: string;
  dokumentasi_nama?: string;
  dokumentasi_url?: string;
};

function validateDokumentasi(file: File): string | null {
  if (!DOKUMENTASI_MIME.has(file.type)) {
    return "Format dokumentasi harus JPG, PNG, atau PDF.";
  }
  if (file.size > DOKUMENTASI_MAX_BYTES) {
    return "Ukuran dokumentasi maksimal 10MB.";
  }
  return null;
}

async function parseRequest(req: NextRequest): Promise<{
  payload: BarangMasukPayload;
  dokumentasiFile?: File;
  error?: string;
}> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const itemsRaw = form.get("items");
    if (typeof itemsRaw !== "string") {
      return { payload: { items: [] }, error: "Items tidak valid" };
    }

    let items: BarangMasukItem[];
    try {
      items = JSON.parse(itemsRaw) as BarangMasukItem[];
    } catch {
      return { payload: { items: [] }, error: "Format items tidak valid" };
    }

    const dokumentasi = form.get("dokumentasi");
    let dokumentasiFile: File | undefined;
    if (dokumentasi instanceof File && dokumentasi.size > 0) {
      const err = validateDokumentasi(dokumentasi);
      if (err) return { payload: { items: [] }, error: err };
      dokumentasiFile = dokumentasi;
    }

    let unmatchedItems: NotaUnmatchedDraft[] | undefined;
    const unmatchedRaw = form.get("unmatched_items");
    if (typeof unmatchedRaw === "string" && unmatchedRaw.trim()) {
      try {
        unmatchedItems = JSON.parse(unmatchedRaw) as NotaUnmatchedDraft[];
      } catch {
        return { payload: { items: [] }, error: "Format unmatched_items tidak valid" };
      }
    }

    return {
      payload: {
        koperasi_ref: (form.get("koperasi_ref") as string) || undefined,
        tanggal_masuk: (form.get("tanggal_masuk") as string) || undefined,
        keterangan: (form.get("keterangan") as string) ?? "",
        confirmed_by: (form.get("confirmed_by") as string) ?? "bendahara",
        items,
        unmatched_items: unmatchedItems,
        dokumentasi_nama: (form.get("dokumentasi_nama") as string) || undefined,
      },
      dokumentasiFile,
    };
  }

  const body = (await req.json()) as BarangMasukPayload;
  return {
    payload: {
      koperasi_ref: body.koperasi_ref,
      tanggal_masuk: body.tanggal_masuk,
      keterangan: body.keterangan ?? "",
      confirmed_by: body.confirmed_by ?? "bendahara",
      items: body.items ?? [],
      unmatched_items: body.unmatched_items,
      dokumentasi_nama: body.dokumentasi_nama,
      dokumentasi_url: body.dokumentasi_url,
    },
  };
}

async function insertBarangMasuk(
  client: PoolClient,
  params: {
    koperasiRef: string;
    tanggalMasuk: string;
    transactionKeterangan: string;
    dokumentasi?: { url?: string; nama?: string };
    items: BarangMasukItem[];
  },
) {
  const created: { barang_masuk_ref: string; produk_sample_id: string }[] = [];

  for (const item of params.items) {
    const barangMasukRef = generateRef("BM");
    const totalBiaya = item.jumlah_masuk * item.harga_beli;

    const product = await client.query<{ nama_produk: string | null }>(
      `SELECT nama_produk FROM produk_koperasi WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
      [item.produk_sample_id, params.koperasiRef],
    );

    const namaProduk = item.nama_produk ?? product.rows[0]?.nama_produk ?? "Produk";
    const namaTampilan = item.nama_tampilan?.trim() || namaProduk;
    const parsedMeta = parseProdukMetaFromText(item.keterangan?.trim() || params.transactionKeterangan);
    const meta = resolveProdukMeta(namaProduk, item.unit, parsedMeta);
    const userNotes = item.keterangan?.trim() || params.transactionKeterangan;
    const itemKeterangan = buildKeteranganWithDokumentasi(
      encodeProdukMetaKeterangan(meta, userNotes.replace(/@@PRODUK_META@@[^|]+/g, "").trim()),
      params.dokumentasi,
    );

    if (/^tambah\s+produk/i.test(namaProduk)) {
      const fixedName = sanitizeProdukName(namaTampilan !== namaProduk ? namaTampilan : namaProduk);
      await client.query(
        `UPDATE produk_koperasi SET nama_produk = $1, diperbarui_pada = NOW()
         WHERE produk_sample_id = $2 AND koperasi_ref = $3`,
        [fixedName, item.produk_sample_id, params.koperasiRef],
      );
    }

    if (item.unit?.trim()) {
      const unit = normalizeUnit(item.unit);
      await client.query(
        `UPDATE produk_koperasi SET unit = $1, diperbarui_pada = NOW()
         WHERE produk_sample_id = $2 AND koperasi_ref = $3`,
        [unit, item.produk_sample_id, params.koperasiRef],
      );
    }

    await client.query(
      `INSERT INTO barang_masuk_produk
        (barang_masuk_ref, produk_sample_id, koperasi_ref, nama_produk, nama_tampilan, jumlah_masuk,
         jumlah_tersedia, harga_beli, harga_jual, total_biaya, keterangan, status, tanggal_masuk, dibuat_pada)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, 'aktif', $11, NOW())`,
      [
        barangMasukRef,
        item.produk_sample_id,
        params.koperasiRef,
        namaProduk,
        namaTampilan,
        item.jumlah_masuk,
        item.harga_beli,
        item.harga_jual && item.harga_jual > 0 ? item.harga_jual : null,
        totalBiaya,
        itemKeterangan,
        params.tanggalMasuk,
      ],
    );

    const inventaris = await client.query<{ inventaris_ref: string; stok: string | null }>(
      `SELECT inventaris_ref, stok FROM inventaris_produk
       WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
      [item.produk_sample_id, params.koperasiRef],
    );

    if (inventaris.rows[0]) {
      const currentStok = Number(inventaris.rows[0].stok ?? 0);
      await client.query(
        `UPDATE inventaris_produk SET stok = $1, diperbarui_pada = NOW()
         WHERE inventaris_ref = $2`,
        [currentStok + item.jumlah_masuk, inventaris.rows[0].inventaris_ref],
      );
    } else {
      const inventarisRef = generateRef("INV");
      await client.query(
        `INSERT INTO inventaris_produk
          (inventaris_ref, produk_sample_id, koperasi_ref, nama_produk, stok, dibuat_pada)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [inventarisRef, item.produk_sample_id, params.koperasiRef, namaProduk, item.jumlah_masuk],
      );
    }

    created.push({ barang_masuk_ref: barangMasukRef, produk_sample_id: item.produk_sample_id });
  }

  return created;
}

export async function GET(req: NextRequest) {
  const start = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 10;

    const result = await listBarangMasuk({ search, page, pageSize });

    await logAudit({
      userId: "bendahara",
      actionType: "SELECT",
      tableName: "barang_masuk_produk",
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await logAudit({
      userId: "bendahara",
      actionType: "SELECT",
      tableName: "barang_masuk_produk",
      status: "failed",
      executionTimeMs: Date.now() - start,
      errorMessage: message,
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const { payload, dokumentasiFile, error: parseError } = await parseRequest(req);
    if (parseError) {
      return NextResponse.json({ success: false, error: parseError }, { status: 400 });
    }

    const koperasiRef = payload.koperasi_ref || getKoperasiRef();
    const tanggalMasuk = payload.tanggal_masuk ?? new Date().toISOString();
    const keterangan = payload.keterangan ?? "";
    const confirmedBy = payload.confirmed_by ?? "bendahara";

    if (payload.unmatched_items?.length) {
      const incomplete = payload.unmatched_items.find((item) => !isNotaUnmatchedComplete(item));
      if (incomplete) {
        return NextResponse.json(
          { success: false, error: `Data produk "${incomplete.nama}" belum lengkap. Lengkapi satuan, kategori, jenis, potensi, dan penyedia.` },
          { status: 400 },
        );
      }
    }

    let items = [...(payload.items ?? [])];
    let productsCreated: string[] = [];

    if (payload.unmatched_items?.length) {
      const resolved = await resolveUnmatchedNotaItems(payload.unmatched_items, {
        koperasiRef,
      });
      items = [...items, ...resolved.items];
      productsCreated = resolved.products_created;
    }

    if (!items.length) {
      return NextResponse.json({ success: false, error: "Items tidak boleh kosong" }, { status: 400 });
    }

    let dokumentasiUrl = payload.dokumentasi_url;
    let dokumentasiNama = dokumentasiFile?.name ?? payload.dokumentasi_nama;

    if (dokumentasiFile && !dokumentasiUrl && canWriteUploadsToDisk()) {
      const ref = generateRef("BM");
      const buffer = Buffer.from(await dokumentasiFile.arrayBuffer());
      dokumentasiUrl = await saveBarangMasukDokumentasi(buffer, {
        ref,
        mimeType: dokumentasiFile.type || "image/jpeg",
      });
      dokumentasiNama = dokumentasiFile.name;
    } else if (dokumentasiFile) {
      dokumentasiNama = dokumentasiFile.name;
    }

    const recordsCreated = await withTransaction(async (client: PoolClient) =>
      insertBarangMasuk(client, {
        koperasiRef,
        tanggalMasuk,
        transactionKeterangan: keterangan,
        dokumentasi: dokumentasiUrl || dokumentasiNama
          ? { url: dokumentasiUrl, nama: dokumentasiNama }
          : undefined,
        items,
      }),
    );

    const stockMessages = await Promise.all(
      items.map(async (item) => {
        const inv = await query<{ nama_produk: string | null; stok: string | null }>(
          `SELECT nama_produk, stok FROM inventaris_produk
           WHERE produk_sample_id = $1 AND koperasi_ref = $2`,
          [item.produk_sample_id, koperasiRef],
        );
        const row = inv[0];
        return `${row?.nama_produk ?? "Produk"}: ${row?.stok ?? 0}`;
      }),
    );

    await logAudit({
      userId: confirmedBy,
      actionType: "CREATE",
      tableName: "barang_masuk_produk",
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    const autoCreateNote = productsCreated.length
      ? ` Produk baru: ${productsCreated.join(", ")}.`
      : "";

    return NextResponse.json({
      success: true,
      records_created: recordsCreated,
      inventaris_updated: true,
      products_created: productsCreated,
      message: `✅ Data tersimpan. Stok ${stockMessages.join(", ")}.${autoCreateNote}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await logAudit({
      userId: "bendahara",
      actionType: "CREATE",
      tableName: "barang_masuk_produk",
      status: "failed",
      executionTimeMs: Date.now() - start,
      errorMessage: message,
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
