import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const merriweather = Merriweather({ weight: ["300", "400", "700"], subsets: ["latin"], variable: "--font-merriweather" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "E-Library Stream",
  description: "Plataforma de Lectura Digital Estilo Netflix",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.cdnfonts.com/css/opendyslexic" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Providers>
          <SplashScreen />
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
