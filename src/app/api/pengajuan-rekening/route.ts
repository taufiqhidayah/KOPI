import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { getKoperasiRef, query, queryOne } from "@/lib/db";
import { generateDraftSurat } from "@/lib/llm";
import { generateRef } from "@/lib/security";

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();
    const koperasiRef = (body.koperasi_ref as string) || getKoperasiRef();
    const kodeBank = (body.kode_bank as string) ?? "002";
    const namaBank = (body.nama_bank as string) ?? "BRI";
    const submit = body.submit === true;

    const profil = await queryOne<{
      nama_koperasi: string | null;
      nik_koperasi: string | null;
      alamat_lengkap: string | null;
    }>(
      `SELECT nama_koperasi, nik_koperasi, alamat_lengkap FROM profil_koperasi WHERE koperasi_ref = $1`,
      [koperasiRef],
    );

    const ketua = await queryOne<{
      nama: string | null;
      jabatan: string | null;
      nik: string | null;
      no_hp: string | null;
    }>(
      `SELECT nama, jabatan, nik, no_hp FROM pengurus_koperasi
       WHERE koperasi_ref = $1 AND LOWER(jabatan) LIKE '%ketua%'
       LIMIT 1`,
      [koperasiRef],
    );

    const dokumen = await query<{ jenis_dokumen_ref: string; nomor: string | null }>(
      `SELECT jenis_dokumen_ref, nomor FROM dokumen_koperasi WHERE koperasi_ref = $1`,
      [koperasiRef],
    );

    const requiredDocs = ["SKAHU", "NIB", "NPWP"];
    const existingRefs = dokumen.map((d) => d.jenis_dokumen_ref.toUpperCase());
    const missingDocuments = requiredDocs.filter((doc) => !existingRefs.some((r) => r.includes(doc)));

    const autoFilledForm = {
      koperasi_ref: koperasiRef,
      nama_koperasi: profil?.nama_koperasi ?? "",
      nik_koperasi: profil?.nik_koperasi ?? "",
      alamat_lengkap: profil?.alamat_lengkap ?? "",
      penanggung_jawab: ketua?.nama ?? "",
      nik: ketua?.nik ?? "",
      nomor_penanggung_jawab: ketua?.no_hp ?? "",
      kode_bank: kodeBank,
      nama_bank: namaBank,
    };

    const draftSurat = await generateDraftSurat({
      namaKoperasi: autoFilledForm.nama_koperasi,
      alamat: autoFilledForm.alamat_lengkap,
      namaPengurus: autoFilledForm.penanggung_jawab,
      jabatan: ketua?.jabatan ?? "Ketua",
      namaBank,
    });

    let pengajuanRef: string | null = null;

    if (submit) {
      pengajuanRef = generateRef("PRB");
      await query(
        `INSERT INTO pengajuan_rekening_bank
          (pengajuan_rekening_ref, koperasi_ref, nik, penanggung_jawab,
           nomor_penanggung_jawab, status, kode_bank, nama_bank, dibuat_pada)
         VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, NOW())`,
        [
          pengajuanRef,
          koperasiRef,
          autoFilledForm.nik,
          autoFilledForm.penanggung_jawab,
          autoFilledForm.nomor_penanggung_jawab,
          kodeBank,
          namaBank,
        ],
      );
    }

    await logAudit({
      userId: "ketua",
      actionType: submit ? "CREATE" : "SELECT",
      tableName: "pengajuan_rekening_bank",
      recordRef: pengajuanRef ?? undefined,
      status: "success",
      executionTimeMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      draft_surat: draftSurat,
      auto_filled_form: autoFilledForm,
      missing_documents: missingDocuments,
      pengajuan_rekening_ref: pengajuanRef,
      message: submit
        ? "✅ Pengajuan rekening bank berhasil disimpan"
        : missingDocuments.length
          ? `✅ Draft surat siap. Upload ${missingDocuments.join(", ")} untuk melanjutkan.`
          : "✅ Draft surat dan form sudah siap.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
