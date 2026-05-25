/**
 * Cliente para la API pública Gutendex (metadatos de Project Gutenberg).
 * https://gutendex.com
 */

export interface GutendexAuthor {
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
}

export interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexAuthor[];
  summaries?: string[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | string;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
}

export interface GutendexPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

const BASE = 'https://gutendex.com';

export async function fetchGutendexPage(
  params: Record<string, string>,
): Promise<GutendexPage> {
  const qs = new URLSearchParams(params);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  const res = await fetch(`${BASE}/books/?${qs}`, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`Gutendex ${res.status}`);
  return res.json() as Promise<GutendexPage>;
}

export function gutendexEpubUrl(book: GutendexBook): string | null {
  return (
    book.formats['application/epub+zip'] ??
    book.formats['application/epub'] ??
    null
  );
}

export function gutendexPdfUrl(book: GutendexBook): string | null {
  return book.formats['application/pdf'] ?? null;
}

export function gutendexCoverUrl(book: GutendexBook): string | null {
  return (
    book.formats['image/jpeg'] ??
    book.formats['image/png'] ??
    null
  );
}

/** Obtiene un libro concreto por ID Gutendex (misma edición que el EPUB). */
export async function fetchGutendexBook(id: number): Promise<GutendexBook> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  const res = await fetch(`${BASE}/books/${id}/`, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`Gutendex book ${id}: ${res.status}`);
  return res.json() as Promise<GutendexBook>;
}

export function gutendexAuthorNames(book: GutendexBook): string {
  const names = book.authors.map((a) => a.name.trim()).filter(Boolean);
  return names.length ? names.join(', ') : 'Desconocido';
}

export function gutendexPrimaryLanguage(book: GutendexBook): 'en' | 'es' | null {
  const langs = book.languages.map((l) => l.replace(/,.*/, '').toLowerCase());
  if (langs.includes('es')) return 'es';
  if (langs.includes('en')) return 'en';
  return null;
}

/** Géneros simplificados a partir de subjects/bookshelves */
export function gutendexGenres(book: GutendexBook): string[] {
  const raw = [...book.subjects, ...book.bookshelves]
    .map((s) => s.split('--')[0].split(' - ')[0].trim())
    .filter((s) => s.length > 2 && s.length < 60);
  const unique = Array.from(new Set(raw)).slice(0, 4);
  return unique.length ? unique : ['Clásico', 'Dominio público'];
}
