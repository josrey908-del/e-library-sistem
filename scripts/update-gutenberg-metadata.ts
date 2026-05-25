/**
 * Actualiza portadas y URLs según el catálogo bilingüe (sin borrar usuarios).
 */
import { PrismaClient } from '@prisma/client';
import { allCatalogBooks } from '../lib/works-catalog';

const prisma = new PrismaClient();

async function main() {
  const catalogBySource = new Map(allCatalogBooks().map((b) => [b.sourceId, b]));

  const books = await prisma.book.findMany({
    select: { id: true, sourceId: true, title: true, workKey: true, language: true },
  });

  let updated = 0;
  let created = 0;

  for (const book of books) {
    const entry = catalogBySource.get(book.sourceId);
    if (entry) {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          workKey: entry.workKey,
          coverUrl: entry.coverUrl,
          downloadUrl: entry.downloadUrl,
          language: entry.language,
          title: entry.title,
          description: entry.description,
        },
      });
      updated++;
      catalogBySource.delete(book.sourceId);
      continue;
    }

    // Migrar registros antiguos gut-{id} → emparejar por workKey si existe
    const legacyMatch = book.sourceId.match(/^gut-(\d+)$/);
    if (legacyMatch && book.workKey) {
      const gutId = legacyMatch[1];
      const enEntry = catalogBySource.get(`gut-${gutId}-en`);
      const esEntry = catalogBySource.get(`gut-${gutId}-es`);
      const match =
        book.language === 'es' ? esEntry : enEntry;
      if (match) {
        await prisma.book.update({
          where: { id: book.id },
          data: {
            sourceId: match.sourceId,
            coverUrl: match.coverUrl,
            downloadUrl: match.downloadUrl,
            title: match.title,
            description: match.description,
          },
        });
        updated++;
      }
    }
  }

  // Crear ediciones faltantes del catálogo
  for (const [, entry] of Array.from(catalogBySource)) {
    const exists = await prisma.book.findUnique({ where: { sourceId: entry.sourceId } });
    if (!exists) {
      await prisma.book.create({ data: entry });
      created++;
      console.log(`  ➕ Nueva edición: [${entry.language}] ${entry.title}`);
    }
  }

  console.log(`\n✨ ${updated} libros actualizados, ${created} ediciones nuevas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
