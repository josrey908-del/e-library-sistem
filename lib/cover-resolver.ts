/**
 * Resolución de portadas originales por título + autor (mapeo estricto).
 * Prioridad: Google Books → Open Library → portada Gutendex → Gutenberg (misma edición).
 */

import fs from 'fs';
import path from 'path';
import {
  combinedMatchScore,
  MIN_COVER_MATCH_SCORE,
} from './cover-matcher';
import { gutenbergCoverUrl } from './gutenberg';
import { openLibraryCoverUrl, searchOpenLibraryCoverStrict } from './openlibrary';
import { fetchGutendexBook, gutendexCoverUrl } from './gutendex';

export type CoverSource =
  | 'cache'
  | 'google'
  | 'openlibrary'
  | 'gutendex'
  | 'gutenberg';

export interface CoverResolveInput {
  cacheKey: string;
  title: string;
  author: string;
  language?: 'en' | 'es';
  gutId?: number;
  /** Si true, ignora caché y rebusca portada editorial */
  force?: boolean;
}

export interface CoverResolveResult {
  url: string;
  source: CoverSource;
  matchScore?: number;
}

/** Títulos en español no deben usar portada PG de la edición inglesa (mismo gutId). */
function isSpanishEditionTitle(title: string, language?: string): boolean {
  if (language === 'es') return true;
  return /[áéíóúñ¿¡]/i.test(title);
}

function skipGutenbergFallback(input: CoverResolveInput): boolean {
  return input.language === 'es' && isSpanishEditionTitle(input.title, input.language);
}

const CACHE_PATH = path.join(process.cwd(), 'data', 'cover-cache.json');
const MIN_IMAGE_BYTES = 3_000;
const REQUEST_DELAY_MS = 250;
const VALIDATE_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 3;

let lastRequestAt = 0;
let memoryCache: Record<string, CoverResolveResult> | null = null;

function loadDiskCache(): Record<string, CoverResolveResult> {
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(CACHE_PATH)) {
      memoryCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) as Record<
        string,
        CoverResolveResult
      >;
      return memoryCache;
    }
  } catch {
    /* ignore */
  }
  memoryCache = {};
  return memoryCache;
}

export function saveDiskCache(): void {
  const cache = loadDiskCache();
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

export function clearDiskCache(): void {
  memoryCache = {};
  if (fs.existsSync(CACHE_PATH)) fs.unlinkSync(CACHE_PATH);
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = REQUEST_DELAY_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

function fetchAbortSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown = new Error('fetch failed');
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await throttle();
      const res = await fetch(url, {
        ...init,
        signal: fetchAbortSignal(15_000),
        headers: {
          'User-Agent': 'E-Library-Stream/1.0 (cover-resolver; +https://localhost)',
          Accept: 'application/json, image/*,*/*',
          ...(init?.headers as Record<string, string>),
        },
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function validateCoverUrl(url: string): Promise<boolean> {
  try {
    const res = await Promise.race([
      fetchWithRetry(url, { method: 'HEAD' }),
      new Promise<Response>((_, rej) =>
        setTimeout(() => rej(new Error('validate timeout')), VALIDATE_TIMEOUT_MS),
      ),
    ]);
    if (!res.ok) return false;
    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) return false;
    const len = parseInt(res.headers.get('content-length') ?? '0', 10);
    if (len > 0 && len < MIN_IMAGE_BYTES) return false;
    return true;
  } catch {
    try {
      const res = await fetchWithRetry(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-4096' },
      });
      if (!res.ok) return false;
      const buf = await res.arrayBuffer();
      return buf.byteLength >= 800;
    } catch {
      return false;
    }
  }
}

interface GoogleVolume {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      extraLarge?: string;
      large?: string;
      medium?: string;
      thumbnail?: string;
      smallThumbnail?: string;
    };
    language?: string;
  };
}

