"use client";

import { Plus, Heart, Star, Check, X } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

interface BookActionsProps {
  bookId: string;
}

export default function BookActions({ bookId }: BookActionsProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const ratingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    fetch(`/api/user/reading-state?bookId=${bookId}`)
      .then((r) => r.json())
      .then((data) => {
        const s = data.readingState;
        setIsFavorite(s?.status === "favorite");
        setIsInList(s?.status === "want_to_read");
      })
      .catch(() => {});
    fetch(`/api/user/review?bookId=${bookId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.review) setUserRating(data.review.rating);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId, session?.user?.id]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setRatingOpen(false);
      }
    };
    if (ratingOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ratingOpen]);

  const requireAuth = (fn: () => void) => {
    if (!session?.user?.id) {
      signIn();
      return;
    }
    fn();
  };

  const toggleFavorite = () => {
    requireAuth(async () => {
      const newStatus = isFavorite ? null : "favorite";
      setIsFavorite(!isFavorite);
      if (isInList && newStatus === "favorite") {
        setIsInList(false);
      }
      try {
        const res = await fetch("/api/user/reading-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, status: newStatus }),
        });
        if (!res.ok) {
          setIsFavorite(isFavorite);
          if (isInList && newStatus === "favorite") setIsInList(true);
        }
      } catch {
        setIsFavorite(isFavorite);
        if (isInList && newStatus === "favorite") setIsInList(true);
      }
    });
  };

  const toggleList = () => {
    requireAuth(async () => {
      const newStatus = isInList ? null : "want_to_read";
      setIsInList(!isInList);
      if (isFavorite && newStatus === "want_to_read") {
        setIsFavorite(false);
      }
      try {
        const res = await fetch("/api/user/reading-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, status: newStatus }),
        });
        if (!res.ok) {
          setIsInList(isInList);
          if (isFavorite && newStatus === "want_to_read") setIsFavorite(true);
        }
      } catch {
        setIsInList(isInList);
        if (isFavorite && newStatus === "want_to_read") setIsFavorite(true);
      }
    });
  };

  const submitRating = (rating: number) => {
    requireAuth(async () => {
      const prev = userRating;
      setUserRating(rating);
      setRatingOpen(false);
      try {
        const res = await fetch("/api/user/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, rating }),
        });
        if (!res.ok) setUserRating(prev);
      } catch {
        setUserRating(prev);
      }
    });
  };

  const removeRating = () => {
    const prev = userRating;
    setUserRating(null);
    try {
      fetch("/api/user/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, rating: 0 }),
      });
    } catch {
      setUserRating(prev);
    }
  };

  return (
    <div className="flex gap-2 mt-1">
      <button
        onClick={toggleList}
        disabled={loading}
        className={`flex-1 flex flex-col items-center gap-1.5 transition-colors group ${
          isInList ? "text-primary" : "text-gray-400 hover:text-white"
        }`}
      >
        <div
          className={`p-2.5 rounded-full border transition-all ${
            isInList
              ? "border-primary bg-primary/20"
              : "border-gray-700 group-hover:border-primary/50 bg-card group-hover:bg-primary/10"
          }`}
        >
          {isInList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
        <span className="text-[10px]">{isInList ? "En lista" : "Mi lista"}</span>
      </button>

      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={`flex-1 flex flex-col items-center gap-1.5 transition-colors group ${
          isFavorite ? "text-red-400" : "text-gray-400 hover:text-white"
        }`}
      >
        <div
          className={`p-2.5 rounded-full border transition-all ${
            isFavorite
              ? "border-red-400 bg-red-400/20"
              : "border-gray-700 group-hover:border-primary/50 bg-card group-hover:bg-primary/10"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
        </div>
        <span className="text-[10px]">{isFavorite ? "Favorito" : "Favorito"}</span>
      </button>

      <div className="flex-1 relative" ref={ratingRef}>
        <button
          onClick={() => requireAuth(() => setRatingOpen(!ratingOpen))}
          disabled={loading}
          className={`w-full flex flex-col items-center gap-1.5 transition-colors group ${
            userRating ? "text-yellow-400" : "text-gray-400 hover:text-white"
          }`}
        >
          <div
            className={`p-2.5 rounded-full border transition-all ${
              userRating
                ? "border-yellow-400 bg-yellow-400/20"
                : "border-gray-700 group-hover:border-primary/50 bg-card group-hover:bg-primary/10"
            }`}
          >
            <Star className={`w-4 h-4 ${userRating ? "fill-current" : ""}`} />
          </div>
          <span className="text-[10px]">{userRating ? `${userRating}/5` : "Calificar"}</span>
        </button>

        {ratingOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-gray-700 rounded-xl shadow-2xl p-3 z-50 animate-scale-in">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => submitRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || userRating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                </button>
              ))}
              {userRating && (
                <button
                  onClick={removeRating}
                  className="ml-2 p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800"
                  title="Quitar calificación"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
