import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookOpen, Clock, Flame, Zap, BarChart3, LogOut, Settings, Edit3 } from "lucide-react";
import BookCard from "@/components/BookCard";
import ProfileHeader from "./ProfileHeader";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const readingStates = await prisma.readingState.findMany({
    where: { userId: session.user.id },
    include: { book: true },
    orderBy: { updatedAt: "desc" },
  });

  const reading = readingStates.filter((r) => r.status === "reading" && r.progress < 100);
  const completed = readingStates.filter((r) => r.status === "finished" || r.progress >= 100);
  const favorites = readingStates.filter((r) => r.status === "favorite");
  const wantToRead = readingStates.filter((r) => r.status === "want_to_read");

  const streak = await prisma.readingStreak.findUnique({
    where: { userId: session.user.id },
  });

  const stats = await prisma.userStats.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
        <ProfileHeader
          user={{
            id: session.user.id!,
            name: session.user.name || "Usuario",
            email: session.user.email || "",
            image: session.user.image || null,
          }}
          stats={{
            completed: completed.length,
            reading: reading.length,
            streak: streak?.currentStreak || 0,
            avgSpeed: stats?.avgReadingSpeed || 0,
            totalPages: stats?.totalPagesRead || 0,
            favorites: favorites.length,
            wantToRead: wantToRead.length,
          }}
        />

        {reading.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-6 border-b border-gray-800 pb-2">
              Continuar Leyendo
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
              {reading.map((state) => (
                <div key={state.id} className="snap-start relative flex-shrink-0 w-32 sm:w-40">
                  <BookCard book={state.book as any} />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-md overflow-hidden z-20">
                    <div className="h-full bg-primary" style={{ width: `${state.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {wantToRead.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-6 border-b border-gray-800 pb-2">
              Mi Lista
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
              {wantToRead.map((state) => (
                <div key={state.id}>
                  <BookCard book={state.book as any} />
                </div>
              ))}
            </div>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-6 border-b border-gray-800 pb-2">
              Favoritos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
              {favorites.map((state) => (
                <div key={state.id}>
                  <BookCard book={state.book as any} />
                </div>
              ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-6 border-b border-gray-800 pb-2">
              Completados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
              {completed.map((state) => (
                <div key={state.id} className="relative">
                  <BookCard book={state.book as any} />
                  <div className="absolute top-2 right-2 bg-green-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm z-20 shadow-md">
                    100%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reading.length === 0 && completed.length === 0 && (
          <div className="text-center py-20 bg-card rounded-xl border border-gray-800">
            <span className="text-6xl block mb-4">📚</span>
            <h3 className="text-xl font-bold text-white mb-2">Aún no has leído ningún libro</h3>
            <p className="text-gray-400 mb-6">
              Explora nuestra colección y empieza tu primera aventura literaria.
            </p>
            <Link
              href="/"
              className="bg-primary text-black font-black px-8 py-3 rounded-xl hover:bg-gold-light transition-colors"
            >
              Explorar Catálogo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
