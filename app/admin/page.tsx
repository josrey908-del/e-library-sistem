"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen, Edit, Trash2, Plus, Search, Award, Clock,
  Star, Globe, ChevronDown, ChevronUp, X, Check, AlertTriangle
} from "lucide-react";

interface AdminBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  language: string;
  genres: string;
  ratingAvg: number;
  award: string | null;
  availableUntil: string | null;
  topRank: number | null;
  isFeatured: boolean;
  source: string;
  publishedYear: number | null;
}

function getDaysLeft(until: string | null): number | null {
  if (!until) return null;
  return Math.ceil((new Date(until).getTime() - Date.now()) / 86400000);
}

export default function AdminPage() {
  const [books, setBooks]         = useState<AdminBook[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [editBook, setEditBook]   = useState<AdminBook | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{msg: string; type: "ok" | "err"} | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res  = await fetch(`/api/admin/books?${params}`);
      const data = await res.json();
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch { showToast("Error al cargar libros", "err"); }
    finally   { setLoading(false); }
  };

  useEffect(() => { loadBooks(); }, [search]);

  const handleSave = async () => {
    if (!editBook) return;
    setSaving(true);
    try {
      const url    = `/api/admin/books/${editBook.id}`;
      const method = "PATCH";
      const body   = JSON.stringify({
        ...editBook,
        availableUntil: editBook.availableUntil || null,
        topRank: editBook.topRank ? Number(editBook.topRank) : null,
      });
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) throw new Error();
      showToast("✅ Libro actualizado");
      setEditBook(null);
      loadBooks();
    } catch { showToast("Error al guardar", "err"); }
    finally  { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/books/${id}`, { method: "DELETE" });
      showToast("🗑️ Libro eliminado");
      setDeleteId(null);
      loadBooks();
    } catch { showToast("Error al eliminar", "err"); }
  };

  const clearExpiry = async (id: string) => {
    try {
      await fetch(`/api/admin/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableUntil: null }),
      });
      showToast("✅ Fecha de expiración eliminada");
      loadBooks();
    } catch { showToast("Error", "err"); }
  };

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 pb-20 sm:pb-24">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-2 animate-slide-left border ${
          toast.type === "ok"
            ? "bg-green-900/90 border-green-700 text-green-300"
            : "bg-red-900/90 border-red-700 text-red-300"
        }`}>
          {toast.type === "ok" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">
              <span className="gold-text">Panel</span> Administrador
            </h1>
            <p className="text-gray-500 text-sm mt-1">{total} libros en la plataforma</p>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
          >
            ← Volver
          </Link>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total libros",    value: total,                                          icon: BookOpen, color: "text-primary" },
            { label: "Con premios",     value: books.filter(b => b.award).length,              icon: Award,    color: "text-award-light" },
            { label: "Expiran pronto",  value: books.filter(b => { const d = getDaysLeft(b.availableUntil); return d !== null && d <= 30 && d >= 0; }).length, icon: Clock, color: "text-expiring" },
            { label: "Top 10",          value: books.filter(b => b.topRank).length,            icon: Star,     color: "text-rank-gold" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <stat.icon className={`w-8 h-8 ${stat.color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Búsqueda ── */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o autor..."
            className="search-input w-full text-white pl-10 pr-4 py-2.5 rounded-lg text-sm max-w-md"
          />
        </div>

        {/* ── Tabla ── */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg shimmer" />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full admin-table">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-500 text-xs font-bold uppercase px-4 py-3 tracking-wider">Portada</th>
                    <th className="text-left text-gray-500 text-xs font-bold uppercase px-4 py-3 tracking-wider">Libro</th>
                    <th className="text-left text-gray-500 text-xs font-bold uppercase px-4 py-3 tracking-wider hidden md:table-cell">Idioma</th>
                    <th className="text-left text-gray-500 text-xs font-bold uppercase px-4 py-3 tracking-wider hidden lg:table-cell">Premio</th>
                    <th className="text-left text-gray-500 text-xs font-bold uppercase px-4 py-3 tracking-wider">Expiración</th>
                    <th className="text-left text-gray-500 text-xs font-bold uppercase px-4 py-3 tracking-wider hidden md:table-cell">Top</th>
                    <th className="text-right text-gray-500 text-xs font-bold uppercase px-4 py-3 tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {books.map((book) => {
                    const daysLeft = getDaysLeft(book.availableUntil);
                    const isExpired = daysLeft !== null && daysLeft < 0;
                    const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

                    return (
                      <tr key={book.id} className="transition-colors">
                        {/* Portada */}
                        <td className="px-4 py-3">
                          <div className="w-9 h-12 relative rounded overflow-hidden bg-gray-800 flex-shrink-0">
                            {book.coverUrl ? (
                              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="36px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base">📚</div>
                            )}
                          </div>
                        </td>

                        {/* Título y autor */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-white font-bold text-sm line-clamp-1">{book.title}</p>
                          <p className="text-gray-400 text-xs">{book.author}</p>
                          {book.isFeatured && (
                            <span className="text-primary text-[10px] font-bold">⭐ Destacado</span>
                          )}
                        </td>

                        {/* Idioma */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-300 text-xs font-mono uppercase bg-gray-800 px-2 py-0.5 rounded">
                            {book.language === "es" ? "🇪🇸 es" : "🇺🇸 en"}
                          </span>
                        </td>

                        {/* Premio */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {book.award ? (
                            <span className="text-award-light text-xs flex items-center gap-1">
                              <Award className="w-3 h-3 flex-shrink-0" />
                              <span className="line-clamp-1 max-w-[140px]">{book.award}</span>
                            </span>
                          ) : (
                            <span className="text-gray-700 text-xs">—</span>
                          )}
                        </td>

                        {/* Expiración */}
                        <td className="px-4 py-3">
                          {book.availableUntil ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold flex items-center gap-1 ${
                                isExpired ? "text-gray-600" : expiringSoon ? "text-expiring" : "text-gray-400"
                              }`}>
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {isExpired
                                  ? "Expirado"
                                  : daysLeft === 0
                                    ? "¡Hoy!"
                                    : `${daysLeft}d`}
                              </span>
                              <button
                                onClick={() => clearExpiry(book.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors"
                                title="Quitar fecha"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-700 text-xs">Siempre</span>
                          )}
                        </td>

                        {/* Top Rank */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          {book.topRank ? (
                            <span className="text-rank-gold font-black text-sm">#{book.topRank}</span>
                          ) : (
                            <span className="text-gray-700 text-xs">—</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setEditBook(book)}
                              className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(book.id)}
                              className="text-gray-400 hover:text-expiring transition-colors p-1.5 rounded-lg hover:bg-expiring/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══ Modal Editar ══════════════════════════════════════════════════════ */}
      {editBook && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditBook(null)} />
          <div className="relative bg-card border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-card border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-white">Editar Libro</h2>
              <button onClick={() => setEditBook(null)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Título */}
              <div className="sm:col-span-2">
                <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Título</label>
                <input
                  value={editBook.title}
                  onChange={(e) => setEditBook({ ...editBook, title: e.target.value })}
                  className="search-input w-full text-white px-3 py-2.5 rounded-lg text-sm"
                />
              </div>

              {/* Autor */}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Autor</label>
                <input
                  value={editBook.author}
                  onChange={(e) => setEditBook({ ...editBook, author: e.target.value })}
                  className="search-input w-full text-white px-3 py-2.5 rounded-lg text-sm"
                />
              </div>

              {/* Idioma */}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Idioma</label>
                <select
                  value={editBook.language}
                  onChange={(e) => setEditBook({ ...editBook, language: e.target.value })}
                  className="search-input w-full text-white px-3 py-2.5 rounded-lg text-sm bg-card"
                >
                  <option value="es">🇪🇸 Español</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </div>

              {/* Cover URL */}
              <div className="sm:col-span-2">
                <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">URL Portada</label>
                <input
                  value={editBook.coverUrl || ""}
                  onChange={(e) => setEditBook({ ...editBook, coverUrl: e.target.value })}
                  placeholder="https://covers.openlibrary.org/..."
                  className="search-input w-full text-white px-3 py-2.5 rounded-lg text-sm"
                />
              </div>

              {/* Premio */}
              <div className="sm:col-span-2">
                <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Premio ganado</label>
                <input
                  value={editBook.award || ""}
                  onChange={(e) => setEditBook({ ...editBook, award: e.target.value || null })}
                  placeholder="Ej: Premio Nobel, Man Booker Prize..."
                  className="search-input w-full text-white px-3 py-2.5 rounded-lg text-sm"
                />
              </div>

              {/* Fecha de expiración */}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
                  Disponible hasta <span className="text-gray-600 normal-case">(vacío = siempre)</span>
                </label>
                <input
                  type="date"
                  value={editBook.availableUntil ? editBook.availableUntil.split("T")[0] : ""}
                  onChange={(e) => setEditBook({
                    ...editBook,
                    availableUntil: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })}
                  className="search-input w-full text-white px-3 py-2.5 rounded-lg text-sm [color-scheme:dark]"
                />
                {editBook.availableUntil && (
                  <button
                    onClick={() => setEditBook({ ...editBook, availableUntil: null })}
                    className="text-expiring text-xs mt-1 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Quitar fecha de expiración
                  </button>
                )}
              </div>

              {/* Top Rank */}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
                  Posición Top 10 <span className="text-gray-600 normal-case">(1-10, vacío = no aplica)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editBook.topRank ?? ""}
                  onChange={(e) => setEditBook({ ...editBook, topRank: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="1 - 10"
                  className="search-input w-full text-white px-3 py-2.5 rounded-lg text-sm"
                />
              </div>

              {/* Destacado */}
              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  onClick={() => setEditBook({ ...editBook, isFeatured: !editBook.isFeatured })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${editBook.isFeatured ? "bg-primary" : "bg-gray-700"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editBook.isFeatured ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="text-gray-300 text-sm font-medium">
                  ⭐ Mostrar en el Hero principal
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-card border-t border-gray-800 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setEditBook(null)}
                className="px-5 py-2.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-black font-black rounded-lg text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? "Guardando..." : <><Check className="w-4 h-4" /> Guardar cambios</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Confirmar Eliminar ══════════════════════════════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-card border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-expiring/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-expiring" />
              </div>
              <h3 className="text-lg font-black text-white">¿Eliminar libro?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Esta acción es irreversible. El libro y todos sus datos asociados serán eliminados permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:border-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2.5 bg-expiring text-white rounded-lg text-sm font-black hover:bg-red-500 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
