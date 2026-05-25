/**
 * Asigna portada original libro por libro con mapeo estricto título ↔ imagen.
 * Uso: npm run covers:assign
 *      npm run covers:assign -- --force  (reemplaza todas las portadas)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  clearDiskCache,
  resolveCoverUrl,
  downloadCoverToPublic,
  saveDiskCache,
} from '../lib/cover-resolver';

const prisma = new PrismaClient();
const MANIFEST_PATH = path.join(process.cwd(), 'lib', 'covers-manifest.json');
const REPORT_PATH = path.join(process.cwd(), 'data', 'cover-assign-report.json');
const force = process.argv.includes('--force');
const fromArg = process.argv.indexOf('--from');
const toArg = process.argv.indexOf('--to');
const fromIdx = fromArg >= 0 ? parseInt(process.argv[fromArg + 1], 10) : 0;
const toIdx = toArg >= 0 ? parseInt(process.argv[toArg + 1], 10) : Infinity;
const BOOK_TIMEOUT_MS = 40_000;

type Manifest = Record<string, string>;

function safeFileKey(sourceId: string): string {
  return sourceId.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function loadManifest(): Manifest {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest;
    }
  } catch {
    /* */
  }
  return {};
}

function saveManifest(m: Manifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2) + '\n', 'utf-8');
}

function extractGutId(sourceId: string): number | undefined {
  const m = sourceId.match(/^(?:gut|gutendex)-(\d+)-/);
  return m ? parseInt(m[1], 10) : undefined;
}

async function main() {
  if (force) clearDiskCache();

  const books = await prisma.book.findMany({
    orderBy: [{ language: 'asc' }, { title: 'asc' }],
    select: {
      id: true,
      sourceId: true,
      title: true,
      author: true,
      language: true,
      coverUrl: true,
    },
  });

  const manifest = loadManifest();
  const report: Array<{
    sourceId: string;
    title: string;
    author: string;
    language: string;
    source: string;
    matchScore?: number;
    coverUrl: string;
    status: 'ok' | 'failed';
  }> = [];

  console.log(`\n📖 Asignación de portadas — ${books.length} libros (${force ? 'FORZAR' : 'solo faltantes'})\n`);

  let ok = 0;
  let failed = 0;

  if (fs.existsSync(REPORT_PATH)) {
    try {
      const prev = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8')) as typeof report;
      const byId = new Map(prev.map((r) => [r.sourceId, r]));
      for (const b of books) {
        if (!byId.has(b.sourceId) && fromIdx === 0) continue;
      }
      report.push(...prev);
    } catch {
      /* */
    }
  }
  const doneIds = force
    ? new Set<string>()
    : new Set(report.filter((r) => r.status === 'ok').map((r) => r.sourceId));

  async function assignOne(book: (typeof books)[0], i: number): Promise<void> {
    const gutId = extractGutId(book.sourceId);
    process.stdout.write(`  [${i + 1}/${books.length}] [${book.language}] "${book.title}" — ${book.author} … `);

    const resolved = await resolveCoverUrl({
      cacheKey: book.sourceId,
      title: book.title,
      author: book.author,
      language: book.language as 'en' | 'es',
      gutId,
      force: true,
    });

    if (!resolved) {
      failed++;
      console.log('❌ sin portada');
      report.push({
        sourceId: book.sourceId,
        title: book.title,
        author: book.author,
        language: book.language,
        source: 'none',
        coverUrl: book.coverUrl ?? '',
        status: 'failed',
      });
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
    console.log(`✅ ${resolved.source} (score ${resolved.matchScore?.toFixed(2) ?? '—'})`);
    const entry = {
      sourceId: book.sourceId,
      title: book.title,
      author: book.author,
      language: book.language,
      source: resolved.source,
      matchScore: resolved.matchScore,
      coverUrl: finalUrl,
      status: 'ok' as const,
    };
    report.push(entry);
    doneIds.add(book.sourceId);
  }

  const end = Math.min(books.length, Number.isFinite(toIdx) ? toIdx : books.length);
  for (let i = Math.max(0, fromIdx); i < end; i++) {
    if (doneIds.has(books[i].sourceId)) {
      ok++;
      continue;
    }
    try {
      await Promise.race([
        assignOne(books[i], i),
        new Promise<void>((_, rej) =>
          setTimeout(() => rej(new Error('timeout por libro')), BOOK_TIMEOUT_MS),
        ),
      ]);
    } catch (e) {
      failed++;
      console.log(`⚠️  ${(e as Error).message}`);
      report.push({
        sourceId: books[i].sourceId,
        title: books[i].title,
        author: books[i].author,
        language: books[i].language,
        source: 'error',
        coverUrl: books[i].coverUrl ?? '',
        status: 'failed',
      });
    }

    if ((i + 1) % 3 === 0) {
      saveManifest(manifest);
      saveDiskCache();
      const reportDir = path.dirname(REPORT_PATH);
      if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
      fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    }
  }

  const merged = new Map<string, (typeof report)[0]>();
  for (const r of report) merged.set(r.sourceId, r);
  const finalReport = Array.from(merged.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  saveManifest(manifest);
  saveDiskCache();

  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(finalReport, null, 2), 'utf-8');

  const totalOk = finalReport.filter((r) => r.status === 'ok').length;
  console.log(`\n✨ Lote listo: +${ok} en este rango | Total acumulado: ${totalOk}/${books.length} portadas.`);
  console.log(`   Manifest: lib/covers-manifest.json`);
  console.log(`   Informe:  data/cover-assign-report.json\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
