import HeroSlider from "@/components/HeroSlider";
import Carousel from "@/components/Carousel";
import TopTenRow from "@/components/TopTenRow";
import { BookProps } from "@/components/BookCard";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBooks } from "@/lib/books-queries";

// Interfaces específicas para componentes
interface HeroBook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  genres: string;
  ratingAvg: number;
  publishedYear: number | null;
  award: string | null;
  availableUntil: string | null;
}

export default async function Home() {
  const session = await auth();
  
  // Obtener estado de lectura si está logueado
  let readingBooks: any[] = [];
  let completedBooks: any[] = [];
  
  if (session?.user?.id) {
    const states = await prisma.readingState.findMany({
      where: { userId: session.user.id },
      include: { book: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    readingBooks = states.filter(s => s.status === 'reading' && s.progress < 100).map(s => s.book);
    completedBooks = states.filter(s => s.status === 'finished' || s.progress >= 100).map(s => s.book);
  }

  // Carga en paralelo de todas las categorías
  const fetchBooks = (overrides: Record<string, string | number>) =>
    getBooks(overrides).then(r => r.books);

  const [featured, top10, expiring, awards, trending, classics, spanish, melancolico, motivador] = await Promise.all([
    fetchBooks({ category: "featured", limit: 6 }),
    fetchBooks({ category: "top10", limit: 10 }),
    fetchBooks({ category: "expiring", limit: 8 }),
    fetchBooks({ category: "award", limit: 10 }),
    fetchBooks({ category: "trending", limit: 12 }),
    fetchBooks({ language: "en", limit: 12 }),
    fetchBooks({ language: "es", limit: 10 }),
    fetchBooks({ mood: "Melancólico", limit: 10 }),
    fetchBooks({ mood: "Motivador", limit: 10 }),
  ]);

  // Transformar para el Hero (asegurar nulls en lugar de undefined)
  const mapToHero = (b: any): HeroBook => ({
    ...b,
    description: b.description ?? null,
    coverUrl: b.coverUrl ?? null,
    publishedYear: b.publishedYear ?? null,
    award: b.award ?? null,
    availableUntil: b.availableUntil ? new Date(b.availableUntil).toISOString() : null,
  });

  const heroBooks = (featured.length > 0 ? featured : trending.slice(0, 5)).map(mapToHero);

  return (
    <div className="relative min-h-screen bg-background">

      {/* ══ Hero Animado ══════════════════════════════════════════════════════ */}
      <HeroSlider books={heroBooks} />

      {/* ══ Contenido principal ═══════════════════════════════════════════════ */}
      <div className="-mt-12 relative z-10 pb-24">
      
        {/* Continuar Leyendo */}
        {readingBooks.length > 0 && (
          <Carousel
            title="Continuar Leyendo"
            books={readingBooks}
            accentColor="gold"
          />
        )}
        
        {/* Completados */}
        {completedBooks.length > 0 && (
          <Carousel
            title="Completados al 100%"
            books={completedBooks}
            accentColor="white"
            badge="✔️ 100%"
          />
        )}

        {/* Top 10 */}
        {top10.length > 0 && <TopTenRow books={top10 as any} />}

        {/* ⏰ Expiran pronto — con banner urgente */}
        {expiring.length > 0 && (
          <div className="mb-2 mx-4 sm:mx-8 bg-expiring/10 border border-expiring/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl animate-bounce-soft">⏰</span>
            <div>
              <p className="text-expiring font-black text-sm">¡Disponibles por tiempo limitado!</p>
              <p className="text-gray-400 text-xs">Estos libros dejarán de estar disponibles pronto. ¡Léelos antes de que sea tarde!</p>
            </div>
          </div>
        )}
        {expiring.length > 0 && (
          <Carousel
            title="Últimos días disponibles"
            books={expiring}
            accentColor="red"
            badge="⏰ EXPIRAN"
          />
        )}

        {/* 🏆 Ganadores de premios */}
        {awards.length > 0 && (
          <Carousel
            title="Ganadores de Premios"
            books={awards}
            accentColor="purple"
            badge="🏆"
          />
        )}

        {/* 🔥 Tendencias */}
        {trending.length > 0 && (
          <Carousel
            title="Tendencias de la Comunidad"
            books={trending}
            accentColor="gold"
            badge="🔥 HOT"
          />
        )}

        {/* 📚 Clásicos en inglés */}
        {classics.length > 0 && (
          <Carousel
            title="Clásicos en Inglés"
            books={classics}
            accentColor="white"
          />
        )}

        {/* 🇪🇸 En español */}
        {spanish.length > 0 && (
          <Carousel
            title="Clásicos en Español"
            books={spanish}
            accentColor="gold"
          />
        )}

        {/* 🎭 Por Mood: Melancólico */}
        {melancolico.length > 0 && (
          <Carousel
            title="Para cuando necesitas llorar"
            books={melancolico}
            accentColor="purple"
            badge="🎭"
          />
        )}

        {/* ⚡ Por Mood: Motivador */}
        {motivador.length > 0 && (
          <Carousel
            title="Para motivarte y seguir"
            books={motivador}
            accentColor="gold"
            badge="⚡"
          />
        )}

        {/* Si no hay nada en DB aún */}
        {heroBooks.length === 0 && top10.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center px-8">
            <span className="text-6xl mb-6">📚</span>
            <h2 className="text-2xl font-black text-white mb-3">La biblioteca está vacía</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              Ejecuta el seed para llenar la plataforma con{" "}
              <strong className="text-primary">20+ libros reales</strong> con sus autores originales,
              portadas y descripiones.
            </p>
            <code className="bg-card border border-gray-700 text-primary text-sm px-6 py-3 rounded-lg font-mono">
              npx prisma db push &amp;&amp; npx ts-node prisma/seed.ts
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
