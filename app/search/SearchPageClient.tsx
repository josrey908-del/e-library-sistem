"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import BookCard, { BookProps } from "@/components/BookCard";

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<BookProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams(searchParams.toString());
        const res = await fetch(`/api/books?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Error al obtener libros");
        const data = await res.json();
        setBooks(data.books || []);
      } catch (err) {
        console.error(err);
        setError("Ocurrió un error al cargar los libros.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchParams]);

  const search = searchParams.get("search");
  const genre = searchParams.get("genre");
  const language = searchParams.get("language");
  const category = searchParams.get("category");

  let title = "Explorar Libros";
  if (search) title = `Resultados para "${search}"`;
  else if (genre) title = `Libros de ${genre}`;
  else if (category === "expiring") title = "Expiran Pronto";
  else if (category === "award") title = "Libros Premiados";
  else if (category === "top10") title = "Top 10 Más Leídos";
  else if (category === "trending") title = "Tendencias Actuales";
  else if (language === "es") title = "Libros en Español";
  else if (language === "en") title = "Libros en Inglés";

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 pb-20 sm:pb-24">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-6 sm:mb-8 border-b border-gray-800 pb-4">
          <span className="gold-text">{title}</span>
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-full aspect-[2/3] rounded-md shimmer" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</div>
        ) : books.length === 0 ? (
          <div className="text-gray-400 py-12 text-center bg-card rounded-xl border border-gray-800">
            <span className="text-4xl block mb-3">📚</span>
            No se encontraron libros que coincidan con tu búsqueda.
          </div>
        ) : (
          <div className="book-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
