import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Need to check where prisma client is
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const annotations = await prisma.annotation.findMany({
    where: { userId: user.id, bookId },
  });

  return NextResponse.json(annotations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, cfiRange, text, color, note } = await req.json();

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const annotation = await prisma.annotation.create({
    data: {
      userId: user.id,
      bookId,
      cfiRange,
      text,
      color: color || "yellow",
      note,
    },
  });

  return NextResponse.json(annotation);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.annotation.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
