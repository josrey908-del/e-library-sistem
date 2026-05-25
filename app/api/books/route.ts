import { NextResponse } from "next/server";
import { getBooks } from "@/lib/books-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await getBooks({
      search:   searchParams.get("search") || undefined,
      author:   searchParams.get("author") || undefined,
      genre:    searchParams.get("genre") || undefined,
      language: searchParams.get("language") || undefined,
      category: searchParams.get("category") || undefined,
      mood:     searchParams.get("mood") || undefined,
      limit:    parseInt(searchParams.get("limit") || "20"),
      page:     parseInt(searchParams.get("page") || "1"),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/books]", error);
    return NextResponse.json(
      { error: "Error al obtener libros" },
      { status: 500 }
    );
  }
}
