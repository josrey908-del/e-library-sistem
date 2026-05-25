/**
 * Utilidades para emparejar portadas con el título/autor correctos.
 */

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTitle(title: string): string {
  const t = normalizeText(title);
  const cut = t.split(/\s+(or|y|de la|del|the)\s+/)[0];
  return cut.length > 4 ? cut : t;
}

export function authorSurname(author: string): string {
  const parts = normalizeText(author).split(' ').filter(Boolean);
  return parts[parts.length - 1] ?? author;
}

export function titleSimilarity(want: string, candidate: string): number {
  const a = normalizeTitle(want);
  const b = normalizeTitle(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const aWords = new Set(a.split(' ').filter((w) => w.length > 2));
  const bWords = new Set(b.split(' ').filter((w) => w.length > 2));
  if (!aWords.size || !bWords.size) return 0;

  let overlap = 0;
  Array.from(aWords).forEach((w) => {
    if (bWords.has(w)) overlap++;
  });
  return overlap / Math.max(aWords.size, bWords.size);
}

export function authorSimilarity(want: string, candidates: string[]): number {
  const wantNorm = normalizeText(want);
  const wantLast = authorSurname(want);
  let best = 0;
  for (const c of candidates) {
    const cn = normalizeText(c);
    if (cn === wantNorm) return 1;
    if (cn.includes(wantLast) || wantNorm.includes(authorSurname(c))) best = Math.max(best, 0.8);
    if (wantNorm.includes(cn) || cn.includes(wantNorm)) best = Math.max(best, 0.7);
  }
  return best;
}

/** Puntuación mínima para aceptar una portada de Open Library / Google */
export const MIN_COVER_MATCH_SCORE = 0.55;

export function combinedMatchScore(
  title: string,
  author: string,
  candidateTitle: string,
  candidateAuthors: string[],
): number {
  const ts = titleSimilarity(title, candidateTitle);
  const as = authorSimilarity(author, candidateAuthors);
  return ts * 0.55 + as * 0.45;
}
