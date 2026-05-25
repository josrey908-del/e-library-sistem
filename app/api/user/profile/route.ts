import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
