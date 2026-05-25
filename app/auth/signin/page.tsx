import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import AuthForm from "./AuthForm";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-primary/30 rounded-full" />
        <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-primary/20 rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-gold-light rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-primary/30">
            <BookOpen className="w-8 h-8 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black">
            <span className="gold-text">E-Library</span>{" "}
            <span className="text-white">Stream</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Tu biblioteca digital, siempre contigo
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-card/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <AuthForm />
        </div>

        {/* Footer */}
        <p className="text-gray-700 text-xs text-center mt-8">
          Al continuar, aceptas nuestros{" "}
          <span className="text-gray-500 underline cursor-pointer hover:text-gray-300 transition-colors">
            Términos y Condiciones
          </span>
        </p>
      </div>
    </div>
  );
}
