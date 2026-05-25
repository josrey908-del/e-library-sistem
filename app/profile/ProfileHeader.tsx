"use client";

import { useState, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  BookOpen,
  Clock,
  Flame,
  Zap,
  BarChart3,
  Heart,
  List,
  Camera,
  Check,
  X,
  Loader2,
  Pencil,
  User as UserIcon,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface StatsData {
  completed: number;
  reading: number;
  streak: number;
  avgSpeed: number;
  totalPages: number;
  favorites: number;
  wantToRead: number;
}

export default function ProfileHeader({
  user,
  stats,
}: {
  user: UserData;
  stats: StatsData;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no puede superar los 2MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.image) {
        setAvatarUrl(data.image + "?t=" + Date.now());
        router.refresh();
      }
    } catch {
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const saveName = async () => {
    if (name.trim().length < 2) return;
    setSavingName(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setEditingName(false);
      router.refresh();
    } catch {
      alert("Error al guardar");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="bg-card border border-gray-800 rounded-2xl p-8 mb-12 shadow-2xl">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/40 bg-gray-800">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user.name}
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-16 h-16 text-primary" />
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary text-black rounded-full flex items-center justify-center border-4 border-card hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white text-3xl font-black px-3 py-1 rounded-lg outline-none focus:border-primary w-64"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") { setEditingName(false); setName(user.name); }
                  }}
                />
                <button onClick={saveName} disabled={savingName} className="text-green-400 hover:text-green-300 p-1">
                  {savingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
                <button onClick={() => { setEditingName(false); setName(user.name); }} className="text-gray-500 hover:text-gray-300 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-black text-white">{user.name}</h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-gray-500 hover:text-primary transition-colors p-1"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-gray-400 mb-6">{user.email}</p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <StatBadge icon={BookOpen} value={stats.completed} label="Leídos" color="text-primary" />
            <StatBadge icon={Clock} value={stats.reading} label="Leyendo" color="text-expiring" />
            <StatBadge icon={Heart} value={stats.favorites} label="Favoritos" color="text-red-400" />
            <StatBadge icon={List} value={stats.wantToRead} label="Mi lista" color="text-blue-400" />
            <StatBadge icon={Flame} value={stats.streak} label="Racha" color="text-orange-500" />
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md">
            <MiniStat icon={Zap} value={stats.avgSpeed} unit="Pág/h" label="Velocidad" color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/30" />
            <MiniStat icon={BarChart3} value={stats.totalPages} unit="" label="Páginas" color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/30" />
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col gap-3">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  return (
    <div className="bg-black/50 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-white font-bold text-sm">{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, value, unit, label, color, bg, border }: { icon: any; value: number; unit: string; label: string; color: string; bg: string; border: string }) {
  return (
    <div className={`${bg} ${border} border p-3 rounded-xl`}>
      <div className={`flex items-center gap-2 ${color} mb-1`}>
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-white">
        {value} <span className="text-[10px] text-gray-500">{unit}</span>
      </p>
    </div>
  );
}
