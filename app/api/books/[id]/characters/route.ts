import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const characters = await prisma.character.findMany({
    where: { bookId: params.id },
  });

  return NextResponse.json(characters);
}
