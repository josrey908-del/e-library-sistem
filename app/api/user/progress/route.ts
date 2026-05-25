import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { bookId, progress } = body;

    if (!bookId || typeof progress !== "number") {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const status = progress >= 100 ? "finished" : "reading";

    const readingState = await prisma.readingState.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
      update: {
        progress,
        status,
      },
      create: {
        userId: session.user.id,
        bookId,
        progress,
        status,
      },
    });

    return NextResponse.json(readingState);
  } catch (error) {
    console.error("Error saving progress:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
