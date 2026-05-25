"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight, Award, Clock } from "lucide-react";

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

interface HeroSliderProps {
  books: HeroBook[];
}

function getDaysLeft(until: string | null): number | null {
  if (!until) return null;
  const diff = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function HeroSlider({ books }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const goTo = useCallback(
    (index: number, dir: "left" | "right" = "right") => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setAnimating(false);
      }, 500);
    },
    [animating]
  );

  const next = useCallback(() => {
    goTo((current + 1) % books.length, "right");
  }, [current, books.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + books.length) % books.length, "left");
  }, [current, books.length, goTo]);

  // Auto-avance cada 8 segundos
  useEffect(() => {
    if (books.length <= 1) return;
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next, books.length]);

  if (!books.length) return null;

  const book = books[current];
  const daysLeft = getDaysLeft(book.availableUntil);
  const genres = (() => {
    try { return JSON.parse(book.genres) as string[]; }
    catch { return [book.genres]; }
  })();

  return (
    <div className="relative h-[min(88vh,820px)] min-h-[420px] sm:min-h-[520px] md:min-h-[600px] w-full overflow-hidden bg-background pt-14 sm:pt-16">
      {/* ── Imagen de fondo ── */}
      <div
        key={current}
        className={`absolute inset-0 transition-opacity duration-700 ${animating ? "opacity-0" : "opacity-100"}`}
      >
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            priority
            className="object-cover object-center scale-105"
            sizes="100vw"
            style={{ filter: "blur(2px) brightness(0.5)" }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
        )}

        {/* Portada del libro (oculta en móvil muy pequeño — el fondo ya muestra la imagen) */}
        <div className="absolute inset-0 hidden sm:flex items-center justify-end pr-6 md:pr-24 pointer-events-none">
          <div
            className={`w-36 sm:w-44 md:w-72 aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl transition-all duration-700 ${
              animating ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"
            }`}
            style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,168,83,0.2)" }}
          >
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="300px" />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
            )}
          </div>
        </div>

        {/* Gradientes de overlay */}
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 hero-overlay-bottom" />
      </div>

      {/* ── Contenido ── */}
      <div className="absolute inset-0 flex items-center">
        <div
          className={`px-6 sm:px-12 md:px-20 max-w-2xl transition-all duration-700 ${
            animating ? "opacity-0 -translate-x-8" : "opacity-100 translate-x-0"
          }`}
        >
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {book.award && (
              <span className="flex items-center gap-1 bg-award/20 border border-award/50 text-award-light text-xs font-bold px-3 py-1 rounded-full award-glow">
                <Award className="w-3 h-3" />
                {book.award}
              </span>
            )}
            {daysLeft !== null && daysLeft <= 30 && (
              <span className="flex items-center gap-1 bg-expiring/20 border border-expiring/50 text-red-300 text-xs font-bold px-3 py-1 rounded-full expiring-badge">
                <Clock className="w-3 h-3" />
                {daysLeft === 0 ? "¡Último día!" : `${daysLeft} días restantes`}
              </span>
            )}
            <span className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              {book.publishedYear && book.publishedYear > 0 ? book.publishedYear : "Antigüedad Clásica"}
            </span>
          </div>

          {/* Título */}
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-black font-serif text-white mb-3 leading-tight"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.8)" }}
          >
            <span className="gold-text">{book.title}</span>
          </h1>

          {/* Autor */}
          <p className="text-lg md:text-xl text-primary font-semibold mb-3">
            por <span className="text-white">{book.author}</span>
          </p>

          {/* Rating y géneros */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-green-400 font-bold">★ {book.ratingAvg.toFixed(1)}</span>
            <span className="text-gray-500">•</span>
            {genres.slice(0, 2).map((g) => (
              <span key={g} className="text-gray-300 text-sm border border-gray-600 px-2 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>

          {/* Descripción */}
          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 line-clamp-3 max-w-xl">
            {book.description || "Una obra maestra de la literatura universal."}
          </p>

          {/* Botones */}
          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              href={`/read/${book.id}`}
              className="touch-target flex items-center justify-center gap-2 bg-primary text-black font-black px-6 py-3 sm:px-7 rounded-lg text-base hover:bg-gold-light transition-all shadow-lg"
            >
              <Play className="w-5 h-5 fill-current" />
              Leer Ahora
            </Link>
            <Link
              href={`/book/${book.id}`}
              className="touch-target flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-6 py-3 sm:px-7 rounded-lg text-base hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
            >
              <Info className="w-5 h-5" />
              Más Info
            </Link>
          </div>
        </div>
      </div>

      {/* ── Controles de navegación ── */}
      {books.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110 backdrop-blur-sm border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110 backdrop-blur-sm border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicadores de posición */}
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {books.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > current ? "right" : "left")}
                className={`transition-all rounded-full ${
                  i === current
                    ? "w-8 h-2 bg-primary"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Fade inferior hacia el contenido ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
