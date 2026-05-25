import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

  const review = await prisma.review.findUnique({
    where: {
      userId_bookId: {
        userId: session.user.id,
        bookId,
      },
    },
  });

  return NextResponse.json({ review });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, rating, content } = await req.json();
  if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be a number between 1 and 5" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: {
      userId_bookId: {
        userId: session.user.id,
        bookId,
      },
    },
    update: { rating, content: content ?? null },
    create: {
      userId: session.user.id,
      bookId,
      rating,
      content: content ?? null,
    },
  });

  const allRatings = await prisma.review.aggregate({
    where: { bookId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.book.update({
    where: { id: bookId },
    data: {
      ratingAvg: allRatings._avg.rating ?? 0,
      ratingCount: allRatings._count.rating,
    },
  });

  return NextResponse.json({ review });
}
