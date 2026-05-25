import { prisma } from "./prisma";

export interface BooksQueryParams {
  search?: string;
  author?: string;
  genre?: string;
  language?: string;
  category?: string;
  mood?: string;
  limit?: number;
  page?: number;
}

export async function getBooks(params: BooksQueryParams) {
  const search   = params.search || "";
  const author   = params.author || "";
  const genre    = params.genre || "";
  const language = params.language || "";
  const category = params.category || "";
  const mood     = params.mood || "";
  const limit    = params.limit ?? 20;
  const page     = params.page ?? 1;
  const skip     = (page - 1) * limit;

  const now = new Date();

  const baseWhere: any = {
    OR: [
      { availableUntil: null },
      { availableUntil: { gt: now } },
    ],
  };

  if (search) {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }

  if (author) {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ author: { contains: author } });
  }

  if (language) {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ language });
  }

  if (genre) {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ genres: { contains: genre } });
  }

  if (mood) {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ moods: { contains: mood } });
  }

  if (category === "top10") {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ topRank: { not: null } });
  } else if (category === "expiring") {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({
      availableUntil: {
        not: null,
        gt: now,
        lte: in30Days,
      },
    });
  } else if (category === "award") {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ award: { not: null } });
  } else if (category === "featured") {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ isFeatured: true });
  } else if (category === "trending") {
    baseWhere.AND = baseWhere.AND || [];
    baseWhere.AND.push({ trendingScore: { gt: 80 } });
  }

  let orderBy: any = { createdAt: "desc" };
  if (category === "top10") orderBy = { topRank: "asc" };
  if (category === "trending") orderBy = { trendingScore: "desc" };
  if (category === "expiring") orderBy = { availableUntil: "asc" };

  const [rawBooks, total] = await Promise.all([
    prisma.book.findMany({
      where: baseWhere,
      orderBy,
      take: limit,
      skip,
    }),
    prisma.book.count({ where: baseWhere }),
  ]);

  const books = rawBooks.map(serializeBook);
  return { books, total, page, pages: Math.ceil(total / limit) };
}

function serializeBook(book: any): any {
  if (!book) return book;
  return {
    ...book,
    availableUntil: book.availableUntil instanceof Date
      ? book.availableUntil.toISOString()
      : book.availableUntil,
    createdAt: book.createdAt instanceof Date
      ? book.createdAt.toISOString()
      : book.createdAt,
    updatedAt: book.updatedAt instanceof Date
      ? book.updatedAt.toISOString()
      : book.updatedAt,
  };
}