async function resolveGoogleBooksCover(
  input: CoverResolveInput,
): Promise<{ url: string; score: number } | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const q = encodeURIComponent(`intitle:${input.title} inauthor:${input.author}`);
  const lang = input.language ? `&langRestrict=${input.language}` : '';
  const key = apiKey ? `&key=${apiKey}` : '';
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=8${lang}${key}`;

  const res = await fetchWithRetry(url);
  if (!res.ok) return null;

  const data = (await res.json()) as { items?: GoogleVolume[] };
  let best: { url: string; score: number } | null = null;

  for (const item of data.items ?? []) {
    const info = item.volumeInfo;
    if (!info?.imageLinks) continue;

    const score = combinedMatchScore(
      input.title,
      input.author,
      info.title ?? '',
      info.authors ?? [],
    );
    if (score < MIN_COVER_MATCH_SCORE) continue;

    const raw =
      info.imageLinks.extraLarge ??
      info.imageLinks.large ??
      info.imageLinks.medium ??
      info.imageLinks.thumbnail ??
      info.imageLinks.smallThumbnail;
    if (!raw) continue;

    const coverUrl = raw
      .replace(/^http:/, 'https:')
      .replace(/zoom=\d+/, 'zoom=0')
      .replace(/&edge=curl/, '');

    if (!best || score > best.score) {
      best = { url: coverUrl, score };
    }
  }

  if (best && (await validateCoverUrl(best.url))) return best;
  return null;
}

async function resolveGutendexCover(gutendexId: number): Promise<string | null> {
  try {
    const book = await fetchGutendexBook(gutendexId);
    const url = gutendexCoverUrl(book);
    if (url && (await validateCoverUrl(url))) return url;
  } catch {
    /* skip */
  }
  return null;
}

async function resolveGutenbergCover(gutId: number): Promise<string | null> {
  const url = gutenbergCoverUrl(gutId, 'large');
  if (await validateCoverUrl(url)) return url;
  const medium = gutenbergCoverUrl(gutId, 'medium');
  if (await validateCoverUrl(medium)) return medium;
  return url;
}

/**
 * Resuelve la portada que mejor corresponde a este título y autor.
 */
export async function resolveCoverUrl(
  input: CoverResolveInput,
): Promise<CoverResolveResult | null> {
  const cache = loadDiskCache();

  if (!input.force && cache[input.cacheKey]?.url) {
    const cached = cache[input.cacheKey];
    if (await validateCoverUrl(cached.url)) {
      return { ...cached, source: 'cache' };
    }
    delete cache[input.cacheKey];
  }

  const gutendexMatch = input.cacheKey.match(/^gutendex-(\d+)-/);
  const gutendexId = gutendexMatch ? parseInt(gutendexMatch[1], 10) : null;

  const olByTitle = async (): Promise<CoverResolveResult | null> => {
    const url = openLibraryCoverUrl(input.title, input.author);
    if (await validateCoverUrl(url)) {
      return { url, source: 'openlibrary', matchScore: 0.65 };
    }
    return null;
  };

  const olStrict = async (): Promise<CoverResolveResult | null> => {
    const hit = await searchOpenLibraryCoverStrict(
      input.title,
      input.author,
      input.language,
    );
    if (!hit || !(await validateCoverUrl(hit.url))) return null;
    return { url: hit.url, source: 'openlibrary', matchScore: hit.score };
  };

  const google = async (): Promise<CoverResolveResult | null> => {
    const hit = await resolveGoogleBooksCover(input);
    if (hit) return { url: hit.url, source: 'google', matchScore: hit.score };
    return null;
  };

  const gutendex = async (): Promise<CoverResolveResult | null> => {
    if (!gutendexId) return null;
    const url = await resolveGutendexCover(gutendexId);
    if (url) return { url, source: 'gutendex', matchScore: 1 };
    return null;
  };

  const gutenbergPrimary = async (): Promise<CoverResolveResult | null> => {
    if (skipGutenbergFallback(input) || !input.gutId) return null;
    const url = await resolveGutenbergCover(input.gutId);
    if (url) return { url, source: 'gutenberg', matchScore: 0.5 };
    return null;
  };

  const gutenbergFallback = async (): Promise<CoverResolveResult | null> => {
    if (!skipGutenbergFallback(input) || !input.gutId) return null;
    const url = await resolveGutenbergCover(input.gutId);
    if (url) return { url, source: 'gutenberg', matchScore: 0.35 };
    return null;
  };

  const attempts: Array<() => Promise<CoverResolveResult | null>> =
    input.language === 'es'
      ? [gutendex, olByTitle, olStrict, google, gutenbergFallback]
      : [google, olStrict, gutendex, olByTitle, gutenbergPrimary];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result) {
        cache[input.cacheKey] = result;
        return result;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e ?? 'unknown');
      console.warn(`[cover-resolver] ${input.cacheKey}:`, msg);
    }
  }

  return null;
}

export async function downloadCoverToPublic(
  remoteUrl: string,
  cacheKey: string,
): Promise<string | null> {
  const safeName = cacheKey.replace(/[^a-zA-Z0-9-_]/g, '_');
  const dir = path.join(process.cwd(), 'public', 'covers');
  const filePath = path.join(dir, `${safeName}.jpg`);
  const publicUrl = `/covers/${safeName}.jpg`;

  try {
    await throttle();
    const res = await fetch(remoteUrl, { signal: fetchAbortSignal(30_000) });
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_IMAGE_BYTES) return null;

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buf);
    return publicUrl;
  } catch {
    return null;
  }
}
