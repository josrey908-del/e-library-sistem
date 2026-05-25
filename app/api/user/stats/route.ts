import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    include: {
      stats: true,
      streaks: true,
      readingStates: {
        where: { status: "finished" },
      }
    }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    stats: user.stats || { totalMinutesRead: 0, totalPagesRead: 0, avgReadingSpeed: 0 },
    streak: user.streaks || { currentStreak: 0, longestStreak: 0 },
    finishedBooks: user.readingStates.length,
  });
}
