import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/books/[id]
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const book = await prisma.book.findUnique({ where: { id: params.id } });
    if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
    return NextResponse.json(book);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener libro" }, { status: 500 });
  }
}

// PATCH /api/admin/books/[id] — Actualizar libro (incluyendo availableUntil)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      title, author, description, genres, language, coverUrl,
      downloadUrl, source, publishedYear, readingTimeMin,
      ratingAvg, award, availableUntil, topRank, isFeatured, trendingScore,
    } = body;

    const updatedBook = await prisma.book.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(description !== undefined && { description }),
        ...(genres !== undefined && { genres: typeof genres === 'string' ? genres : JSON.stringify(genres) }),
        ...(language && { language }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(downloadUrl !== undefined && { downloadUrl }),
        ...(source && { source }),
        ...(publishedYear !== undefined && { publishedYear: publishedYear ? parseInt(publishedYear) : null }),
        ...(readingTimeMin !== undefined && { readingTimeMin: readingTimeMin ? parseInt(readingTimeMin) : null }),
        ...(ratingAvg !== undefined && { ratingAvg: parseFloat(ratingAvg) }),
        ...(award !== undefined && { award: award || null }),
        // availableUntil: null limpia la fecha (libro siempre disponible)
        availableUntil: availableUntil === null ? null : availableUntil ? new Date(availableUntil) : undefined,
        ...(topRank !== undefined && { topRank: topRank ? parseInt(topRank) : null }),
        ...(isFeatured !== undefined && { isFeatured: !!isFeatured }),
        ...(trendingScore !== undefined && { trendingScore: parseFloat(trendingScore) }),
      },
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("[ADMIN PATCH /api/admin/books/[id]]", error);
    return NextResponse.json({ error: "Error al actualizar libro" }, { status: 500 });
  }
}

// DELETE /api/admin/books/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.book.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar libro" }, { status: 500 });
  }
}
