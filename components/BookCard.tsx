"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Plus, Info, Award, Clock } from "lucide-react";
import { useState } from "react";

export interface BookProps {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  genres: string;
  ratingAvg: number;
  readingTimeMin?: number | null;
  award?: string | null;
  availableUntil?: string | null;
  topRank?: number | null;
  language?: string;
  description?: string | null;
}

function getDaysLeft(until: string | null | undefined): number | null {
  if (!until) return null;
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 86400000));
}

export default function BookCard({ book }: { book: BookProps }) {
  const [hovered, setHovered] = useState(false);
  const daysLeft = getDaysLeft(book.availableUntil);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30;

  const cover = book.coverUrl || null;
  const genres = (() => {
    try { return JSON.parse(book.genres) as string[]; }
    catch { return [book.genres]; }
  })();

  return (
    <div
      className="relative w-full aspect-[2/3] cursor-pointer group/card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 2500)}
    >
      {/* Tarjeta principal (escala en hover) */}
      <div 
        className={`absolute inset-0 bg-card rounded-md shadow-lg transition-all duration-300 transform-origin-center flex flex-col overflow-hidden ${
          hovered ? "md:scale-[1.12] z-50 shadow-2xl ring-1 ring-primary/30" : "scale-100 z-10"
        }`}
        style={{
          boxShadow: hovered ? "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,168,83,0.3)" : "none",
        }}
      >
        {/* Contenedor de Portada */}
        <div className="relative w-full h-full flex-1">
          {cover ? (
            <Image
              src={cover}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 128px, 160px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 flex flex-col items-center justify-center p-3 text-center">
              <span className="text-4xl mb-2">📚</span>
              <span className="text-white text-[10px] font-bold line-clamp-3">{book.title}</span>
            </div>
          )}

          {/* Overlay gradiente siempre visible (abajo) */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* Info siempre visible */}
          <Link
            href={`/book/${book.id}`}
            className={`absolute top-1.5 right-1.5 z-20 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary/80 hover:scale-110 transition-all ${
              hovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="Más información"
          >
            <Info className="w-3 h-3 text-white" />
          </Link>

          {/* Badge idioma */}
          {book.language && (
            <span
              className={`absolute top-1.5 left-1.5 z-10 text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-sm ${
                book.language === 'es'
                  ? 'bg-primary/90 text-black'
                  : 'bg-white/90 text-black'
              } ${hovered ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            >
              {book.language === 'es' ? 'ES' : 'EN'}
            </span>
          )}

          {/* Badges superiores (ocultos en hover para limpiar vista) */}
          <div className={`absolute top-1.5 left-1.5 flex flex-col gap-1 transition-opacity ${hovered ? 'opacity-0' : 'opacity-100'}`}>
            {book.award && (
              <span className="bg-award/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-sm award-glow">
                <Award className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate max-w-[70px]">Premio</span>
              </span>
            )}
            {isExpiringSoon && (
              <span className="bg-expiring/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-sm expiring-badge">
                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                {daysLeft === 0 ? "¡Hoy!" : `${daysLeft}d`}
              </span>
            )}
          </div>
          
          {/* Título simple (visible cuando no hay hover) */}
          <div className={`absolute bottom-2 left-2 right-2 transition-opacity duration-200 ${hovered ? 'opacity-0' : 'opacity-100'}`}>
            <h3 className="text-white text-xs font-bold line-clamp-1 drop-shadow-md">{book.title}</h3>
          </div>
        </div>

        {/* Detalles en Hover (expandidos desde abajo) */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/80 px-2 pb-2 pt-8 transition-all duration-300 flex flex-col gap-2 ${
            hovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          {/* Botones */}
          <div className="flex items-center gap-2 mt-auto">
            <Link
              href={`/read/${book.id}`}
              className="touch-target flex-1 flex items-center justify-center gap-1 bg-primary text-black text-xs font-black py-2.5 rounded-lg hover:bg-gold-light transition-colors"
            >
              <Play className="w-4 h-4 fill-current" /> Leer
            </Link>
            <Link
              href={`/book/${book.id}`}
              className="touch-target p-2.5 border border-gray-600 text-gray-300 rounded-lg hover:border-white hover:text-white transition-colors flex-shrink-0"
              aria-label="Más información"
            >
              <Info className="w-4 h-4" />
            </Link>
            <button type="button" aria-label="Añadir a lista" className="touch-target p-2.5 border border-gray-600 text-gray-300 rounded-lg hover:border-white flex-shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Info Texto */}
          <div>
            <h3 className="font-black text-white text-[11px] line-clamp-1 leading-tight">{book.title}</h3>
            
            <div className="flex items-center gap-1 mt-1">
              <span className="text-green-400 text-[10px] font-bold">★ {book.ratingAvg.toFixed(1)}</span>
              {book.readingTimeMin && (
                <>
                  <span className="text-gray-500 text-[8px]">•</span>
                  <span className="text-gray-300 text-[9px]">{Math.floor(book.readingTimeMin / 60)}h {book.readingTimeMin % 60}m</span>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mt-1.5">
              {genres.slice(0, 2).map((g) => (
                <span key={g} className="text-gray-400 text-[8px] border border-gray-700 px-1 rounded-sm">{g}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
