export type KoperasiProduct = {
  produk_sample_id: string;
  nama_produk: string | null;
  unit: string | null;
};

export function scoreProductMatch(query: string, productName: string): number {
  const q = query.toLowerCase().replace(/permium/g, "premium");
  const name = productName.toLowerCase();
  if (name === q) return 100;
  if (name.includes(q) || q.includes(name)) return 80;

  const qTokens = q.split(/\s+/).filter((t) => t.length > 2);
  const matched = qTokens.filter((t) => name.includes(t)).length;
  if (matched === 0) return 0;
  return (matched / qTokens.length) * 70;
}

export function findBestProduct(
  query: string,
  products: KoperasiProduct[],
): { best: KoperasiProduct | null; candidates: KoperasiProduct[] } {
  const scored = products
    .map((p) => ({
      product: p,
      score: scoreProductMatch(query, p.nama_produk ?? ""),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return { best: null, candidates: [] };

  const top = scored[0];
  const candidates = scored.filter((s) => s.score >= top.score - 15).map((s) => s.product);

  return {
    best: top.score >= 40 ? top.product : null,
    candidates,
  };
}
