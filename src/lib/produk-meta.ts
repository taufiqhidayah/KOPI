export type ProdukMeta = {
  kategori?: string;
  jenis_barang?: string;
  potensi_desa?: string;
  penyedia?: string;
};

const META_PREFIX = "@@PRODUK_META@@";

export function encodeProdukMetaKeterangan(meta: ProdukMeta, notes = ""): string {
  const payload: ProdukMeta = {};
  if (meta.kategori?.trim()) payload.kategori = meta.kategori.trim();
  if (meta.jenis_barang?.trim()) payload.jenis_barang = meta.jenis_barang.trim();
  if (meta.potensi_desa?.trim()) payload.potensi_desa = meta.potensi_desa.trim();
  if (meta.penyedia?.trim()) payload.penyedia = meta.penyedia.trim();

  const hasMeta = Object.keys(payload).length > 0;
  const metaPart = hasMeta ? `${META_PREFIX}${JSON.stringify(payload)}` : "";
  const notePart = notes.trim();

  if (metaPart && notePart) return `${metaPart} | ${notePart}`.slice(0, 1000);
  return (metaPart || notePart).slice(0, 1000);
}

export function decodeProdukMetaKeterangan(keterangan: string | null | undefined): ProdukMeta {
  if (!keterangan) return {};

  const match = keterangan.match(/@@PRODUK_META@@(\{[^}]+\})/);
  if (!match) return {};

  try {
    return JSON.parse(match[1]) as ProdukMeta;
  } catch {
    return {};
  }
}

export function parseProdukMetaFromText(text: string): ProdukMeta {
  const meta: ProdukMeta = {};
  const lower = text.toLowerCase();

  const patterns: { key: keyof ProdukMeta; regex: RegExp }[] = [
    {
      key: "kategori",
      regex: /(?:kategori(?:\s+produk)?)\s*[:\-]?\s*([\w\s]+?)(?=\s+(?:jenis|potensi|penyedia|pemasok|supplier)\b|$)/i,
    },
    {
      key: "jenis_barang",
      regex: /(?:jenis(?:\s+barang)?)\s*[:\-]?\s*([\w\s]+?)(?=\s+(?:kategori|potensi|penyedia|pemasok|supplier)\b|$)/i,
    },
    {
      key: "potensi_desa",
      regex: /(?:potensi(?:\s+desa)?)\s*[:\-]?\s*([\w\s]+?)(?=\s+(?:kategori|jenis|penyedia|pemasok|supplier)\b|$)/i,
    },
    {
      key: "penyedia",
      regex: /(?:penyedia|pemasok|supplier)\s*[:\-]?\s*([^,.\n]+?)(?=\s+(?:kategori|jenis|potensi)\b|$)/i,
    },
  ];

  for (const { key, regex } of patterns) {
    const m = text.match(regex);
    if (m?.[1]) meta[key] = m[1].trim();
  }

  const dariMatch = text.match(/dari\s+(?:supplier\s+)?([^,.\n]+)/i);
  if (dariMatch?.[1] && !meta.penyedia) {
    meta.penyedia = dariMatch[1].trim();
  }

  if (/lewati\s+(kategori|penyedia|meta)/i.test(lower)) {
    return meta;
  }

  return meta;
}

export function inferProdukMeta(namaProduk: string, unit?: string): ProdukMeta {
  const n = namaProduk.toLowerCase();
  const meta: ProdukMeta = {};

  if (/beras|gula|tepung|minyak|garam|mie|indomie/.test(n)) {
    meta.kategori = "Sembako";
    meta.jenis_barang = "Makanan";
    meta.potensi_desa = "Pertanian";
  } else if (/aqua|air mineral|teh|kopi|susu|minuman/.test(n)) {
    meta.kategori = "Minuman";
    meta.jenis_barang = "Minuman";
    meta.potensi_desa = "Industri Rumahan";
  } else if (/shampo|sabun|detergen|pembersih/.test(n)) {
    meta.kategori = "Kebutuhan Rumah Tangga";
    meta.jenis_barang = "Perawatan";
    meta.potensi_desa = "Industri Rumahan";
  } else if (/gas|elpig|elpiji|lpg|tabung/.test(n)) {
    meta.kategori = "Kebutuhan Rumah Tangga";
    meta.jenis_barang = "Energi";
    meta.potensi_desa = "Perdagangan";
  } else if (/galon/.test(n) || unit === "galon") {
    meta.kategori = "Minuman";
    meta.jenis_barang = "Air Minum";
    meta.potensi_desa = "Industri Rumahan";
  } else {
    meta.kategori = "Barang Lainnya";
    meta.jenis_barang = "Umum";
    meta.potensi_desa = "Potensi Lokal";
  }

  return meta;
}

export function mergeProdukMeta(base: ProdukMeta, patch: ProdukMeta): ProdukMeta {
  return {
    kategori: patch.kategori?.trim() || base.kategori,
    jenis_barang: patch.jenis_barang?.trim() || base.jenis_barang,
    potensi_desa: patch.potensi_desa?.trim() || base.potensi_desa,
    penyedia: patch.penyedia?.trim() || base.penyedia,
  };
}

export function resolveProdukMeta(
  namaProduk: string,
  unit?: string,
  explicit?: ProdukMeta,
): ProdukMeta {
  const inferred = inferProdukMeta(namaProduk, unit);
  return mergeProdukMeta(inferred, explicit ?? {});
}

export function isProdukMetaComplete(meta: ProdukMeta): boolean {
  return Boolean(meta.kategori && meta.jenis_barang && meta.potensi_desa);
}

export function formatProdukMetaSummary(meta: ProdukMeta): string {
  const parts = [
    meta.kategori ? `Kategori ${meta.kategori}` : null,
    meta.jenis_barang ? `Jenis ${meta.jenis_barang}` : null,
    meta.potensi_desa ? `Potensi ${meta.potensi_desa}` : null,
    meta.penyedia ? `Penyedia ${meta.penyedia}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "";
}
