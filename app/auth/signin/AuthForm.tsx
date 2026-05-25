"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) { setError("El nombre es obligatorio"); setLoading(false); return; }
        const res = await signIn("credentials", {
          email,
          password,
          name: name.trim(),
          action: "signup",
          redirect: false,
        });
        if (res?.error) {
          if (res.error === "CredentialsSignin" || res.code === "El correo ya está registrado") {
            setError("El correo ya está registrado");
          } else {
            setError(decodeURIComponent(res.error.replace("CredentialsSignin", "")) || "Error al registrarse");
          }
          setLoading(false);
          return;
        }
        setSuccess(true);
        setTimeout(() => { router.push("/"); router.refresh(); }, 800);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        action: "signin",
        redirect: false,
      });
      if (res?.error) {
        setError("Correo o contraseña incorrectos");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 800);
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-white font-bold text-lg">
          {isSignUp ? "¡Cuenta creada!" : "¡Bienvenido de vuelta!"}
        </p>
        <p className="text-gray-500 text-sm mt-1">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Título interno */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-white">
          {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {isSignUp
            ? "Regístrate para empezar a leer"
            : "Accede a tu biblioteca personal"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Nombre (solo registro) */}
      <div className={`transition-all duration-300 overflow-hidden ${isSignUp ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
            required={isSignUp}
            minLength={2}
            className="w-full bg-gray-900/50 border border-gray-700 text-white pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Email */}
      <div className="relative group">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          required
          className="w-full bg-gray-900/50 border border-gray-700 text-white pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
      </div>

      {/* Password */}
      <div className="relative group">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
        <input
          type={showPw ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín. 6 caracteres)"
          required
          minLength={6}
          className="w-full bg-gray-900/50 border border-gray-700 text-white pl-11 pr-11 py-3.5 rounded-xl text-sm placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-gold-light text-black font-bold py-3.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando...
          </>
        ) : isSignUp ? (
          "Crear cuenta gratuita"
        ) : (
          "Iniciar sesión"
        )}
      </button>

      {/* Alternar modo */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800" />
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">
        {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="text-primary hover:text-gold-light font-bold transition-colors"
        >
          {isSignUp ? "Inicia sesión" : "Regístrate gratis"}
        </button>
      </p>
    </form>
  );
}
