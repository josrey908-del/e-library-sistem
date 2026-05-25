"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import BookCard, { BookProps } from "./BookCard";

interface CarouselProps {
  title: string;
  books: BookProps[];
  accentColor?: "gold" | "red" | "purple" | "white";
  badge?: string; // Ej: "NUEVO", "🔥 HOT"
}

const accentStyles: Record<string, string> = {
  gold:   "linear-gradient(90deg, #ffffff 0%, #D4A853 60%, #F5C842 100%)",
  red:    "linear-gradient(90deg, #ffffff 0%, #E50914 100%)",
  purple: "linear-gradient(90deg, #ffffff 0%, #9B59B6 100%)",
  white:  "linear-gradient(90deg, #ffffff 0%, #aaaaaa 100%)",
};

export default function Carousel({ title, books, accentColor = "gold", badge }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left"
      ? -scrollRef.current.clientWidth * 0.75
      : scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  if (!books.length) return null;

  return (
    <div className="mb-10 relative group">
      {/* ── Cabecera ── */}
      <div className="flex items-center gap-3 px-4 sm:px-8 mb-4">
        <div
          className="w-1 h-7 rounded-full flex-shrink-0"
          style={{ background: accentStyles[accentColor] }}
        />
        <h2
          className="text-xl md:text-2xl font-black tracking-tight"
          style={{
            background: accentStyles[accentColor],
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </h2>
        {badge && (
          <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ml-1 animate-pulse">
            {badge}
          </span>
        )}
        {/* "Ver todo" link */}
        <span className="ml-auto text-gray-500 hover:text-primary text-xs font-medium cursor-pointer transition-colors hover:underline flex-shrink-0">
          Ver todo →
        </span>
      </div>

      {/* ── Carrusel ── */}
      <div className="relative">
        {/* Botón izquierda */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 sm:w-14 bg-gradient-to-r from-background via-background/80 to-transparent flex items-center justify-start pl-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <span className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors border border-white/10">
              <ChevronLeft className="w-6 h-6 text-white" />
            </span>
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-3 overflow-x-auto hide-scrollbar px-4 sm:px-8 pb-8 pt-2 scroll-smooth -webkit-overflow-scrolling-touch"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {books.map((book) => (
            <div key={book.id} style={{ scrollSnapAlign: "start" }} className="flex-shrink-0 w-[8.5rem] sm:w-40">
              <BookCard book={book} />
            </div>
          ))}
        </div>

        {/* Botón derecha */}
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 sm:w-14 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <span className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors border border-white/10">
              <ChevronRight className="w-6 h-6 text-white" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
