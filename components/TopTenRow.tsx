"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Award, Clock } from "lucide-react";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TopBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  topRank: number | null;
  ratingAvg: number;
  genres: string;
  award: string | null;
  availableUntil: string | null;
}

export default function TopTenRow({ books }: { books: TopBook[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -scrollRef.current.clientWidth * 0.7 : scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!books.length) return null;

  return (
    <div className="mb-12 relative">
      {/* Título de sección */}
      <div className="flex items-center gap-3 px-4 sm:px-8 mb-5">
        <div className="w-1 h-8 bg-top10 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-black">
          <span className="text-white">Top </span>
          <span style={{
            background: "linear-gradient(90deg, #E50914, #FF4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>10</span>
          <span className="text-white"> Esta Semana</span>
        </h2>
      </div>

      {/* Carrusel */}
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 w-12 z-20 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto hide-scrollbar px-4 sm:px-8 pb-6 pt-2 gap-0"
        >
          {books
            .sort((a, b) => (a.topRank ?? 99) - (b.topRank ?? 99))
            .map((book, idx) => (
              <TopCard key={book.id} book={book} index={idx} />
            ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 w-12 z-20 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}

function getDaysLeft(until: string | null): number | null {
  if (!until) return null;
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 86400000));
}

function TopCard({ book, index }: { book: TopBook; index: number }) {
  const daysLeft = getDaysLeft(book.availableUntil);

  return (
    <div
      className="relative flex-shrink-0 flex items-end px-4"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Número grande */}
      <div className="absolute left-[-15px] bottom-6 z-10 flex items-end justify-end w-24">
        <span className="top10-number select-none">
          {book.topRank ?? index + 1}
        </span>
      </div>

      {/* Portada */}
      <Link href={`/book/${book.id}`} className="relative flex-shrink-0 w-32 sm:w-40 group/card z-20 ml-12">
        <div
          className="aspect-[2/3] relative rounded-md overflow-hidden transition-all duration-300 group-hover/card:scale-105 group-hover/card:shadow-2xl"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }}
        >
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
          )}

          {/* Overlay en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100">
            <div className="bg-white text-black rounded-full p-3">
              <Play className="w-5 h-5 fill-current" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {book.award && (
              <span className="bg-award/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                <Award className="w-2.5 h-2.5" />
                Premio
              </span>
            )}
            {daysLeft !== null && daysLeft <= 30 && (
              <span className="bg-expiring/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm expiring-badge">
                <Clock className="w-2.5 h-2.5" />
                {daysLeft}d
              </span>
            )}
          </div>
        </div>

        {/* Info debajo */}
        <div className="mt-2 px-1">
          <p className="text-white text-xs font-bold line-clamp-1">{book.title}</p>
          <p className="text-gray-400 text-[10px] line-clamp-1">{book.author}</p>
          <span className="text-green-400 text-[10px] font-bold">★ {book.ratingAvg.toFixed(1)}</span>
        </div>
      </Link>
    </div>
  );
}
