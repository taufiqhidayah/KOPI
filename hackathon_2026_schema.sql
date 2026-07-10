--
-- PostgreSQL database dump
--

\restrict ld1hw7RFX5vkMHI0cXuhF5HuR7p6cLxo9VMLVBdITSJwVShtbpJHoFxlwtlSi7L

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: akun_bank_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.akun_bank_koperasi (
    akun_bank_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nama_rekening text,
    nama_bank text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.akun_bank_koperasi OWNER TO hackathon_2026;

--
-- Name: anggota_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.anggota_koperasi (
    anggota_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nama text,
    nik text,
    kode_wilayah text,
    jenis_kelamin text,
    status_keanggotaan text,
    tanggal_terdaftar date,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone,
    file_ktp text,
    status_akun text,
    pekerjaan text
);


ALTER TABLE public.anggota_koperasi OWNER TO hackathon_2026;

--
-- Name: aset_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.aset_koperasi (
    aset_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nama_aset text,
    tipe_aset text,
    status text,
    progres_pembangunan numeric,
    foto_utama text,
    foto_sekunder text,
    dokumen_utama text,
    dokumen_sekunder text,
    dokumen_lainnya text,
    luas_lahan numeric,
    panjang_lahan numeric,
    lebar_lahan numeric,
    akses_jalan text,
    koordinat_dibulatkan text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.aset_koperasi OWNER TO hackathon_2026;

--
-- Name: barang_keluar_produk; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.barang_keluar_produk (
    __row_id integer NOT NULL,
    transaksi_sample_id text NOT NULL,
    produk_sample_id text NOT NULL,
    koperasi_ref text NOT NULL,
    kode_barcode text,
    tanggal_keluar timestamp without time zone,
    status text,
    nama_produk text,
    nama_tampilan text,
    jumlah_keluar numeric,
    harga numeric,
    total_nilai numeric,
    status_transaksi text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.barang_keluar_produk OWNER TO hackathon_2026;

--
-- Name: barang_masuk_produk; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.barang_masuk_produk (
    barang_masuk_ref text NOT NULL,
    produk_sample_id text NOT NULL,
    koperasi_ref text NOT NULL,
    kode_barcode text,
    nama_produk text,
    nama_tampilan text,
    jumlah_masuk numeric,
    jumlah_tersedia numeric,
    harga_beli numeric,
    harga_jual numeric,
    total_biaya numeric,
    keterangan text,
    status text,
    tanggal_masuk timestamp without time zone,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.barang_masuk_produk OWNER TO hackathon_2026;

--
-- Name: dokumen_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.dokumen_koperasi (
    dokumen_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    jenis_dokumen_ref text NOT NULL,
    nomor text,
    tanggal_berlaku date,
    tanggal_kadaluarsa date,
    alamat_pada_dokumen text,
    unggahan_dokumen text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.dokumen_koperasi OWNER TO hackathon_2026;

--
-- Name: gerai_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.gerai_koperasi (
    gerai_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    jenis_gerai_ref text NOT NULL,
    status_gerai text,
    foto_gerai text,
    pengisi text,
    akses_internet text,
    akses_listrik text,
    status_kepemilikan_aset_gerai text,
    status_pemanfaatan_aset_gerai text,
    sumber_air_bersih text,
    jenis_bangunan text,
    koordinat_dibulatkan text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.gerai_koperasi OWNER TO hackathon_2026;

--
-- Name: inventaris_produk; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.inventaris_produk (
    inventaris_ref text NOT NULL,
    produk_sample_id text NOT NULL,
    koperasi_ref text NOT NULL,
    nama_produk text,
    stok numeric,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone,
    kode_barcode text
);


ALTER TABLE public.inventaris_produk OWNER TO hackathon_2026;

--
-- Name: karyawan_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.karyawan_koperasi (
    karyawan_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nama text,
    jabatan text,
    nomor_hp_karyawan text,
    jenis_kelamin text,
    nik text,
    email text,
    status_karyawan text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.karyawan_koperasi OWNER TO hackathon_2026;

--
-- Name: kbli_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.kbli_koperasi (
    __row_id integer NOT NULL,
    koperasi_ref text NOT NULL,
    kode_kbli text,
    nama_kbli text,
    tipe_izin_usaha text,
    tahun_kbli smallint,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.kbli_koperasi OWNER TO hackathon_2026;

--
-- Name: modal_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.modal_koperasi (
    modal_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nomor_perjanjian text,
    tipe_sumber text,
    nama_sumber text,
    tipe_modal text,
    jumlah numeric,
    tanggal_diterima date,
    file_perjanjian text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.modal_koperasi OWNER TO hackathon_2026;

--
-- Name: pengajuan_domain; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.pengajuan_domain (
    domain_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    domain_koperasi text,
    status_verifikasi text,
    status_domain text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.pengajuan_domain OWNER TO hackathon_2026;

--
-- Name: pengajuan_kemitraan; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.pengajuan_kemitraan (
    pengajuan_kemitraan_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nik text,
    penanggung_jawab text,
    nomor_penanggung_jawab text,
    status_permohonan text,
    bisnis_kemitraan text,
    paket_kemitraan text,
    formulir_permohonan text,
    ktp_penanggung_jawab text,
    tipe_kemitraan text,
    catatan text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.pengajuan_kemitraan OWNER TO hackathon_2026;

--
-- Name: pengajuan_pembiayaan; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.pengajuan_pembiayaan (
    pengajuan_pembiayaan_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nik text,
    penanggung_jawab text,
    nomor_penanggung_jawab text,
    status_permohonan text,
    formulir_permohonan_pembiayaan text,
    nominal_permohonan real,
    tenor integer,
    tujuan_permohonan text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.pengajuan_pembiayaan OWNER TO hackathon_2026;

--
-- Name: pengajuan_rekening_bank; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.pengajuan_rekening_bank (
    pengajuan_rekening_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nik text,
    penanggung_jawab text,
    nomor_penanggung_jawab text,
    status text,
    kode_bank text,
    nama_bank text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.pengajuan_rekening_bank OWNER TO hackathon_2026;

--
-- Name: pengurus_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.pengurus_koperasi (
    pengurus_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    nama text,
    jabatan text,
    status text,
    no_hp text,
    nik text,
    jenis_kelamin text,
    foto_profil text,
    email text,
    alamat text,
    kode_pos text,
    tanggal_lahir text,
    status_pendidikan text,
    periode_mulai text,
    periode_selesai date,
    file_ktp text,
    sumber_data text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.pengurus_koperasi OWNER TO hackathon_2026;

--
-- Name: produk_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.produk_koperasi (
    produk_sample_id text NOT NULL,
    koperasi_ref text NOT NULL,
    kode_barcode text,
    nama_produk text,
    unit text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.produk_koperasi OWNER TO hackathon_2026;

--
-- Name: profil_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.profil_koperasi (
    koperasi_ref text NOT NULL,
    nama_koperasi text,
    status_registrasi text,
    bentuk_koperasi text,
    kategori_usaha text,
    nik_koperasi text,
    alamat_lengkap text,
    kode_pos text,
    koordinat_dibulatkan text,
    modal_awal text,
    sumber_persetujuan text,
    tentang_koperasi text,
    pola_pengelolaan text,
    metode_pengisian text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.profil_koperasi OWNER TO hackathon_2026;

--
-- Name: rat_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.rat_koperasi (
    rat_sample_id text NOT NULL,
    koperasi_ref text NOT NULL,
    jenis_sektor_koperasi text,
    urutan_rat text,
    tahun_buku smallint,
    tahun_rencana_kerja smallint,
    tahun_rencana_anggaran smallint,
    tanggal_rat date,
    jumlah_peserta_rat integer,
    status_rat text,
    tahap_rat text,
    laporan_posisi_keuangan text,
    laporan_hasil_usaha text,
    rapb_posisi_keuangan text,
    rapb_hasil_usaha text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.rat_koperasi OWNER TO hackathon_2026;

--
-- Name: referensi_dokumen_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.referensi_dokumen_koperasi (
    jenis_dokumen_ref text NOT NULL,
    nama_dokumen text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.referensi_dokumen_koperasi OWNER TO hackathon_2026;

--
-- Name: referensi_gerai_koperasi; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.referensi_gerai_koperasi (
    jenis_gerai_ref text NOT NULL,
    nama_jenis_gerai text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.referensi_gerai_koperasi OWNER TO hackathon_2026;

--
-- Name: referensi_komoditas_desa; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.referensi_komoditas_desa (
    komoditas_ref text NOT NULL,
    kode_wilayah text NOT NULL,
    nama_komoditas text,
    luas_area text,
    volume text,
    jumlah_sdm_terlibat real,
    nilai_potensi_desa bigint,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.referensi_komoditas_desa OWNER TO hackathon_2026;

--
-- Name: referensi_koperasi_wilayah; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.referensi_koperasi_wilayah (
    koperasi_ref text CONSTRAINT referensi_koperasi_aktif_koperasi_ref_not_null NOT NULL,
    kode_wilayah text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.referensi_koperasi_wilayah OWNER TO hackathon_2026;

--
-- Name: referensi_profil_desa; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.referensi_profil_desa (
    kode_wilayah text NOT NULL,
    tahun_populasi integer,
    total_penduduk integer,
    penduduk_laki_laki integer,
    penduduk_perempuan integer,
    tahun_pendanaan integer,
    anggaran_dana_desa numeric,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.referensi_profil_desa OWNER TO hackathon_2026;

--
-- Name: referensi_wilayah; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.referensi_wilayah (
    provinsi text,
    kab_kota text,
    kecamatan text,
    desa_kelurahan text,
    kode_wilayah text NOT NULL,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.referensi_wilayah OWNER TO hackathon_2026;

--
-- Name: simpanan_anggota; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.simpanan_anggota (
    simpanan_ref text NOT NULL,
    koperasi_ref text NOT NULL,
    anggota_ref text NOT NULL,
    periode_pembayaran text,
    jumlah_simpanan numeric,
    status text,
    dibuat_pada timestamp without time zone,
    dibayar_pada timestamp without time zone
);


ALTER TABLE public.simpanan_anggota OWNER TO hackathon_2026;

--
-- Name: transaksi_penjualan; Type: TABLE; Schema: public; Owner: hackathon_2026
--

CREATE TABLE public.transaksi_penjualan (
    transaksi_sample_id text NOT NULL,
    koperasi_ref text NOT NULL,
    nama_pelanggan text,
    tanggal_dibuat timestamp without time zone,
    total_pembayaran numeric,
    status_transaksi text,
    metode_pembayaran text,
    dibuat_pada timestamp without time zone,
    diperbarui_pada timestamp without time zone
);


ALTER TABLE public.transaksi_penjualan OWNER TO hackathon_2026;

--
-- Name: akun_bank_koperasi pk_akun_bank_koperasi_3314f99b; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.akun_bank_koperasi
    ADD CONSTRAINT pk_akun_bank_koperasi_3314f99b PRIMARY KEY (akun_bank_ref);


--
-- Name: anggota_koperasi pk_anggota_koperasi_4fe6109d; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.anggota_koperasi
    ADD CONSTRAINT pk_anggota_koperasi_4fe6109d PRIMARY KEY (anggota_ref);


--
-- Name: aset_koperasi pk_aset_koperasi_b272e8a6; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.aset_koperasi
    ADD CONSTRAINT pk_aset_koperasi_b272e8a6 PRIMARY KEY (aset_ref);


--
-- Name: barang_keluar_produk pk_barang_keluar_produk_d5471b08; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.barang_keluar_produk
    ADD CONSTRAINT pk_barang_keluar_produk_d5471b08 PRIMARY KEY (__row_id);


--
-- Name: barang_masuk_produk pk_barang_masuk_produk_018e5056; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.barang_masuk_produk
    ADD CONSTRAINT pk_barang_masuk_produk_018e5056 PRIMARY KEY (barang_masuk_ref);


--
-- Name: dokumen_koperasi pk_dokumen_koperasi_f5f81f61; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.dokumen_koperasi
    ADD CONSTRAINT pk_dokumen_koperasi_f5f81f61 PRIMARY KEY (dokumen_ref);


--
-- Name: gerai_koperasi pk_gerai_koperasi_2aac4c3c; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.gerai_koperasi
    ADD CONSTRAINT pk_gerai_koperasi_2aac4c3c PRIMARY KEY (gerai_ref);


--
-- Name: inventaris_produk pk_inventaris_produk_5920d0e6; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.inventaris_produk
    ADD CONSTRAINT pk_inventaris_produk_5920d0e6 PRIMARY KEY (inventaris_ref);


--
-- Name: karyawan_koperasi pk_karyawan_koperasi_bffc535e; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.karyawan_koperasi
    ADD CONSTRAINT pk_karyawan_koperasi_bffc535e PRIMARY KEY (karyawan_ref);


--
-- Name: kbli_koperasi pk_kbli_koperasi_55bee0fc; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.kbli_koperasi
    ADD CONSTRAINT pk_kbli_koperasi_55bee0fc PRIMARY KEY (__row_id);


--
-- Name: modal_koperasi pk_modal_koperasi_a1180c73; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.modal_koperasi
    ADD CONSTRAINT pk_modal_koperasi_a1180c73 PRIMARY KEY (modal_ref);


--
-- Name: pengajuan_domain pk_pengajuan_domain_6763303c; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_domain
    ADD CONSTRAINT pk_pengajuan_domain_6763303c PRIMARY KEY (domain_ref);


--
-- Name: pengajuan_kemitraan pk_pengajuan_kemitraan_625d306d; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_kemitraan
    ADD CONSTRAINT pk_pengajuan_kemitraan_625d306d PRIMARY KEY (pengajuan_kemitraan_ref);


--
-- Name: pengajuan_pembiayaan pk_pengajuan_pembiayaan_28483833; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_pembiayaan
    ADD CONSTRAINT pk_pengajuan_pembiayaan_28483833 PRIMARY KEY (pengajuan_pembiayaan_ref);


--
-- Name: pengajuan_rekening_bank pk_pengajuan_rekening_bank_93255ee4; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_rekening_bank
    ADD CONSTRAINT pk_pengajuan_rekening_bank_93255ee4 PRIMARY KEY (pengajuan_rekening_ref);


--
-- Name: pengurus_koperasi pk_pengurus_koperasi_5b9a4e2c; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengurus_koperasi
    ADD CONSTRAINT pk_pengurus_koperasi_5b9a4e2c PRIMARY KEY (pengurus_ref);


--
-- Name: produk_koperasi pk_produk_koperasi_4e63ea77; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.produk_koperasi
    ADD CONSTRAINT pk_produk_koperasi_4e63ea77 PRIMARY KEY (produk_sample_id);


--
-- Name: profil_koperasi pk_profil_koperasi_26375302; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.profil_koperasi
    ADD CONSTRAINT pk_profil_koperasi_26375302 PRIMARY KEY (koperasi_ref);


--
-- Name: rat_koperasi pk_rat_koperasi_6272548f; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.rat_koperasi
    ADD CONSTRAINT pk_rat_koperasi_6272548f PRIMARY KEY (rat_sample_id);


--
-- Name: referensi_dokumen_koperasi pk_referensi_dokumen_koperasi_4ea58f34; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_dokumen_koperasi
    ADD CONSTRAINT pk_referensi_dokumen_koperasi_4ea58f34 PRIMARY KEY (jenis_dokumen_ref);


--
-- Name: referensi_gerai_koperasi pk_referensi_gerai_koperasi_e9d11ded; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_gerai_koperasi
    ADD CONSTRAINT pk_referensi_gerai_koperasi_e9d11ded PRIMARY KEY (jenis_gerai_ref);


--
-- Name: referensi_komoditas_desa pk_referensi_komoditas_desa_fdbdbdd4; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_komoditas_desa
    ADD CONSTRAINT pk_referensi_komoditas_desa_fdbdbdd4 PRIMARY KEY (komoditas_ref);


--
-- Name: referensi_koperasi_wilayah pk_referensi_koperasi_aktif_778fe8ef; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_koperasi_wilayah
    ADD CONSTRAINT pk_referensi_koperasi_aktif_778fe8ef PRIMARY KEY (koperasi_ref);


--
-- Name: referensi_profil_desa pk_referensi_profil_desa_ed7fcc83; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_profil_desa
    ADD CONSTRAINT pk_referensi_profil_desa_ed7fcc83 PRIMARY KEY (kode_wilayah);


--
-- Name: referensi_wilayah pk_referensi_wilayah_57bb55d7; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_wilayah
    ADD CONSTRAINT pk_referensi_wilayah_57bb55d7 PRIMARY KEY (kode_wilayah);


--
-- Name: simpanan_anggota pk_simpanan_anggota_a226bf54; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.simpanan_anggota
    ADD CONSTRAINT pk_simpanan_anggota_a226bf54 PRIMARY KEY (simpanan_ref);


--
-- Name: transaksi_penjualan pk_transaksi_penjualan_2711f8e1; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.transaksi_penjualan
    ADD CONSTRAINT pk_transaksi_penjualan_2711f8e1 PRIMARY KEY (transaksi_sample_id);


--
-- Name: anggota_koperasi uq_anggota_koperasi_anggota_ref; Type: CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.anggota_koperasi
    ADD CONSTRAINT uq_anggota_koperasi_anggota_ref UNIQUE (anggota_ref);


--
-- Name: akun_bank_koperasi fk_akun_bank_koperasi_koperasi_ref_b79a5726; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.akun_bank_koperasi
    ADD CONSTRAINT fk_akun_bank_koperasi_koperasi_ref_b79a5726 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: anggota_koperasi fk_anggota_koperasi_kode_wilayah_96a41cef; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.anggota_koperasi
    ADD CONSTRAINT fk_anggota_koperasi_kode_wilayah_96a41cef FOREIGN KEY (kode_wilayah) REFERENCES public.referensi_wilayah(kode_wilayah);


--
-- Name: anggota_koperasi fk_anggota_koperasi_koperasi_ref_b8176ae0; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.anggota_koperasi
    ADD CONSTRAINT fk_anggota_koperasi_koperasi_ref_b8176ae0 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: aset_koperasi fk_aset_koperasi_koperasi_ref_2ff5abd1; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.aset_koperasi
    ADD CONSTRAINT fk_aset_koperasi_koperasi_ref_2ff5abd1 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: barang_keluar_produk fk_barang_keluar_produk_koperasi_ref_6dbc1a6c; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.barang_keluar_produk
    ADD CONSTRAINT fk_barang_keluar_produk_koperasi_ref_6dbc1a6c FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: barang_keluar_produk fk_barang_keluar_produk_produk_sample_id_05348b01; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.barang_keluar_produk
    ADD CONSTRAINT fk_barang_keluar_produk_produk_sample_id_05348b01 FOREIGN KEY (produk_sample_id) REFERENCES public.produk_koperasi(produk_sample_id);


--
-- Name: barang_keluar_produk fk_barang_keluar_produk_transaksi_sample_id_05bcac05; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.barang_keluar_produk
    ADD CONSTRAINT fk_barang_keluar_produk_transaksi_sample_id_05bcac05 FOREIGN KEY (transaksi_sample_id) REFERENCES public.transaksi_penjualan(transaksi_sample_id);


--
-- Name: barang_masuk_produk fk_barang_masuk_produk_koperasi_ref_fbd3b8a5; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.barang_masuk_produk
    ADD CONSTRAINT fk_barang_masuk_produk_koperasi_ref_fbd3b8a5 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: barang_masuk_produk fk_barang_masuk_produk_produk_sample_id_491ee0a5; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.barang_masuk_produk
    ADD CONSTRAINT fk_barang_masuk_produk_produk_sample_id_491ee0a5 FOREIGN KEY (produk_sample_id) REFERENCES public.produk_koperasi(produk_sample_id);


--
-- Name: dokumen_koperasi fk_dokumen_koperasi_jenis_dokumen_ref_5df8ee5b; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.dokumen_koperasi
    ADD CONSTRAINT fk_dokumen_koperasi_jenis_dokumen_ref_5df8ee5b FOREIGN KEY (jenis_dokumen_ref) REFERENCES public.referensi_dokumen_koperasi(jenis_dokumen_ref);


--
-- Name: dokumen_koperasi fk_dokumen_koperasi_koperasi_ref_22ac9c60; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.dokumen_koperasi
    ADD CONSTRAINT fk_dokumen_koperasi_koperasi_ref_22ac9c60 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: gerai_koperasi fk_gerai_koperasi_jenis_gerai_ref_57ac7e95; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.gerai_koperasi
    ADD CONSTRAINT fk_gerai_koperasi_jenis_gerai_ref_57ac7e95 FOREIGN KEY (jenis_gerai_ref) REFERENCES public.referensi_gerai_koperasi(jenis_gerai_ref);


--
-- Name: gerai_koperasi fk_gerai_koperasi_koperasi_ref_9ea0835d; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.gerai_koperasi
    ADD CONSTRAINT fk_gerai_koperasi_koperasi_ref_9ea0835d FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: inventaris_produk fk_inventaris_produk_koperasi_ref_934f6014; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.inventaris_produk
    ADD CONSTRAINT fk_inventaris_produk_koperasi_ref_934f6014 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: inventaris_produk fk_inventaris_produk_produk_sample_id_e49cff5a; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.inventaris_produk
    ADD CONSTRAINT fk_inventaris_produk_produk_sample_id_e49cff5a FOREIGN KEY (produk_sample_id) REFERENCES public.produk_koperasi(produk_sample_id);


--
-- Name: karyawan_koperasi fk_karyawan_koperasi_koperasi_ref_4e47588f; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.karyawan_koperasi
    ADD CONSTRAINT fk_karyawan_koperasi_koperasi_ref_4e47588f FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: kbli_koperasi fk_kbli_koperasi_koperasi_ref_659f6886; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.kbli_koperasi
    ADD CONSTRAINT fk_kbli_koperasi_koperasi_ref_659f6886 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: modal_koperasi fk_modal_koperasi_koperasi_ref_1bb5cd3d; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.modal_koperasi
    ADD CONSTRAINT fk_modal_koperasi_koperasi_ref_1bb5cd3d FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: pengajuan_domain fk_pengajuan_domain_koperasi_ref_980169cd; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_domain
    ADD CONSTRAINT fk_pengajuan_domain_koperasi_ref_980169cd FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: pengajuan_kemitraan fk_pengajuan_kemitraan_koperasi_ref_33626c2e; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_kemitraan
    ADD CONSTRAINT fk_pengajuan_kemitraan_koperasi_ref_33626c2e FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: pengajuan_pembiayaan fk_pengajuan_pembiayaan_koperasi_ref_cb273759; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_pembiayaan
    ADD CONSTRAINT fk_pengajuan_pembiayaan_koperasi_ref_cb273759 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: pengajuan_rekening_bank fk_pengajuan_rekening_bank_koperasi_ref_fd7eef0a; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengajuan_rekening_bank
    ADD CONSTRAINT fk_pengajuan_rekening_bank_koperasi_ref_fd7eef0a FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: pengurus_koperasi fk_pengurus_koperasi_koperasi_ref_762eb9ec; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.pengurus_koperasi
    ADD CONSTRAINT fk_pengurus_koperasi_koperasi_ref_762eb9ec FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: produk_koperasi fk_produk_koperasi_koperasi_ref_5e27414b; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.produk_koperasi
    ADD CONSTRAINT fk_produk_koperasi_koperasi_ref_5e27414b FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: profil_koperasi fk_profil_koperasi_koperasi_ref_2fda584b; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.profil_koperasi
    ADD CONSTRAINT fk_profil_koperasi_koperasi_ref_2fda584b FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: rat_koperasi fk_rat_koperasi_koperasi_ref_7258ec7e; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.rat_koperasi
    ADD CONSTRAINT fk_rat_koperasi_koperasi_ref_7258ec7e FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: referensi_komoditas_desa fk_referensi_komoditas_desa_kode_wilayah_ba3b0dad; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_komoditas_desa
    ADD CONSTRAINT fk_referensi_komoditas_desa_kode_wilayah_ba3b0dad FOREIGN KEY (kode_wilayah) REFERENCES public.referensi_wilayah(kode_wilayah);


--
-- Name: referensi_koperasi_wilayah fk_referensi_koperasi_aktif_kode_wilayah_93c6fdcd; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_koperasi_wilayah
    ADD CONSTRAINT fk_referensi_koperasi_aktif_kode_wilayah_93c6fdcd FOREIGN KEY (kode_wilayah) REFERENCES public.referensi_wilayah(kode_wilayah);


--
-- Name: referensi_profil_desa fk_referensi_profil_desa_kode_wilayah_c5f8bf81; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.referensi_profil_desa
    ADD CONSTRAINT fk_referensi_profil_desa_kode_wilayah_c5f8bf81 FOREIGN KEY (kode_wilayah) REFERENCES public.referensi_wilayah(kode_wilayah);


--
-- Name: simpanan_anggota fk_simpanan_anggota_anggota_koperasi; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.simpanan_anggota
    ADD CONSTRAINT fk_simpanan_anggota_anggota_koperasi FOREIGN KEY (anggota_ref) REFERENCES public.anggota_koperasi(anggota_ref) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: simpanan_anggota fk_simpanan_anggota_koperasi_ref_c7fd2f70; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.simpanan_anggota
    ADD CONSTRAINT fk_simpanan_anggota_koperasi_ref_c7fd2f70 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: transaksi_penjualan fk_transaksi_penjualan_koperasi_ref_f99204f5; Type: FK CONSTRAINT; Schema: public; Owner: hackathon_2026
--

ALTER TABLE ONLY public.transaksi_penjualan
    ADD CONSTRAINT fk_transaksi_penjualan_koperasi_ref_f99204f5 FOREIGN KEY (koperasi_ref) REFERENCES public.referensi_koperasi_wilayah(koperasi_ref);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO cloudsqlsuperuser;
GRANT USAGE ON SCHEMA public TO hackathon_kemenkop_2026;


--
-- Name: TABLE akun_bank_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.akun_bank_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.akun_bank_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE anggota_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.anggota_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.anggota_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE aset_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.aset_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.aset_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE barang_keluar_produk; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.barang_keluar_produk TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.barang_keluar_produk TO hackathon_participant_2026;


--
-- Name: TABLE barang_masuk_produk; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.barang_masuk_produk TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.barang_masuk_produk TO hackathon_participant_2026;


--
-- Name: TABLE dokumen_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.dokumen_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.dokumen_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE gerai_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.gerai_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.gerai_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE inventaris_produk; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.inventaris_produk TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.inventaris_produk TO hackathon_participant_2026;


--
-- Name: TABLE karyawan_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.karyawan_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.karyawan_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE kbli_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.kbli_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.kbli_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE modal_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.modal_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.modal_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE pengajuan_domain; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.pengajuan_domain TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.pengajuan_domain TO hackathon_participant_2026;


--
-- Name: TABLE pengajuan_kemitraan; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.pengajuan_kemitraan TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.pengajuan_kemitraan TO hackathon_participant_2026;


--
-- Name: TABLE pengajuan_pembiayaan; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.pengajuan_pembiayaan TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.pengajuan_pembiayaan TO hackathon_participant_2026;


--
-- Name: TABLE pengajuan_rekening_bank; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.pengajuan_rekening_bank TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.pengajuan_rekening_bank TO hackathon_participant_2026;


--
-- Name: TABLE pengurus_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.pengurus_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.pengurus_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE produk_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.produk_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.produk_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE profil_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.profil_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.profil_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE rat_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.rat_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.rat_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE referensi_dokumen_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.referensi_dokumen_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.referensi_dokumen_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE referensi_gerai_koperasi; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.referensi_gerai_koperasi TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.referensi_gerai_koperasi TO hackathon_participant_2026;


--
-- Name: TABLE referensi_komoditas_desa; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.referensi_komoditas_desa TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.referensi_komoditas_desa TO hackathon_participant_2026;


--
-- Name: TABLE referensi_koperasi_wilayah; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.referensi_koperasi_wilayah TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.referensi_koperasi_wilayah TO hackathon_participant_2026;


--
-- Name: TABLE referensi_profil_desa; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.referensi_profil_desa TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.referensi_profil_desa TO hackathon_participant_2026;


--
-- Name: TABLE referensi_wilayah; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.referensi_wilayah TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.referensi_wilayah TO hackathon_participant_2026;


--
-- Name: TABLE simpanan_anggota; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.simpanan_anggota TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.simpanan_anggota TO hackathon_participant_2026;


--
-- Name: TABLE transaksi_penjualan; Type: ACL; Schema: public; Owner: hackathon_2026
--

GRANT SELECT ON TABLE public.transaksi_penjualan TO hackathon_kemenkop_2026;
GRANT SELECT ON TABLE public.transaksi_penjualan TO hackathon_participant_2026;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: hackathon_participant_2026
--

ALTER DEFAULT PRIVILEGES FOR ROLE hackathon_participant_2026 IN SCHEMA public GRANT ALL ON SEQUENCES TO hackathon_participant_2026;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: hackathon_2026
--

ALTER DEFAULT PRIVILEGES FOR ROLE hackathon_2026 IN SCHEMA public GRANT SELECT ON TABLES TO hackathon_participant_2026;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: hackathon_participant_2026
--

ALTER DEFAULT PRIVILEGES FOR ROLE hackathon_participant_2026 IN SCHEMA public GRANT ALL ON TABLES TO hackathon_participant_2026;


--
-- PostgreSQL database dump complete
--

\unrestrict ld1hw7RFX5vkMHI0cXuhF5HuR7p6cLxo9VMLVBdITSJwVShtbpJHoFxlwtlSi7L

