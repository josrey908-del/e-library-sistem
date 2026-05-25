/**
 * Importa libros de dominio público desde Gutendex (50 EN + 50 ES mínimo).
 * Uso: npm run db:import
 */
import { PrismaClient } from '@prisma/client';
import {
  fetchGutendexPage,
  gutendexAuthorNames,
  gutendexCoverUrl,
  gutendexEpubUrl,
  gutendexGenres,
  gutendexPdfUrl,
  gutendexPrimaryLanguage,
  type GutendexBook,
  type GutendexPage,
} from '../lib/gutendex';
import { downloadCoverToPublic, resolveCoverUrl } from '../lib/cover-resolver';
import { gutenbergCoverUrl } from '../lib/gutenberg';

const prisma = new PrismaClient();

const TARGET_EN = 50;
const TARGET_ES = 50;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function upsertGutendexBook(book: GutendexBook, lang: 'en' | 'es'): Promise<boolean> {
  const epub = gutendexEpubUrl(book);
  if (!epub) return false;

  const sourceId = `gutendex-${book.id}-${lang}`;
  const existing = await prisma.book.findUnique({ where: { sourceId } });
  if (existing) return false;

  const author = gutendexAuthorNames(book);
  const pdfUrl = gutendexPdfUrl(book);
  const gutCover = gutendexCoverUrl(book);

  let coverUrl: string | null = null;
  if (gutCover) {
    coverUrl = await downloadCoverToPublic(gutCover, sourceId);
  }
  if (!coverUrl) {
    const resolved = await resolveCoverUrl({
      cacheKey: sourceId,
      title: book.title,
      author,
      language: lang,
      gutId: book.id,
    });
    if (resolved) {
      coverUrl = (await downloadCoverToPublic(resolved.url, sourceId)) ?? resolved.url;
    } else {
      coverUrl = gutenbergCoverUrl(book.id);
    }
  }

  const description =
    book.summaries?.[0]?.slice(0, 1200) ??
    `Obra de dominio público de ${author}, disponible en Project Gutenberg.`;

  await prisma.book.create({
    data: {
      sourceId,
      workKey: `gutendex-${book.id}`,
      title: book.title,
      author,
      description,
      genres: JSON.stringify(gutendexGenres(book)),
      language: lang,
      coverUrl,
      downloadUrl: epub,
      pdfUrl,
      pdfStatus: pdfUrl ? 'ready' : 'epub_only',
      source: 'gutenberg',
      publishedYear: book.authors[0]?.death_year
        ? book.authors[0].death_year + 5
        : null,
      readingTimeMin: Math.max(60, Math.min(1440, Math.round(book.download_count / 50))),
      ratingAvg: 4.2 + Math.min(0.7, book.download_count / 100000),
      trendingScore: Math.min(95, 50 + Math.log10(book.download_count + 1) * 8),
      isFeatured: false,
    },
  });

  return true;
}

async function importLanguage(lang: 'en' | 'es', target: number): Promise<number> {
  let added = 0;
  let page = 1;
  let nextUrl: string | null = null;

  while (added < target && page <= 25) {
    const data: GutendexPage = nextUrl
      ? await (await fetch(nextUrl)).json()
      : await fetchGutendexPage({
          languages: lang,
          sort: 'popular',
          page: String(page),
        });

    nextUrl = data.next;
    page++;

    for (const book of data.results as GutendexBook[]) {
      if (added >= target) break;
      const primary = gutendexPrimaryLanguage(book);
      if (primary !== lang) continue;
      if (!gutendexEpubUrl(book)) continue;

      try {
        if (await upsertGutendexBook(book, lang)) {
          added++;
          console.log(`  ✅ [${lang}] +${added}/${target} — ${book.title}`);
        }
      } catch (e) {
        console.warn(`  ⚠️  Omitido: ${book.title}`, (e as Error).message);
      }
      await sleep(200);
    }

    if (!nextUrl) break;
  }

  return added;
}

async function main() {
  console.log('\n📥 Importando catálogo desde Gutendex...\n');

  const [enBefore, esBefore] = await Promise.all([
    prisma.book.count({ where: { language: 'en' } }),
    prisma.book.count({ where: { language: 'es' } }),
  ]);

  const needEn = Math.max(0, TARGET_EN - enBefore);
  const needEs = Math.max(0, TARGET_ES - esBefore);

  console.log(`   En BD: ${enBefore} EN, ${esBefore} ES`);
  console.log(`   Objetivo import: +${needEn} EN, +${needEs} ES\n`);

  const addedEn = needEn > 0 ? await importLanguage('en', needEn) : 0;
  const addedEs = needEs > 0 ? await importLanguage('es', needEs) : 0;

  const [enTotal, esTotal, total] = await Promise.all([
    prisma.book.count({ where: { language: 'en' } }),
    prisma.book.count({ where: { language: 'es' } }),
    prisma.book.count(),
  ]);

  console.log(`\n✨ Importación lista: +${addedEn} EN, +${addedEs} ES`);
  console.log(`   Total catálogo: ${total} (${enTotal} EN + ${esTotal} ES)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
