import Image from "next/image";
import { Play, Info, Star, Award, Clock, Globe, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DownloadButton from "@/components/DownloadButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BookActions from "@/components/BookActions";
import BookInfoButton from "@/components/BookInfoButton";

type BookFull = {
  id: string;
  workKey: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string | null;
  genres: string;
  language: string;
  downloadUrl: string | null;
  source: string;
  publishedYear: number | null;
  readingTimeMin: number | null;
  ratingAvg: number;
  award: string | null;
  availableUntil: Date | null;
  topRank: number | null;
  isFeatured: boolean;
  isEpisodic: boolean;
  chapters: any[];
};

function getDaysLeft(until: Date | null): number | null {
  if (!until) return null;
  return Math.ceil((until.getTime() - Date.now()) / 86400000);
}

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const book = await prisma.book.findUnique({ 
    where: { id: params.id },
    include: { chapters: { orderBy: [{ season: 'asc' }, { chapterNum: 'asc' }] } }
  }) as unknown as BookFull | null;


  if (!book) notFound();

  const siblingEditions = book.workKey
    ? await prisma.book.findMany({
        where: { workKey: book.workKey },
        select: { id: true, language: true, title: true },
        orderBy: { language: 'asc' },
      })
    : [];

  const daysLeft = getDaysLeft(book.availableUntil);
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
  const genres = (() => {
    try { return JSON.parse(book.genres) as string[]; }
    catch { return [book.genres]; }
  })();

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 pb-20 sm:pb-24">

      {/* ── Banner de expiración ── */}
      {isExpiringSoon && (
        <div className="mx-4 sm:mx-8 max-w-6xl md:mx-auto mb-6 bg-expiring/10 border border-expiring/40 rounded-xl px-5 py-3.5 flex items-center gap-3 expiring-badge">
          <Clock className="w-5 h-5 text-expiring flex-shrink-0" />
          <div>
            <p className="text-expiring font-black text-sm">
              {daysLeft === 0 ? "¡Último día disponible!" : `Disponible por ${daysLeft} días más`}
            </p>
            <p className="text-gray-400 text-xs">
              {book.availableUntil
                ? `Fecha de expiración: ${new Date(book.availableUntil).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
                : ""}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row gap-10">

          {/* ── Columna izquierda: Portada ── */}
          <div className="w-full md:w-72 flex-shrink-0">
            <div
              className="w-full max-w-[14rem] sm:max-w-xs md:max-w-none md:w-full aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl mx-auto md:mx-0"
              style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,168,83,0.15)" }}
            >
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 224px, 288px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 flex flex-col items-center justify-center p-6">
                  <span className="text-6xl mb-4">📚</span>
                  <p className="text-white font-bold text-center text-sm">{book.title}</p>
                </div>
              )}
            </div>

            {/* Botones de acción o Capítulos */}
            <div className="flex flex-col gap-3 mt-6 w-full max-w-[14rem] sm:max-w-xs md:max-w-none mx-auto md:mx-0">
              {!book.isEpisodic ? (
                <>
                  <div className="flex gap-2">
                    <Link
                      href={`/read/${book.id}`}
                      className="touch-target flex-1 min-h-[48px] bg-primary text-black font-black py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-light transition-all shadow-lg"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Leer Ahora
                    </Link>
                    <BookInfoButton
                      title={book.title}
                      author={book.author}
                      description={book.description}
                      source={book.source}
                      downloadUrl={book.downloadUrl}
                      publishedYear={book.publishedYear}
                      readingTimeMin={book.readingTimeMin}
                      ratingAvg={book.ratingAvg}
                    />
                  </div>
                  {book.downloadUrl && (
                    <DownloadButton url={book.downloadUrl} title={book.title} author={book.author} />
                  )}
                </>
              ) : (
                <div className="bg-card border border-gray-800 rounded-xl p-4 mt-2">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                    <Play className="w-4 h-4 text-primary fill-current" /> Capítulos
                  </h3>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    {book.chapters?.map((ch: any) => (
                      <Link 
                        key={ch.id} 
                        href={`/read/${book.id}?chapterUrl=${encodeURIComponent(ch.downloadUrl)}`}
                        className="flex items-center gap-2 p-2 hover:bg-primary/10 rounded-lg text-gray-300 hover:text-white transition-colors group"
                      >
                        <div className="w-6 h-6 rounded bg-gray-800 group-hover:bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                          {ch.chapterNum}
                        </div>
                        <span className="text-sm truncate">{ch.title}</span>
                      </Link>
                    ))}
                    {(!book.chapters || book.chapters.length === 0) && (
                      <p className="text-gray-500 text-xs italic">Próximamente...</p>
                    )}
                  </div>
                </div>
              )}

              <BookActions bookId={book.id} />
            </div>
          </div>

          {/* ── Columna derecha: Info ── */}
          <div className="flex-1 min-w-0">

            <LanguageSwitcher
              currentId={book.id}
              currentLang={book.language}
              editions={siblingEditions}
            />

            {/* Badges premium */}
            <div className="flex flex-wrap gap-2 mb-4">
              {book.award && (
                <span className="flex items-center gap-1.5 bg-award/20 border border-award/50 text-award-light text-xs font-bold px-3 py-1.5 rounded-full award-glow">
                  <Award className="w-3.5 h-3.5" />
                  {book.award}
                </span>
              )}
              {book.language && (
                <span className="flex items-center gap-1.5 bg-white/5 border border-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Globe className="w-3.5 h-3.5" />
                  {book.language === "es" ? "🇪🇸 Español" : "🇺🇸 English"}
                </span>
              )}
              {book.topRank && (
                <span className="flex items-center gap-1.5 bg-top10/20 border border-top10/40 text-red-300 text-xs font-black px-3 py-1.5 rounded-full">
                  🏅 Top #{book.topRank}
                </span>
              )}
            </div>

            {/* Título */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif leading-tight mb-3">
              <span className="gold-text">{book.title}</span>
            </h1>

            {/* Autor */}
            <h2 className="text-lg text-gray-300 mb-5">
              por{" "}
              <Link
                href={`/search?author=${encodeURIComponent(book.author)}`}
                className="text-primary hover:text-gold-light font-bold transition-colors hover:underline"
              >
                {book.author}
              </Link>
            </h2>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-6 pb-6 border-b border-gray-800">
              <div className="flex items-center gap-1 text-green-400 font-bold">
                <Star className="w-4 h-4 fill-current" />
                {book.ratingAvg.toFixed(1)} / 5
              </div>
              {book.readingTimeMin && (
                <>
                  <span className="text-gray-700">•</span>
                  <span>{Math.floor(book.readingTimeMin / 60)}h {book.readingTimeMin % 60}m lectura</span>
                </>
              )}
              {book.publishedYear && (
                <>
                  <span className="text-gray-700">•</span>
                  <span>{book.publishedYear > 0 ? book.publishedYear : "Antigüedad"}</span>
                </>
              )}
              <span className="text-gray-700">•</span>
              <span className="border border-gray-700 px-2 py-0.5 rounded text-xs">{book.source}</span>
            </div>

            {/* Descripción */}
            <p className="text-gray-300 leading-relaxed text-base mb-8">
              {book.description || "Una obra maestra de la literatura universal que ha cautivado a generaciones de lectores."}
            </p>

            {/* Géneros */}
            <div className="flex flex-wrap gap-2 mb-10">
              {genres.map((g) => (
                <Link
                  key={g}
                  href={`/search?genre=${encodeURIComponent(g)}`}
                  className="px-3 py-1.5 bg-card border border-gray-700 hover:border-primary/40 hover:text-primary rounded-full text-sm text-gray-300 transition-all"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Reseñas placeholder */}
            <div className="border-t border-gray-800 pt-8">
              <h3 className="text-xl font-black text-white mb-6">Reseñas de la comunidad</h3>
              <div className="bg-card border border-gray-800 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${book.id}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full bg-gray-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-white text-sm">Lector Entusiasta</p>
                      <div className="flex text-primary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Hace 2 días</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Una obra increíble que te atrapa desde la primera página. La forma en que el autor construye
                      los personajes y el mundo narrativo es simplemente magistral. Recomendado ampliamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
