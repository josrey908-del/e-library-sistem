"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Esconder la splash screen después de 2.5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Animación del libro usando framer-motion */}
          <motion.div
            initial={{ scale: 0.5, rotateY: 90, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            {/* Brillo detrás del libro */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.5 }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
            />
            
            <BookOpen className="w-24 h-24 text-primary relative z-10" strokeWidth={1.5} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-6 text-center"
          >
            <h1
              className="text-3xl font-black tracking-tight"
              style={{
                background: "linear-gradient(135deg, #D4A853, #F5C842)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              E-Library Stream
            </h1>
            <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase">
              Cargando catálogo...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
