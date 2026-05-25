import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/books — Lista todos los libros (sin filtro de expiración)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit  = parseInt(searchParams.get("limit") || "50");
    const page   = parseInt(searchParams.get("page") || "1");
    const skip   = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({ books, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[ADMIN GET /api/admin/books]", error);
    return NextResponse.json({ error: "Error al obtener libros" }, { status: 500 });
  }
}

// POST /api/admin/books — Crear nuevo libro manualmente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title, author, description, genres, language, coverUrl,
      downloadUrl, source, publishedYear, readingTimeMin,
      ratingAvg, award, availableUntil, topRank, isFeatured, trendingScore,
    } = body;

    if (!title || !author || !source) {
      return NextResponse.json({ error: "Faltan campos requeridos: title, author, source" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        sourceId: `manual-${Date.now()}`,
        title,
        author,
        description: description || null,
        genres: typeof genres === 'string' ? genres : JSON.stringify(genres || []),
        language: language || "es",
        coverUrl: coverUrl || null,
        downloadUrl: downloadUrl || null,
        source,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        readingTimeMin: readingTimeMin ? parseInt(readingTimeMin) : null,
        ratingAvg: ratingAvg ? parseFloat(ratingAvg) : 0,
        award: award || null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        topRank: topRank ? parseInt(topRank) : null,
        isFeatured: !!isFeatured,
        trendingScore: trendingScore ? parseFloat(trendingScore) : 0,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("[ADMIN POST /api/admin/books]", error);
    return NextResponse.json({ error: "Error al crear libro" }, { status: 500 });
  }
}
