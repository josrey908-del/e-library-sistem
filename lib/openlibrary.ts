import {
  combinedMatchScore,
  MIN_COVER_MATCH_SCORE,
} from './cover-matcher';

/** Portada por título (legacy; preferir searchOpenLibraryCover). */
export function openLibraryCoverUrl(title: string, author?: string): string {
  const query = author ? `${title} ${author}` : title;
  return `https://covers.openlibrary.org/b/title/${encodeURIComponent(query)}-L.jpg`;
}

export function openLibraryCoverById(coverId: number, size: 'S' | 'M' | 'L' = 'L'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
  language?: string[];
  first_publish_year?: number;
}

export interface OpenLibrarySearchResult {
  docs: OpenLibraryDoc[];
}

/** Busca en Open Library (modo legacy, menos estricto). */
export async function searchOpenLibraryCover(
  title: string,
  author: string,
  language?: 'en' | 'es',
): Promise<string | null> {
  const hit = await searchOpenLibraryCoverStrict(title, author, language);
  return hit?.url ?? null;
}

/** Busca portada con coincidencia estricta título + autor. */
export async function searchOpenLibraryCoverStrict(
  title: string,
  author: string,
  language?: 'en' | 'es',
): Promise<{ url: string; score: number } | null> {
  const params = new URLSearchParams({
    title,
    author,
    limit: '12',
    fields: 'title,author_name,cover_i,isbn,language,first_publish_year',
  });
  if (language) params.set('language', language);

  const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'E-Library-Stream/1.0 (cover-resolver)',
    },
    signal: AbortSignal.timeout?.(12_000),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as OpenLibrarySearchResult;
  const docs = data.docs ?? [];
  if (!docs.length) return null;

  let best: { url: string; score: number } | null = null;

  for (const d of docs) {
    if (!d.cover_i) continue;
    let score = combinedMatchScore(
      title,
      author,
      d.title ?? '',
      d.author_name ?? [],
    );
    if (language && d.language?.includes(language)) score += 0.08;

    if (score < MIN_COVER_MATCH_SCORE) continue;

    const url = openLibraryCoverById(d.cover_i, 'L');
    if (!best || score > best.score) {
      best = { url, score };
    }
  }

  return best;
}
