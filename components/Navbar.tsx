"use client";

import Link from "next/link";
import {
  Search, Bell, User, BookOpen, X, ChevronDown, Menu,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const GENRES = [
  "Ficción Clásica", "Romance", "Terror Gótico", "Ciencia Ficción",
  "Aventura", "Misterio", "Filosofía", "Drama", "Histórico",
  "Fantasía", "Poesía", "Sátira", "Épica", "Novela Psicológica",
];

const LANGS = [
  { code: "", label: "🌍 Todos los idiomas" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "en", label: "🇺🇸 English" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 safe-top ${
        isScrolled
          ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/50"
          : "bg-gradient-to-b from-black/90 to-transparent"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 sm:h-16 gap-3 sm:gap-6">

          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
            className="md:hidden touch-target text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group" onClick={closeMobile}>
            <div className="w-9 h-9 sm:w-8 sm:h-8 bg-primary rounded-md flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span
              className="font-black text-base sm:text-xl tracking-tight gold-text"
            >
              E-Library
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="nav-link">Inicio</Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setGenreOpen(!genreOpen); setLangOpen(false); }}
                className="nav-link flex items-center gap-1"
              >
                Géneros <ChevronDown className={`w-3.5 h-3.5 ${genreOpen ? "rotate-180" : ""}`} />
              </button>
              {genreOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-card/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl p-3 max-h-[70vh] overflow-y-auto">
                  {GENRES.map((g) => (
                    <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} onClick={() => setGenreOpen(false)} className="block text-gray-300 hover:text-primary text-xs px-3 py-2 rounded-lg">
                      {g}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setLangOpen(!langOpen); setGenreOpen(false); }}
                className="nav-link flex items-center gap-1"
              >
                Idioma <ChevronDown className={`w-3.5 h-3.5 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-card/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl p-2">
                  {LANGS.map((lang) => (
                    <Link key={lang.code} href={`/search?language=${lang.code}`} onClick={() => setLangOpen(false)} className="block text-gray-300 hover:text-primary text-sm px-3 py-2 rounded-lg">
                      {lang.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/search?category=award" className="nav-link">🏆 Premios</Link>
            <Link href="/search?category=expiring" className="nav-link">⏰ Expiran</Link>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative flex items-center">
              <form
                onSubmit={handleSearch}
                className={`flex items-center transition-all duration-300 border rounded-full overflow-hidden ${
                  searchOpen
                    ? "w-[min(72vw,18rem)] border-white/30 bg-black/50 backdrop-blur-md px-2 py-1"
                    : "w-11 border-transparent"
                }`}
              >
                <button
                  type="button"
                  aria-label="Buscar"
                  onClick={(e) => {
                    e.preventDefault();
                    if (searchOpen && searchValue) handleSearch(e as React.FormEvent);
                    else if (!searchOpen) {
                      setSearchOpen(true);
                      setTimeout(() => searchRef.current?.focus(), 100);
                    }
                  }}
                  className="touch-target text-gray-300 hover:text-white rounded-full flex items-center justify-center"
                >
                  <Search className="w-5 h-5" />
                </button>
                <input
                  ref={searchRef}
                  type="search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => { if (!searchValue) setSearchOpen(false); }}
                  placeholder="Buscar libros..."
                  className={`text-white text-base sm:text-sm bg-transparent outline-none flex-1 min-w-0 ${
                    searchOpen ? "opacity-100 ml-1" : "w-0 opacity-0 pointer-events-none"
                  }`}
                />
                {searchOpen && (
                  <button type="button" aria-label="Cerrar búsqueda" onClick={() => { setSearchOpen(false); setSearchValue(""); }} className="touch-target text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>

            <button type="button" aria-label="Notificaciones" className="hidden sm:flex touch-target text-gray-300 hover:text-white rounded-full hover:bg-white/10 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-expiring rounded-full" />
            </button>

            <Link href="/admin" className="hidden lg:flex text-xs text-gray-400 hover:text-primary border border-gray-700 px-3 py-2 rounded-full min-h-[44px] items-center">
              Admin
            </Link>

            <Link href="/profile" aria-label="Perfil" className="touch-target p-1 rounded-full hover:bg-white/10">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {(genreOpen || langOpen) && (
        <div className="hidden md:block fixed inset-0 z-[-1]" onClick={() => { setGenreOpen(false); setLangOpen(false); }} />
      )}

      {/* Menú móvil */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={closeMobile} aria-hidden />
          <div className="fixed top-0 left-0 bottom-0 w-[min(100vw,320px)] z-50 bg-card border-r border-gray-800 flex flex-col md:hidden safe-top safe-bottom animate-slide-left">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <span className="font-black gold-text">Menú</span>
              <button type="button" aria-label="Cerrar menú" onClick={closeMobile} className="touch-target text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              <Link href="/" onClick={closeMobile} className="mobile-nav-item">Inicio</Link>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-4 mb-2 px-3">Idioma</p>
              {LANGS.map((l) => (
                <Link key={l.code} href={`/search?language=${l.code}`} onClick={closeMobile} className="mobile-nav-item">{l.label}</Link>
              ))}
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-4 mb-2 px-3">Géneros</p>
              {GENRES.map((g) => (
                <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} onClick={closeMobile} className="mobile-nav-item text-sm">{g}</Link>
              ))}
              <Link href="/search?category=award" onClick={closeMobile} className="mobile-nav-item mt-4">🏆 Premios</Link>
              <Link href="/search?category=expiring" onClick={closeMobile} className="mobile-nav-item">⏰ Expiran pronto</Link>
              <Link href="/admin" onClick={closeMobile} className="mobile-nav-item">⚙️ Administración</Link>
            </nav>
          </div>
        </>
      )}
    </nav>
  );
}
