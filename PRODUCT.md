# KOPDES COPILOT — Product Requirements Document

**AI Agent untuk Petugas Koperasi Desa (SIMKOPDES)**

| | |
|---|---|
| **Event** | Hackathon Digital Cooperative 2026 — [simkopdes.go.id](https://simkopdes.go.id) |
| **Version** | 1.0 |
| **Last Updated** | 2026-07-11 |
| **Status** | Ready for MVP Development (48 Hours) |
| **Target Platform** | Cursor IDE + Google Cloud (Cloud SQL PostgreSQL) |

---

## Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Validation](#2-problem-statement--validation)
3. [Target Users & Personas](#3-target-users--personas)
4. [Technical Architecture](#4-technical-architecture)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [User Flows & Use Cases](#7-user-flows--use-cases)
8. [Security & Guardrails](#8-security--guardrails)
9. [Implementation Checklist](#9-implementation-checklist)
10. [Starter Code](#10-starter-code)
11. [Pitching Strategy](#11-pitching-strategy)

---

## 1. Executive Summary

### 1.1 Vision Statement

Kopdes Copilot adalah AI Agent yang **di-embed** di dashboard SIMKOPDES existing, membantu petugas koperasi menjalankan tugas administratif lewat **sidebar chat** — mengubah "klik menu berulang" menjadi "ngobrol dengan sistem".

### 1.2 Core Value Proposition

**Untuk Pengurus Koperasi:**

- Kurangi friksi input data (foto nota → auto-fill, bukan ketik manual)
- Akses menu SIMKOPDES tanpa perlu hafal navigasi
- Generate laporan kompleks dalam hitungan detik
- Unlock "hidden menu" yang membingungkan (Formulir Permohonan, Pengajuan Rekening Bank, dll)

**Untuk Ekosistem:**

- Selaras SPBE & INA Digital (tidak bangun dari nol)
- Patuh UU PDP (data tetap di ekosistem GCP)
- Menurunkan hambatan adopsi SIMKOPDES — target: lebih banyak transaksi lapangan yang **tercatat** di sistem

### 1.3 Key Principles (dari Mentorship PDF)

| Mentor | Prinsip | Implementasi |
|--------|---------|--------------|
| Irzan Raditya | "Bangun skateboard dulu, 48 jam, 1 alur" | Fokus 3 use case MVP |
| Rama Mamuaya | "Solusi terbaik menempel pada rel yang ada" | Embed di SIMKOPDES |
| Suci Sutjipto | "Selaras SPBE, patuh UU PDP" | Audit log, human-in-the-loop |
| Irwanda | "Dampak Strategis bobot 1.5" | Baseline → Target → Dampak |
| Nurkholis | "Data-driven decision making" | AI analisis NPV, IRR, SROI |

### 1.4 Pilar Hackathon

| | |
|---|---|
| **Pilar Utama** | PILAR 1 — PENINGKATAN VOLUME USAHA |
| **Pilar Pendukung** | PILAR 2 — KETERLIBATAN MASYARAKAT |

**Narasi:** "Kami tidak menciptakan transaksi baru. Kami menghilangkan salah satu hambatan adopsi — friksi administrasi — agar transaksi yang sudah terjadi di desa lebih mudah tercatat di SIMKOPDES."

---

## 2. Problem Statement & Validation

### 2.1 Data Lapangan (dari PDF Mentor)

**Fakta Lapangan (terverifikasi mentor):**

- 83,362 KDKMP berbadan hukum (Suci, hal.2)
- Hanya 795 (<1%) yang aktif bertransaksi di SIMKOPDES (Irwanda, hal.7)
- 2.08 juta anggota terdaftar via Simkopdes Mobile
- Volume usaha tercatat: Rp16.8 M
- 83.000+ koperasi sudah punya sistem, microsite, aplikasi mobile
- Dari 60 juta UMKM, baru 40% masuk ekosistem digital

**Akar Masalah (multi-faktor — bukan satu penyebab):**

- "Bukan tidak ada sistem, tapi sistem tidak dipakai"
- Literasi digital rendah
- Kebiasaan pencatatan manual (buku tulis)
- Tidak ada insentif atau kebutuhan harian untuk membuka SIMKOPDES
- UX/menu rumit (salah satu hambatan, bukan satu-satunya)
- Solusi: temui pengguna di tempat mereka sudah berada (embed di SIMKOPDES)

> **Catatan metodologi:** Angka <1% adalah **fakta adopsi transaksi**. Estimasi waktu administrasi (mis. 3 jam/hari) berasal dari **persona fiktif** untuk demo — bukan survei nasional. Kopdes Copilot menargetkan **salah satu hambatan konkret** (friksi input & navigasi), bukan mengklaim menjadi satu-satunya penyebab rendahnya adopsi.

### 2.2 The Pain Points

**Masalah 1: Beban Administrasi Berat** *(hambatan yang ditarget Copilot)*

- Persona demo: bendahara habiskan ±3 jam/hari untuk rekap nota manual *(ilustrasi, bukan data nasional)*
- Nota kertas dari transaksi luar kantor (supplier, panen di sawah)
- Input manual ke SIMKOPDES memakan waktu dan rawan error → transaksi tidak tercatat

**Masalah 2: Menu SIMKOPDES Kompleks**

- 18+ menu dengan navigasi rumit (Formulir Permohonan, Anggota, Karyawan, RAT, Simpanan, Pinjaman, Penjualan, Off-Taker, Klinik Desa, Apotek Desa, dll)
- Banyak "hidden menu" yang tidak terakses
- Butuh NIB, NPWP, SKAHU — pengurus bingung cara isi

**Masalah 3: Keputusan Pakai Intuisi**

- Tidak ada analisis kelayakan otomatis (NPV, IRR, BCR)
- Prediksi stok dan harga komoditas manual
- Risiko kredit macet tinggi karena penilaian subjektif

### 2.3 Problem-Solution Fit

| Hambatan (yang ditarget) | Solusi Kopdes Copilot | Dampak (target MVP) |
|---------|----------------------|--------|
| Input manual lambat & rawan error | Foto nota → auto-fill form | Input transaksi: 30 menit → 2 menit |
| Menu kompleks | Chat di sidebar Copilot (bahasa natural) | Akses tanpa hafal navigasi |
| Hidden menu sulit diakses | AI unlocker + auto-fill | Isi form: 30 menit → 3 menit |
| Keputusan tanpa data | AI analisis kelayakan | Laporan: 2 jam → 10 detik |

**Yang TIDAK diklaim:** Copilot bukan satu-satunya solusi untuk menaikkan angka 795 → ribuan koperasi aktif. Kontribusinya spesifik: **menurunkan friksi** sehingga petugas yang sudah punya akses SIMKOPDES lebih mungkin memakainya secara rutin.

---

## 3. Target Users & Personas

### 3.1 Primary Persona: "Bu Sari"

| Atribut | Detail |
|---------|--------|
| **Nama** | Sari Wulandari |
| **Usia** | 47 tahun |
| **Peran** | Bendahara Koperasi Desa Sukamaju |
| **Lokasi** | Desa Sukamaju, Bogor, Jawa Barat |

**Perangkat:**

- Laptop tua (Windows 7, Chrome lama) di kantor
- HP Android Rp1.5 juta (memori hampir penuh)
- Sinyal sering 2 bar, kuota dihemat

**Karakteristik:**

- Jago WhatsApp (buka 20x sehari)
- Malas install aplikasi baru
- Literasi digital: sedang
- Pembukuan masih di 3 buku tulis

**Pain Points** *(ilustrasi untuk demo — berdasarkan observasi lapangan umum, bukan survei nasional)*:

- Sering habiskan waktu lama untuk rekap nota sebelum bisa input ke SIMKOPDES
- Bingung navigasi menu SIMKOPDES
- Takut salah klik → data rusak
- Tidak punya waktu untuk layanan anggota

**Goals:**

- Selesaikan admin cepat, pulang tepat waktu
- Tidak salah input data
- Bisa layani anggota dengan baik

### 3.2 Secondary Persona: "Pak Budi"

| Atribut | Detail |
|---------|--------|
| **Nama** | Budi Santoso |
| **Usia** | 52 tahun |
| **Peran** | Ketua Koperasi Sukamaju |

**Pain Points:**

- Butuh buka rekening bank, bingung menu mana
- Perlu draft surat permohonan, tidak tahu format
- Butuh analisis kelayakan usaha baru, tidak paham NPV/IRR

**Goals:**

- Akses menu kompleks tanpa training
- Generate dokumen profesional otomatis
- Keputusan bisnis berbasis data

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer | Komponen |
|-------|----------|
| **Full-stack** | Next.js 15 (App Router) + TypeScript |
| **Database** | PostgreSQL 18.4 — **existing** di Google Cloud SQL (`hackathon_2026`) |
| **DB Client** | `pg` / Drizzle ORM — koneksi via Cloud SQL Auth Proxy |
| **UI** | Tailwind CSS 3.4, shadcn/ui — **widget sidebar embed** di SIMKOPDES |
| **Chat/Command** | Groq (Llama 3.3 70B) — text-to-SQL & summary via sidebar chat |
| **Vision/OCR** | OpenAI GPT-4o Vision — ekstraksi foto nota |
| **Fallback** | Qwen API (alternatif, bahasa ID bagus) |
| **Audit Log** | Structured logging → Google Cloud Logging (tanpa tabel baru) |
| **Deployment** | Cloud Run atau Vercel (frontend/API) + Cloud SQL (existing) |

> **Prinsip:** Tidak membuat tabel/schema baru. Semua operasi CRUD langsung ke database SIMKOPDES hackathon yang sudah tersedia.

### 4.2 System Architecture Diagram

```
SIMKOPDES EXISTING (dashboard asli)
├─ Menu & halaman existing (tidak diubah)
└─ Sidebar Copilot (widget embed kanan — satu-satunya entry point AI)
        ├─ Chat input (perintah bahasa natural)
        ├─ Upload foto nota
        └─ Preview & konfirmasi aksi
        ↕ HTTPS
API ROUTES (Next.js /api/*)
├─ POST /api/chat              → Text-to-SQL (Groq) — READ
├─ POST /api/upload-note       → Vision + Auto-fill (GPT-4o)
├─ POST /api/barang-masuk      → CREATE barang_masuk_produk + UPDATE inventaris
├─ POST /api/pengajuan-rekening → CREATE pengajuan_rekening_bank
├─ GET/PUT/DELETE /api/[resource] → CRUD langsung ke tabel existing
└─ GET  /api/health            → Health check + DB connectivity
        ↕
Cloud SQL Auth Proxy / VPC Connector
        ↕
GOOGLE CLOUD SQL (PostgreSQL — hackathon_2026)
└─ 27 tabel existing (lihat hackathon_2026_schema.sql)
        ↕
AI APIs (eksternal)
├─ Groq (chat/SQL)
└─ OpenAI (vision)
```

> **Embed strategy:** Copilot dirender sebagai widget (React component / iframe) di dalam layout SIMKOPDES. Tidak ada shortcut keyboard atau modal terpisah — semua interaksi AI lewat sidebar.

### 4.3 Data Flow

```
User Input (Natural Language / Foto / Form)
        ↓
Next.js API Route
        ↓
Validate Input + Scope koperasi_ref
Check Guardrails (lib/guardrails.ts — in-app config)
Call AI API (Groq/OpenAI) jika perlu
Parse AI Response
Execute CRUD ke PostgreSQL existing
Log ke Cloud Logging (structured audit)
Return Response
        ↓
Frontend Display (Sidebar/Modal)
```

### 4.4 Koneksi Database

```bash
# Local dev — Cloud SQL Auth Proxy
cloud-sql-proxy PROJECT:REGION:INSTANCE --port 5432
```

```env
# .env.local
DATABASE_URL=postgresql://hackathon_2026:****@127.0.0.1:5432/hackathon_2026
GROQ_API_KEY=...
OPENAI_API_KEY=...
KOPERASI_REF=KOPDES-DEMO-001   # scope semua query ke 1 koperasi demo
```

---

## 5. Database Schema

### 5.1 Sumber Schema (TIDAK BUAT BARU)

> **File referensi:** `hackathon_2026_schema.sql`
>
> Database PostgreSQL 18.4 sudah tersedia di Google Cloud SQL dengan owner `hackathon_2026`. **Jangan buat migration, jangan seed ulang, jangan tambah tabel.**

Semua tabel menggunakan pola:
- **Primary key:** kolom `*_ref` atau `*_sample_id` bertipe `text`
- **Scope koperasi:** kolom `koperasi_ref` di hampir semua tabel transaksional
- **Timestamp:** `dibuat_pada`, `diperbarui_pada`

### 5.2 Daftar Tabel (27 tabel existing)

| Domain | Tabel | Fungsi |
|--------|-------|--------|
| **Profil** | `profil_koperasi` | Data identitas koperasi |
| | `pengurus_koperasi` | Pengurus & jabatan |
| | `anggota_koperasi` | Data anggota |
| | `karyawan_koperasi` | Data karyawan |
| | `modal_koperasi` | Modal koperasi |
| | `kbli_koperasi` | Klasifikasi usaha |
| **Produk & Inventaris** | `produk_koperasi` | Master produk |
| | `inventaris_produk` | Stok saat ini |
| | `barang_masuk_produk` | Penerimaan barang (target foto nota) |
| | `barang_keluar_produk` | Detail barang keluar per transaksi |
| **Transaksi** | `transaksi_penjualan` | Header penjualan |
| | `simpanan_anggota` | Simpanan anggota |
| **Pengajuan (Hidden Menu)** | `pengajuan_rekening_bank` | Pengajuan rekening bank |
| | `pengajuan_pembiayaan` | Pengajuan pembiayaan |
| | `pengajuan_kemitraan` | Pengajuan kemitraan |
| | `pengajuan_domain` | Pengajuan domain |
| **Aset & Gerai** | `aset_koperasi` | Aset koperasi |
| | `gerai_koperasi` | Gerai/unit usaha |
| | `akun_bank_koperasi` | Rekening bank existing |
| **Dokumen** | `dokumen_koperasi` | Dokumen legal (NIB, SKAHU, dll) |
| | `rat_koperasi` | RAT & laporan keuangan |
| **Referensi** | `referensi_wilayah` | Data wilayah |
| | `referensi_profil_desa` | Profil desa |
| | `referensi_komoditas_desa` | Komoditas desa |
| | `referensi_koperasi_wilayah` | Mapping koperasi-wilayah |
| | `referensi_dokumen_koperasi` | Jenis dokumen |
| | `referensi_gerai_koperasi` | Jenis gerai |

### 5.3 Tabel Kunci untuk MVP (kolom real)

#### `profil_koperasi`

```sql
koperasi_ref, nama_koperasi, nik_koperasi, alamat_lengkap,
kode_pos, status_registrasi, bentuk_koperasi, kategori_usaha
```

#### `pengurus_koperasi`

```sql
pengurus_ref, koperasi_ref, nama, jabatan, nik, no_hp, email, alamat
```

#### `produk_koperasi`

```sql
produk_sample_id, koperasi_ref, kode_barcode, nama_produk, unit
```

#### `barang_masuk_produk` — target CREATE dari foto nota

```sql
barang_masuk_ref, produk_sample_id, koperasi_ref, nama_produk,
jumlah_masuk, jumlah_tersedia, harga_beli, harga_jual,
total_biaya, keterangan, status, tanggal_masuk
```

#### `inventaris_produk` — target UPDATE stok

```sql
inventaris_ref, produk_sample_id, koperasi_ref, nama_produk, stok
```

#### `transaksi_penjualan` + `barang_keluar_produk` — target READ laporan

```sql
-- Header penjualan
transaksi_sample_id, koperasi_ref, nama_pelanggan, tanggal_dibuat,
total_pembayaran, status_transaksi, metode_pembayaran

-- Detail produk terjual
transaksi_sample_id, produk_sample_id, nama_produk, jumlah_keluar,
harga, total_nilai, tanggal_keluar
```

#### `pengajuan_rekening_bank` — target CREATE hidden menu

```sql
pengajuan_rekening_ref, koperasi_ref, nik, penanggung_jawab,
nomor_penanggung_jawab, status, kode_bank, nama_bank
```

#### `dokumen_koperasi` — cek kelengkapan dokumen

```sql
dokumen_ref, koperasi_ref, jenis_dokumen_ref, nomor,
tanggal_berlaku, unggahan_dokumen
```

### 5.4 Akses Data: Full CRUD

Copilot memiliki akses **CREATE, READ, UPDATE, DELETE** ke tabel existing, dengan aturan:

| Operasi | Cara Akses | Konfirmasi User |
|---------|------------|-----------------|
| **READ** (laporan, query) | Natural language → text-to-SQL | Tidak perlu |
| **CREATE** (barang masuk, pengajuan) | API endpoint terstruktur | Preview dulu |
| **UPDATE** (stok, profil, status) | API endpoint terstruktur | Preview untuk data sensitif |
| **DELETE** | API endpoint terstruktur | **Wajib** konfirmasi eksplisit |

> Semua query **wajib** difilter `WHERE koperasi_ref = :koperasi_ref` agar tidak akses data koperasi lain.

### 5.5 Introspeksi Schema untuk AI

Saat startup, backend baca schema real dari PostgreSQL:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Hasilnya di-cache sebagai context untuk Groq text-to-SQL — AI generate query sesuai kolom **real**, bukan asumsi.

---

## 6. API Endpoints

### 6.1 `POST /api/chat` — Natural Language Command

**Request:**

```json
{
  "command": "Buatkan laporan penjualan minggu ini",
  "context": {
    "current_page": "dashboard",
    "user_id": "pengurus_001",
    "user_role": "bendahara"
  }
}
```

**Response:**

```json
{
  "success": true,
  "sql": "SELECT bk.nama_produk, SUM(bk.total_nilai) AS total_pendapatan FROM barang_keluar_produk bk JOIN transaksi_penjualan t ON bk.transaksi_sample_id = t.transaksi_sample_id WHERE t.koperasi_ref = 'KOPDES-DEMO-001' AND t.tanggal_dibuat >= NOW() - INTERVAL '7 days' GROUP BY bk.nama_produk ORDER BY total_pendapatan DESC",
  "data": [
    {"nama_produk": "Beras Premium", "total_pendapatan": 6750000},
    {"nama_produk": "Gula Pasir", "total_pendapatan": 3000000},
    {"nama_produk": "Minyak Goreng", "total_pendapatan": 660000}
  ],
  "summary": "📊 Total penjualan minggu ini: Rp10.410.000. Produk terlaris: Beras Premium (Rp6.75jt).",
  "execution_time_ms": 1234
}
```

### 6.2 `POST /api/upload-note` — Foto Nota → Extract Data

**Request:** `multipart/form-data` dengan field `file`

**Response:**

```json
{
  "success": true,
  "extracted_data": {
    "tanggal": "2026-07-10",
    "supplier": "Toko Makmur",
    "items": [
      {"nama": "Beras Premium", "qty": 10, "harga": 120000, "produk_sample_id": "PRD-001"},
      {"nama": "Gula Pasir", "qty": 5, "harga": 150000, "produk_sample_id": "PRD-002"}
    ],
    "total": 1950000
  },
  "matched_products": 2,
  "unmatched_products": 0,
  "message": "✅ 2 item berhasil dicocokkan dengan master produk"
}
```

### 6.3 `POST /api/barang-masuk` — CREATE Barang Masuk + UPDATE Inventaris

**Request:**

```json
{
  "koperasi_ref": "KOPDES-DEMO-001",
  "tanggal_masuk": "2026-07-10",
  "keterangan": "Toko Makmur",
  "items": [
    {"produk_sample_id": "PRD-001", "jumlah_masuk": 10, "harga_beli": 120000},
    {"produk_sample_id": "PRD-002", "jumlah_masuk": 5, "harga_beli": 150000}
  ],
  "confirmed_by": "pengurus_001"
}
```

**Response:**

```json
{
  "success": true,
  "records_created": [
    {"barang_masuk_ref": "BM-2026-0042", "produk_sample_id": "PRD-001"},
    {"barang_masuk_ref": "BM-2026-0043", "produk_sample_id": "PRD-002"}
  ],
  "inventaris_updated": true,
  "message": "✅ Data tersimpan. Stok Beras Premium: 60 karung, Gula Pasir: 35 karung"
}
```

**Operasi DB (dalam 1 transaction):**

```sql
-- CREATE per item
INSERT INTO barang_masuk_produk (barang_masuk_ref, produk_sample_id, koperasi_ref, ...)
VALUES (...);

-- UPDATE stok
UPDATE inventaris_produk
SET stok = stok + :jumlah_masuk, diperbarui_pada = NOW()
WHERE produk_sample_id = :produk_sample_id AND koperasi_ref = :koperasi_ref;
```

### 6.4 `POST /api/pengajuan-rekening` — Hidden Menu Unlocker (CREATE)

**Request:**

```json
{
  "koperasi_ref": "KOPDES-DEMO-001",
  "kode_bank": "002",
  "nama_bank": "BRI",
  "keperluan": "Operasional koperasi"
}
```

**Response:**

```json
{
  "success": true,
  "draft_surat": "KOPERASI SUKAMAJU\nJl. Desa Sukamaju No. 1\n...\n\nNomor: 001/SKM/VII/2026\nPerihal: Permohonan Pembukaan Rekening Bank\n\nKepada Yth,\nPimpinan PT Bank Rakyat Indonesia\n\nDengan hormat,\n\nKami yang bertanda tangan di bawah ini:\nNama: Budi Santoso\nJabatan: Ketua Koperasi Sukamaju\n...",
  "auto_filled_form": {
    "koperasi_ref": "KOPDES-DEMO-001",
    "nama_koperasi": "Koperasi Sukamaju",
    "nik_koperasi": "1234567890123",
    "alamat_lengkap": "Jl. Desa Sukamaju No. 1",
    "penanggung_jawab": "Budi Santoso",
    "nik": "3201010101010001",
    "nomor_penanggung_jawab": "081111111111",
    "kode_bank": "002",
    "nama_bank": "BRI"
  },
  "missing_documents": ["SKAHU"],
  "message": "✅ Draft surat dan form sudah siap. Upload SKAHU untuk melanjutkan."
}
```

**Operasi DB setelah konfirmasi user:**

```sql
INSERT INTO pengajuan_rekening_bank
  (pengajuan_rekening_ref, koperasi_ref, nik, penanggung_jawab,
   nomor_penanggung_jawab, status, kode_bank, nama_bank, dibuat_pada)
VALUES (...);
```

### 6.5 CRUD Endpoints Umum

Untuk operasi langsung ke tabel existing (bukan via natural language):

| Method | Endpoint | Operasi | Tabel Contoh |
|--------|----------|---------|--------------|
| `GET` | `/api/anggota` | READ | `anggota_koperasi` |
| `POST` | `/api/anggota` | CREATE | `anggota_koperasi` |
| `PUT` | `/api/anggota/:ref` | UPDATE | `anggota_koperasi` |
| `DELETE` | `/api/anggota/:ref` | DELETE | `anggota_koperasi` |
| `GET` | `/api/produk` | READ | `produk_koperasi` |
| `PUT` | `/api/inventaris/:ref` | UPDATE | `inventaris_produk` |
| `GET` | `/api/dokumen` | READ | `dokumen_koperasi` |

Semua endpoint otomatis scope ke `koperasi_ref` dari session user.

---

## 7. User Flows & Use Cases

### 7.1 Use Case 1: Foto Nota → Auto-fill Form

| | |
|---|---|
| **Persona** | Bu Sari, Bendahara |
| **Situasi** | Terima barang dari supplier, ada struk kertas |

**Flow:**

1. Bu Sari buka dashboard SIMKOPDES
2. Klik "📷 Upload Foto Nota" di sidebar Copilot
3. Upload foto struk
4. Backend kirim ke OpenAI GPT-4o Vision API
5. Vision API ekstrak: tanggal, supplier, items, total
6. Backend match `nama_produk` dengan `produk_koperasi.produk_sample_id` (by `koperasi_ref`)
7. Sidebar tampilkan preview data
8. Bu Sari verifikasi → klik "Konfirmasi & Simpan"
9. Backend (dalam 1 PostgreSQL transaction):
   - `INSERT` ke `barang_masuk_produk`
   - `UPDATE` `inventaris_produk.stok`
   - Log ke Cloud Logging
10. Sidebar: "✅ Berhasil! Stok otomatis diupdate"

**Success Criteria:**

| Metrik | Sebelum | Sesudah |
|--------|---------|---------|
| Waktu input | 30 menit | 2 menit |
| Error human input | 25% | <5% |

### 7.2 Use Case 2: Natural Language Query → Laporan

| | |
|---|---|
| **Persona** | Bu Sari, Bendahara |
| **Situasi** | Butuh laporan penjualan minggu ini untuk rapat |

**Flow:**

1. Bu Sari buka halaman SIMKOPDES seperti biasa (dashboard existing)
2. Sidebar Copilot sudah tampil di kanan (widget embed)
3. Ketik di chat sidebar: "Buatkan laporan penjualan minggu ini"
4. Backend:
   - Groq LLM generate SQL query (PostgreSQL syntax, scope `koperasi_ref`)
   - Execute `SELECT` ke Cloud SQL
   - AI generate summary + insight
5. Sidebar tampilkan:
   - Ringkasan: Total, produk terlaris
   - Tabel/grafik hasil query
   - Tombol "Download PDF" (opsional)
6. Bu Sari baca laporan langsung di sidebar — tidak perlu buka menu terpisah

**Success Criteria:**

| Metrik | Sebelum | Sesudah |
|--------|---------|---------|
| Waktu generate | 2 jam | 10 detik |

### 7.3 Use Case 3: Hidden Menu Unlocker

| | |
|---|---|
| **Persona** | Pak Budi, Ketua |
| **Situasi** | Mau buka rekening bank, bingung menu mana |

**Flow:**

1. Pak Budi buka halaman SIMKOPDES (dashboard existing)
2. Ketik di sidebar Copilot: "Aku mau buka rekening bank di BRI"
3. Backend:
   - `SELECT` dari `profil_koperasi` (data dasar)
   - `SELECT` dari `pengurus_koperasi` WHERE `jabatan` = 'ketua'
   - `SELECT` dari `dokumen_koperasi` JOIN `referensi_dokumen_koperasi` (cek kelengkapan)
4. Sidebar tampilkan:
   - Checklist dokumen lengkap
   - Dokumen yang belum (misal: SKAHU via `jenis_dokumen_ref`)
   - Tombol "Lihat Draft Surat"
5. Pak Budi klik "Lihat Draft Surat"
6. Modal tampilkan draft surat profesional (auto-generated dari data real)
7. Klik "Lanjut ke Form Pengajuan"
8. Backend auto-fill form `pengajuan_rekening_bank`
9. Pak Budi verifikasi → klik "Submit"
10. Backend `INSERT` ke `pengajuan_rekening_bank` + log ke Cloud Logging

**Success Criteria:**

| Metrik | Sebelum | Sesudah |
|--------|---------|---------|
| Waktu isi form | 30 menit | 3 menit |

---

## 8. Security & Guardrails

### 8.1 Guardrails Config (In-App — Tanpa Tabel Baru)

> File: `src/lib/guardrails.ts`

```typescript
export const GUARDRAILS = {
  // Natural language chat: READ only
  chatAllowedOps: ['SELECT'] as const,

  // CRUD via API endpoint terstruktur
  crudAllowedTables: [
    'profil_koperasi', 'anggota_koperasi', 'pengurus_koperasi',
    'produk_koperasi', 'inventaris_produk', 'barang_masuk_produk',
    'barang_keluar_produk', 'transaksi_penjualan', 'simpanan_anggota',
    'pengajuan_rekening_bank', 'pengajuan_pembiayaan', 'dokumen_koperasi',
  ],

  requiresConfirmation: {
    CREATE: ['anggota_koperasi', 'simpanan_anggota', 'pengajuan_rekening_bank'],
    UPDATE: ['profil_koperasi', 'inventaris_produk'],
    DELETE: ['anggota_koperasi', 'produk_koperasi'],
  },

  forbiddenKeywords: ['DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'],
  maxRowsPerQuery: 1000,
} as const;
```

### 8.2 SQL Validation (Chat = SELECT Only)

> File: `src/lib/security.ts`

Natural language chat **hanya boleh READ**. CREATE/UPDATE/DELETE harus lewat API endpoint terstruktur dengan preview + konfirmasi.

```typescript
const FORBIDDEN_KEYWORDS = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];

export function validateChatSql(sql: string): boolean {
  const upper = sql.toUpperCase().trim();
  if (!upper.startsWith('SELECT')) return false;
  if (!upper.includes('KOPERASI_REF')) return false; // wajib scope
  return !FORBIDDEN_KEYWORDS.some((kw) => upper.includes(kw));
}
```

### 8.3 Audit Logging (UU PDP — Tanpa Tabel Baru)

> File: `src/lib/audit.ts`

Semua aksi AI dicatat ke **Google Cloud Logging** sebagai structured JSON:

```typescript
export async function logAudit(entry: {
  userId: string;
  actionType: 'SELECT' | 'CREATE' | 'UPDATE' | 'DELETE';
  tableName: string;
  recordRef?: string;
  inputText?: string;
  sqlGenerated?: string;
  status: 'success' | 'failed';
  executionTimeMs: number;
}) {
  // Structured log → Cloud Logging (bukan INSERT ke DB)
  console.info(JSON.stringify({ severity: 'INFO', component: 'kopdes-copilot', ...entry }));
}
```

### 8.4 Human-in-the-loop (CRUD)

Pattern **WAJIB** untuk operasi CREATE/UPDATE/DELETE:

```typescript
export async function safeCrud(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  table: string,
  data: Record<string, unknown>,
  userId: string,
) {
  validateGuardrail(table, operation);

  const preview = { operation, table, data, riskLevel: assessRisk(table, operation) };

  if (needsConfirmation(table, operation)) {
    const confirmed = await requestUserConfirmation(preview);
    if (!confirmed) return { status: 'cancelled' };
  }

  const client = await getDbClient();
  try {
    await client.query('BEGIN');
    const result = await executeCrud(client, operation, table, data);
    await client.query('COMMIT');
    await logAudit({ userId, actionType: operation, tableName: table, status: 'success', ... });
    return { status: 'success', data: result };
  } catch (e) {
    await client.query('ROLLBACK');
    await logAudit({ userId, actionType: operation, tableName: table, status: 'failed', ... });
    throw e;
  }
}
```

### 8.5 SPBE & INA Digital Alignment

**✅ Selaras SPBE (Perpres 82/2023)**

- Interoperable, tidak bikin pulau data baru
- Menempel di SIMKOPDES yang sudah ada

**✅ Patuh UU PDP**

- Structured audit log ke Cloud Logging untuk setiap aksi AI
- Human-in-the-loop untuk CREATE/UPDATE/DELETE sensitif
- Data tetap di ekosistem GCP (Cloud SQL existing)

**✅ Selaras INA Digital**

- Memperkaya platform pemerintah yang ada
- Tidak duplicating functionality

---

## 9. Implementation Checklist

### Phase 1: MVP (48 Jam)

#### Hari 1: Foundation + DB Connection (8 jam)

**Setup Project (1 jam)**

- [ ] `npx create-next-app@latest` dengan TypeScript + Tailwind
- [ ] Install dependencies: `pg`, `groq-sdk`, `openai`, `zod`
- [ ] Buat `.env.local` dengan `DATABASE_URL`, API keys, `KOPERASI_REF`

**Database Connection (2 jam)**

- [ ] Setup Cloud SQL Auth Proxy untuk local dev
- [ ] Buat `src/lib/db.ts` — connection pool ke PostgreSQL existing
- [ ] Test koneksi: `SELECT COUNT(*) FROM profil_koperasi`
- [ ] Buat `src/lib/schema.ts` — introspeksi schema dari `information_schema`
- [ ] **JANGAN** buat migration, seed, atau tabel baru

**API Routes Setup (2 jam)**

- [ ] Buat `src/app/api/health/route.ts` — health + DB check
- [ ] Buat `src/lib/guardrails.ts` dan `src/lib/security.ts`
- [ ] Buat `src/lib/audit.ts` — structured logging
- [ ] Setup CORS jika perlu

**LLM Integration (3 jam)**

- [ ] Buat `src/lib/llm.ts` — `generateSql()` dengan Groq API
- [ ] Buat `src/lib/llm.ts` — `generateSummary()` dengan Groq API
- [ ] Pass schema introspection sebagai context ke prompt
- [ ] Test dengan 5 contoh query (PostgreSQL syntax, scope `koperasi_ref`)

#### Hari 2: Vision + Frontend + Integration (8 jam)

**Vision API Integration (2 jam)**

- [ ] Buat `src/lib/vision.ts` — `extractNoteData()` dengan OpenAI Vision
- [ ] Buat product matcher: `nama_produk` → `produk_sample_id`
- [ ] Test dengan 3 contoh foto nota

**API Endpoints (2 jam)**

- [ ] `src/app/api/chat/route.ts` — text-to-SQL (READ only)
- [ ] `src/app/api/upload-note/route.ts` — Vision OCR
- [ ] `src/app/api/barang-masuk/route.ts` — CREATE + UPDATE inventaris
- [ ] `src/app/api/pengajuan-rekening/route.ts` — hidden menu unlocker
- [ ] Test semua endpoints terhadap Cloud SQL real

**Frontend (2 jam)**

- [ ] Buat `src/components/copilot/Sidebar.tsx` — **satu-satunya UI Copilot** (chat + upload + preview)
- [ ] Buat `src/components/copilot/ConfirmDialog.tsx` — human-in-the-loop
- [ ] Integrasikan Sidebar sebagai widget embed di layout SIMKOPDES

**Integration & Testing (2 jam)**

- [ ] Test end-to-end Flow 1 (Foto Nota → CREATE barang_masuk)
- [ ] Test end-to-end Flow 2 (Natural Language → SELECT laporan)
- [ ] Test end-to-end Flow 3 (Hidden Menu → CREATE pengajuan_rekening)
- [ ] Fix bugs

**Deployment (1 jam)**

- [ ] Deploy ke Cloud Run atau Vercel
- [ ] Setup Cloud SQL Connector + environment variables
- [ ] Test deployed version

**Demo Preparation (1 jam)**

- [ ] Siapkan 3 skenario demo dengan data real dari Cloud SQL
- [ ] Latih presentasi 5 menit
- [ ] Siapkan backup plan jika API lambat

---

## 10. Starter Code

### 10.1 Database Connection: `src/lib/db.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export async function query<T>(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 10.2 LLM Service: `src/lib/llm.ts`

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateSql(command: string, schema: string, koperasiRef: string) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Kamu asisten SQL PostgreSQL untuk SIMKOPDES.
Skema database:
${schema}

WAJIB: semua query harus ada WHERE koperasi_ref = '${koperasiRef}'.
Perintah user: "${command}"
Generate SQL SELECT. Return HANYA SQL-nya.`,
    }],
    temperature: 0,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}
```

### 10.3 API Route: `src/app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateSql } from '@/lib/llm';
import { query } from '@/lib/db';
import { validateChatSql } from '@/lib/security';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const { command, context } = await req.json();
  const koperasiRef = process.env.KOPERASI_REF!;
  const start = Date.now();

  const sql = await generateSql(command, '/* schema dari introspection */', koperasiRef);
  if (!validateChatSql(sql)) {
    return NextResponse.json({ success: false, error: 'Query tidak valid' }, { status: 400 });
  }

  const data = await query(sql);
  await logAudit({
    userId: context.user_id,
    actionType: 'SELECT',
    tableName: 'multiple',
    inputText: command,
    sqlGenerated: sql,
    status: 'success',
    executionTimeMs: Date.now() - start,
  });

  return NextResponse.json({ success: true, sql, data });
}
```

### 10.4 Frontend: `src/components/copilot/Sidebar.tsx`

```tsx
'use client';

import { useState } from 'react';

export function Sidebar() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Halo! Saya siap membantu. Coba:\n• "Buatkan laporan penjualan minggu ini"\n• "Tampilkan stok barang menipis"' },
  ]);
  const [input, setInput] = useState('');

  const sendCommand = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    const command = input;
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, context: { user_id: 'bendahara', user_role: 'bendahara' } }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'bot', content: data.summary ?? JSON.stringify(data.data) }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${error}` }]);
    }
  };

  return (
    <div className="fixed right-0 top-0 flex h-full w-96 flex-col bg-white shadow-lg">
      <div className="border-b p-4">
        <h3 className="font-semibold">🤖 Kopdes Copilot</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'ml-8 rounded-lg bg-blue-600 p-3 text-white' : 'mr-8 rounded-lg bg-gray-100 p-3'}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
          placeholder="Ketik perintah..."
          className="w-full rounded border p-2"
        />
        <button onClick={sendCommand} className="w-full rounded bg-blue-600 p-2 text-white">
          Kirim
        </button>
      </div>
    </div>
  );
}
```

---

## 11. Pitching Strategy

### 11.1 Struktur Pitching (5 Menit)

| Waktu | Konten |
|-------|--------|
| **Menit 0–1** | **Hook & Masalah** — "83.362 koperasi berbadan hukum. Hanya 795 — kurang dari 1% — yang aktif mencatat transaksi di SIMKOPDES. Bukan karena tidak ada sistemnya. Tapi karena sistemnya sulit dipakai sehari-hari. Kenalkan Bu Sari, bendahara yang setiap input manual ke SIMKOPDES bisa makan waktu lama." |
| **Menit 1–3** | **Live Demo** — Upload foto struk → auto-fill form (Flow 1); ketik di sidebar "Buatkan laporan penjualan minggu ini" (Flow 2); "Buka rekening bank di BRI" → auto-fill form (Flow 3) |
| **Menit 3–4** | **Dampak Strategis** — "Input nota dari 30 menit jadi 2 menit. Laporan dari 2 jam jadi 10 detik. Jika 1.000 koperasi mulai mencatat transaksi yang selama ini terlewat, volume tercatat di SIMKOPDES bisa naik signifikan — tanpa menciptakan transaksi baru." |
| **Menit 4–5** | **Keunggulan Strategis** — Selaras SPBE & INA Digital; Patuh UU PDP; Inklusif; Skalabel |

### 11.2 Antisipasi Serangan Juri

**Q: "Kenapa tidak bikin aplikasi baru yang lebih bagus?"**

> A: "Kami sengaja tidak bangun dari nol. Sesuai pesan Pak Rama Mamuaya: 'Solusi terbaik menempel pada rel yang ada'. Kami memperkaya SIMKOPDES yang sudah tersedia untuk 83.000+ koperasi, bukan membuat pulau data baru."

**Q: "Apakah ini penyebab utama adopsi rendah (<1%)?"**

> A: "Tidak. Adopsi rendah itu multi-faktor: literasi digital, kebiasaan manual, tidak ada insentif harian, dan UX rumit. Kami tidak mengklaim Copilot menyelesaikan semuanya. Kontribusi kami spesifik: menurunkan friksi input dan navigasi, agar transaksi yang sudah terjadi di lapangan lebih mudah tercatat di SIMKOPDES."

**Q: "Bagaimana kalau AI salah eksekusi?"**

> A: "Kami terapkan 3 lapis guardrails:
> 1. AI hanya boleh isi form, tidak boleh submit final tanpa konfirmasi
> 2. Setiap aksi sensitif butuh approval eksplisit
> 3. Semua aksi dicatat di Cloud Logging untuk traceability
>
> Ini prinsip human-in-the-loop yang ditekankan Pak Irzan."

**Q: "Bagaimana dengan petugas yang tidak punya laptop?"**

> A: "Solusi ini fokus pada tugas administrasi yang memang butuh layar besar — input transaksi, laporan, pengajuan form. Kami tidak memaksa Bu Sari membuka aplikasi berat di HP-nya. Kami memberikan copilot di komputer kantor, agar waktu yang biasa habis untuk input manual bisa dialihkan untuk melayani anggota di lapangan."

### 11.3 Success Metrics

#### MVP Metrics (48 Hours)

| Metrik | Baseline | Target |
|--------|----------|--------|
| Waktu input transaksi (foto nota) | 30 menit | 2 menit |
| Waktu generate laporan | 2 jam | 10 detik |
| Response time AI | — | < 3 detik |
| Success rate command | — | > 90% |

#### Impact Metrics (6 Months — hipotesis, perlu validasi lapangan)

| Kategori | Metrik | Baseline | Target |
|----------|--------|----------|--------|
| Efisiensi | Waktu input transaksi (foto nota) | 30 menit | 2 menit |
| Efisiensi | Waktu generate laporan | 2 jam | 10 detik |
| Efisiensi | Kesalahan pencatatan | Tinggi | Turun 80% |
| Adopsi | % menu SIMKOPDES terpakai (per koperasi pilot) | ~40% | 85% |
| Volume | Transaksi tercatat di SIMKOPDES (koperasi pilot) | Rendah | Naik 3x |
| Kepuasan | NPS petugas koperasi (koperasi pilot) | — | +60 |

> Metrik adopsi nasional (<1% → target nasional) memerlukan program skala besar di luar scope MVP hackathon. Copilot berkontribusi pada **salah satu variabel**: kemudahan penggunaan.

#### Strategic Impact (Irwanda Format)

| Pertanyaan | Jawaban |
|------------|---------|
| Siapa yang terbantu | Petugas koperasi yang sudah punya akses SIMKOPDES (pilot: 1 koperasi → skala: ribuan) |
| Apa yang berubah | Dari "klik menu berulang + input manual" → "perintah natural + foto nota auto-fill" |
| Berapa besar | Input transaksi 30 menit → 2 menit; laporan 2 jam → 10 detik (terukur per koperasi pilot) |
| Dalam berapa lama | 6 bulan implementasi bertahap di koperasi pilot |
| Dampak nasional | Jika friksi turun → lebih banyak transaksi lapangan tercatat → volume usaha tercatat di SIMKOPDES naik |

---

*End of Document*
