/**
 * Resuelve portadas originales, las guarda en public/covers/ y actualiza DB + manifest.
 * Uso: npm run covers:fix
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { saveDiskCache, resolveCoverUrl, downloadCoverToPublic } from '../lib/cover-resolver';

const prisma = new PrismaClient();
const MANIFEST_PATH = path.join(process.cwd(), 'lib', 'covers-manifest.json');
const BATCH = 4;

type Manifest = Record<string, string>;

function loadManifest(): Manifest {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest;
    }
  } catch {
    /* fresh */
  }
  return {};
}

function saveManifest(manifest: Manifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

function safeFileKey(sourceId: string): string {
  return sourceId.replace(/[^a-zA-Z0-9-_]/g, '_');
}

/** Sincroniza manifest/DB con archivos ya descargados en public/covers */
function syncExistingLocalCovers(
  books: { id: string; sourceId: string }[],
  manifest: Manifest,
): number {
  const coversDir = path.join(process.cwd(), 'public', 'covers');
  if (!fs.existsSync(coversDir)) return 0;
  let synced = 0;
  for (const book of books) {
    const file = path.join(coversDir, `${safeFileKey(book.sourceId)}.jpg`);
    if (!fs.existsSync(file)) continue;
    const url = `/covers/${safeFileKey(book.sourceId)}.jpg`;
    manifest[book.sourceId] = url;
    synced++;
  }
  return synced;
}

async function main() {
  const manifest = loadManifest();

  console.log('\n📚 Corrigiendo portadas...\n');
  if (!process.env.GOOGLE_BOOKS_API_KEY) {
    console.log(
      'ℹ️  Sin GOOGLE_BOOKS_API_KEY: Open Library + Gutenberg (añade clave en .env para más cobertura).\n',
    );
  }

  const books = await prisma.book.findMany({
    select: { id: true, sourceId: true, title: true, author: true, language: true },
  });

  const preSynced = syncExistingLocalCovers(books, manifest);
  if (preSynced > 0) {
    console.log(`   ${preSynced} portadas locales detectadas.\n`);
    for (const book of books) {
      const url = manifest[book.sourceId];
      if (url) {
        await prisma.book.update({ where: { id: book.id }, data: { coverUrl: url } });
      }
    }
    saveManifest(manifest);
  }

  let ok = 0;
  let failed = 0;
  const failures: string[] = [];

  async function processBook(
    book: { id: string; sourceId: string; title: string; author: string; language: string },
    index: number,
  ) {
    const localPath = `/covers/${safeFileKey(book.sourceId)}.jpg`;
    const filePath = path.join(process.cwd(), 'public', 'covers', `${safeFileKey(book.sourceId)}.jpg`);
    if (fs.existsSync(filePath)) {
      manifest[book.sourceId] = localPath;
      await prisma.book.update({ where: { id: book.id }, data: { coverUrl: localPath } });
      ok++;
      return;
    }

    const gutMatch = book.sourceId.match(/^(?:gut|gutendex)-(\d+)-/);
    const gutId = gutMatch ? parseInt(gutMatch[1], 10) : undefined;

    const resolved = await resolveCoverUrl({
      cacheKey: book.sourceId,
      title: book.title,
      author: book.author,
      language: book.language as 'en' | 'es',
      gutId,
    });

    if (!resolved) {
      failed++;
      failures.push(book.title);
      console.log(`  [${index + 1}/${books.length}] ❌ ${book.title}`);
      return;
    }

    const localUrl = await downloadCoverToPublic(resolved.url, book.sourceId);
    const finalUrl = localUrl ?? resolved.url;
    manifest[book.sourceId] = finalUrl;

    await prisma.book.update({
      where: { id: book.id },
      data: { coverUrl: finalUrl },
    });

    ok++;
    console.log(`  [${index + 1}/${books.length}] ✅ ${book.title} (${resolved.source})`);
  }

  try {
    for (let i = 0; i < books.length; i += BATCH) {
      const batch = books.slice(i, i + BATCH);
      await Promise.all(batch.map((b, j) => processBook(b, i + j)));
    }
  } finally {
    saveManifest(manifest);
    saveDiskCache();
  }

  console.log(`\n✨ ${ok} portadas OK, ${failed} fallidas (total ${books.length}).`);
  if (failures.length) {
    console.log('\nSin portada:');
    failures.forEach((t) => console.log(`  - ${t}`));
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
