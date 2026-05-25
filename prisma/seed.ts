const { PrismaClient } = require('@prisma/client');
const { allCatalogBooks, LITERARY_WORKS } = require('../lib/works-catalog');
const { gutenbergEpubUrl } = require('../lib/gutenberg');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed bilingüe (EN + ES)...\n');

  await prisma.reviewLike.deleteMany();
  await prisma.review.deleteMany();
  await prisma.readingState.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: 'admin@elibrary.com',
      name: 'Admin',
      provider: 'credentials',
    },
  });

  await prisma.user.create({
    data: {
      email: 'lector@elibrary.com',
      name: 'Lector Entusiasta',
      provider: 'credentials',
    },
  });

  const books = allCatalogBooks();
  let created = 0;

  for (const book of books) {
    const createdBook = await prisma.book.create({ data: book });
    created++;

    const work = LITERARY_WORKS.find((w: (typeof LITERARY_WORKS)[number]) => w.workKey === book.workKey);
    if (work?.isEpisodic) {
      const gutId = book.downloadUrl?.match(/epub\/(\d+)\//)?.[1] ?? '40203';
      const epubUrl = gutenbergEpubUrl(Number(gutId));
      await prisma.chapter.createMany({
        data: [
          {
            bookId: createdBook.id,
            season: 1,
            chapterNum: 1,
            title: 'El arresto de Arsène Lupin',
            downloadUrl: epubUrl,
          },
          {
            bookId: createdBook.id,
            season: 1,
            chapterNum: 2,
            title: 'Arsène Lupin en prisión',
            downloadUrl: epubUrl,
          },
          {
            bookId: createdBook.id,
            season: 2,
            chapterNum: 1,
            title: 'La perla negra',
            downloadUrl: epubUrl,
          },
        ],
      });
    }

    console.log(`  ✅ [${created}/${books.length}] [${book.language}] ${book.title}`);
  }

  const enCount = books.filter((b: any) => b.language === 'en').length;
  const esCount = books.filter((b: any) => b.language === 'es').length;

  console.log(`\n✨ Seed completado: ${created} libros (${enCount} EN + ${esCount} ES).`);
  console.log(`👤 Admin: admin@elibrary.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
