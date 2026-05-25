import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export const metadata = {
  title: "Buscar Libros | E-Library Stream",
  description: "Busca libros por título, autor, género o idioma",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background pt-20 pb-24">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
            <div className="mb-8">
              <div className="h-10 w-48 rounded-xl shimmer mb-2" />
              <div className="h-4 w-32 rounded shimmer" />
            </div>
            <div className="h-12 w-full max-w-2xl rounded-xl shimmer mb-8" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-md shimmer" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
