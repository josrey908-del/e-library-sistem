import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const streak = await prisma.readingStreak.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json(streak || { currentStreak: 0, longestStreak: 0 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();
  const streak = await prisma.readingStreak.findUnique({ where: { userId: user.id } });

  if (!streak) {
    const newStreak = await prisma.readingStreak.create({
      data: { userId: user.id, currentStreak: 1, lastReadAt: now, longestStreak: 1 },
    });
    return NextResponse.json(newStreak);
  }

  const lastRead = new Date(streak.lastReadAt);
  const diffDays = Math.floor((now.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24));

  let updatedStreak = streak.currentStreak;
  let updatedLongest = streak.longestStreak;

  if (diffDays === 1) {
    // Consecutive day
    updatedStreak += 1;
  } else if (diffDays > 1) {
    // Streak broken
    updatedStreak = 1;
  }
  // If diffDays === 0, it's the same day, do nothing to currentStreak

  if (updatedStreak > updatedLongest) updatedLongest = updatedStreak;

  const result = await prisma.readingStreak.update({
    where: { userId: user.id },
    data: {
      currentStreak: updatedStreak,
      lastReadAt: now,
      longestStreak: updatedLongest,
    },
  });

  return NextResponse.json(result);
}
