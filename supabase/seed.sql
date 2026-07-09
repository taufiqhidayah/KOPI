-- =============================================================================
-- Kopdes Intelligence — Seed data
-- Mirrors the demo data in src/lib/mock-data.ts so the app behaves identically
-- when backed by Supabase. Safe to re-run (idempotent via ON CONFLICT).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Cooperative
-- -----------------------------------------------------------------------------
insert into public.cooperatives (id, code, name, village, district, regency)
values (
  '00000000-0000-0000-0000-0000000000c0',
  'KOPDES-3301-0042',
  'Koperasi Desa Makmur Sejahtera',
  'Desa Sumber Rejo',
  'Kec. Ngawi',
  'Kab. Ngawi'
)
on conflict (code) do update
  set name     = excluded.name,
      village  = excluded.village,
      district = excluded.district,
      regency  = excluded.regency;

-- -----------------------------------------------------------------------------
-- Members (currentMember + aspiration authors)
-- -----------------------------------------------------------------------------
insert into public.members (id, cooperative_id, member_code, name, nik, join_year)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c0', 'AGT-2024-0187', 'Sari Wulandari', '3301****4521', 2019),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c0', 'AGT-2024-0188', 'Budi Santoso',   '3301****7832', 2020),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c0', 'AGT-2024-0189', 'Dewi Lestari',   '3301****2198', 2021),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c0', 'AGT-2024-0190', 'Hendra Wijaya',  '3301****6644', 2018),
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000c0', 'AGT-2024-0191', 'Rina Kusuma',    '3301****9012', 2022)
on conflict (cooperative_id, member_code) do nothing;

-- -----------------------------------------------------------------------------
-- Financial summary (current KPI snapshot)
-- -----------------------------------------------------------------------------
insert into public.financial_summaries
  (cooperative_id, snapshot_date, omzet, shu, kas, omzet_change, shu_change, kas_change)
values
  ('00000000-0000-0000-0000-0000000000c0', '2026-07-01', 284750000, 42350000, 156200000, 8.4, 5.2, -2.1)
on conflict (cooperative_id, snapshot_date) do update
  set omzet        = excluded.omzet,
      shu          = excluded.shu,
      kas          = excluded.kas,
      omzet_change = excluded.omzet_change,
      shu_change   = excluded.shu_change,
      kas_change   = excluded.kas_change;

-- -----------------------------------------------------------------------------
-- Monthly revenue series (chart data)
-- -----------------------------------------------------------------------------
insert into public.monthly_revenues (cooperative_id, period, omzet, shu)
values
  ('00000000-0000-0000-0000-0000000000c0', '2025-01-01', 19800000, 2850000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-02-01', 21400000, 3100000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-03-01', 23100000, 3350000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-04-01', 22600000, 3280000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-05-01', 24500000, 3520000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-06-01', 25200000, 3680000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-07-01', 26100000, 3810000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-08-01', 24800000, 3590000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-09-01', 25700000, 3720000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-10-01', 26900000, 3890000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-11-01', 27800000, 4010000),
  ('00000000-0000-0000-0000-0000000000c0', '2025-12-01', 28900000, 4180000)
on conflict (cooperative_id, period) do update
  set omzet = excluded.omzet,
      shu   = excluded.shu;

-- -----------------------------------------------------------------------------
-- Aspirations (+ AI analyses where present in mock data)
-- -----------------------------------------------------------------------------
insert into public.aspirations
  (id, cooperative_id, member_id, member_name, member_nik, category, title, description, status, management_note, submitted_at)
values
  ('00000000-0000-0000-0000-0000000f0041', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000a1',
   'Sari Wulandari', '3301****4521', 'usulan',
   'Pembukaan unit usaha gerai sembako desa',
   'Usulan pembukaan gerai sembako di balai desa agar anggota tidak perlu ke pasar kota. Modal awal diperkirakan Rp 25 juta dengan target omzet Rp 8 juta per bulan.',
   'dalam_review', null, '2026-07-08T09:14:00+07'),

  ('00000000-0000-0000-0000-0000000f0038', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000a2',
   'Budi Santoso', '3301****7832', 'usulan',
   'Kerjasama pengadaan pupuk subsidi',
   'Mengajukan kerjasama dengan distributor pupuk untuk menjadi agen resmi di desa menjelang musim tanam.',
   'menunggu', null, '2026-07-05T14:22:00+07'),

  ('00000000-0000-0000-0000-0000000f0035', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000a3',
   'Dewi Lestari', '3301****2198', 'keluhan',
   'Keterlambatan pencairan simpanan sukarela',
   'Pengajuan pencairan simpanan sukarela tanggal 28 Juni belum diproses hingga saat ini.',
   'disetujui', 'Pencairan telah diproses tanggal 3 Juli. Keterlambatan disebabkan verifikasi saldo akhir bulan.', '2026-07-02T11:05:00+07'),

  ('00000000-0000-0000-0000-0000000f0031', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000a4',
   'Hendra Wijaya', '3301****6644', 'pertanyaan',
   'Rincian pembagian SHU tahun 2025',
   'Meminta rincian perhitungan SHU yang dibagikan pada Rapat Anggota Tahunan bulan Maret.',
   'disetujui', 'Dokumen rincian SHU telah diunggah ke portal anggota dan dibacakan ulang di pertemuan kelompok.', '2026-06-28T16:40:00+07'),

  ('00000000-0000-0000-0000-0000000f0027', '00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000a5',
   'Rina Kusuma', '3301****9012', 'usulan',
   'Pembelian mesin penggiling padi',
   'Usulan investasi mesin penggiling untuk unit usaha tani guna meningkatkan layanan ke petani anggota.',
   'ditolak', 'Belum sesuai prioritas investasi tahun ini. Diusulkan masuk rencana kerja 2027.', '2026-06-20T08:30:00+07')
on conflict (id) do nothing;

insert into public.aspiration_analyses (aspiration_id, score, roi, rationale, decision, model)
values
  ('00000000-0000-0000-0000-0000000f0041', 7, '18-24 bulan',
   'Kas koperasi mencukupi. Permintaan anggota tinggi berdasarkan survei internal. Disarankan pilot 3 bulan dengan evaluasi berkala.',
   'dalam_review', 'seed'),
  ('00000000-0000-0000-0000-0000000f0027', 4, '36+ bulan',
   'Proyeksi pengembalian modal terlalu panjang dengan beban operasional tinggi pada kondisi saat ini.',
   'ditolak', 'seed')
on conflict do nothing;
