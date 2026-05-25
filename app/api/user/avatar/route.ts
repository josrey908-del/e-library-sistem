import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "png";
    const fileName = `avatar-${session.user.id}.${ext}`;
    const dirPath = path.join(process.cwd(), "public", "avatars");
    const filePath = path.join(dirPath, fileName);

    await mkdir(dirPath, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const avatarUrl = `/avatars/${fileName}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl },
    });

    return NextResponse.json({ image: avatarUrl });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
