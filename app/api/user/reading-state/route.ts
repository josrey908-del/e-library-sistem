import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

  const state = await prisma.readingState.findUnique({
    where: {
      userId_bookId: {
        userId: session.user.id,
        bookId,
      },
    },
  });

  return NextResponse.json({ readingState: state });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, status } = await req.json();
  if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

  // status can be: "favorite", "want_to_read", or null to remove
  if (status === null) {
    await prisma.readingState.deleteMany({
      where: { userId: session.user.id, bookId },
    });
    return NextResponse.json({ readingState: null });
  }

  const validStatuses = ["favorite", "want_to_read", "reading", "finished"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const readingState = await prisma.readingState.upsert({
    where: {
      userId_bookId: {
        userId: session.user.id,
        bookId,
      },
    },
    update: { status },
    create: {
      userId: session.user.id,
      bookId,
      status,
      progress: 0,
    },
  });

  return NextResponse.json({ readingState });
}
