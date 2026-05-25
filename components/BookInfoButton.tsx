"use client";

import { useState, useRef, useEffect } from "react";
import { Info, ExternalLink, X, Star, Clock } from "lucide-react";

interface BookInfoButtonProps {
  title: string;
  author: string;
  description: string | null;
  source: string;
  downloadUrl: string | null;
  publishedYear: number | null;
  readingTimeMin: number | null;
  ratingAvg: number;
}

export default function BookInfoButton(props: BookInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="touch-target min-h-[48px] w-12 flex-shrink-0 border border-gray-600 text-gray-300 rounded-xl flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
        aria-label="Más información"
      >
        <Info className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 z-50 animate-scale-in">
          <div className="bg-card border border-gray-700 rounded-xl shadow-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-white font-bold text-sm leading-tight">{props.title}</h4>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white flex-shrink-0 mt-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-primary text-xs mb-2">por {props.author}</p>

            <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1 text-green-400 font-bold">
                <Star className="w-3 h-3 fill-current" /> {props.ratingAvg.toFixed(1)}
              </span>
              {props.readingTimeMin && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(props.readingTimeMin / 60)}h {props.readingTimeMin % 60}m
                </span>
              )}
              {props.publishedYear && (
                <span>{props.publishedYear > 0 ? props.publishedYear : "Antigüedad"}</span>
              )}
            </div>

            {props.description && (
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-3">
                {props.description}
              </p>
            )}

            {props.downloadUrl && (
              <a
                href={props.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:text-gold-light text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Ver en {props.source}
              </a>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-card border-r border-b border-gray-700 rotate-45" />
        </div>
      )}
    </div>
  );
}
