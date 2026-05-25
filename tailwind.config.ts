import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        foreground: "#E8E8E8",
        primary: "#D4A853",       // Dorado principal
        secondary: "#E0883A",     // Naranja acento
        card: "#141414",
        cardHover: "#1F1F1F",
        "gold-light": "#F5C842",
        "gold-dark": "#A07828",
        "award": "#9B59B6",       // Púrpura para premios
        "award-light": "#BF7ADB",
        "expiring": "#E74C3C",    // Rojo urgente para expiración
        "expiring-glow": "#FF6B6B",
        "top10": "#E50914",       // Rojo Netflix para top10
        "rank-gold": "#FFD700",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-merriweather)", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-left": "slideLeft 0.4s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "pulse-red": "pulseRed 1.5s ease-in-out infinite",
        "hero-slide": "heroSlide 0.8s cubic-bezier(0.16,1,0.3,1) forwards",
        "ticker": "ticker 30s linear infinite",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        "number-glow": "numberGlow 2s ease-in-out infinite",
        "bounce-soft": "bounceSoft 1s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(212,168,83,0.4)" },
          "50%": { boxShadow: "0 0 20px 6px rgba(212,168,83,0.8)" },
        },
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(231,76,60,0.4)" },
          "50%": { boxShadow: "0 0 20px 6px rgba(231,76,60,0.8)" },
        },
        heroSlide: {
          "0%": { opacity: "0", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        numberGlow: {
          "0%, 100%": { textShadow: "0 0 10px rgba(229,9,20,0.5)" },
          "50%": { textShadow: "0 0 30px rgba(229,9,20,1), 0 0 60px rgba(229,9,20,0.5)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D4A853, #F5C842, #A07828)",
        "hero-overlay": "linear-gradient(to right, rgba(10,10,10,0.95) 40%, rgba(10,10,10,0.4) 100%)",
        "card-shimmer": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
export default config;

