"use client";

import { Download, Loader2, FileText } from "lucide-react";
import { useState } from "react";
import { convertEpubToPdf } from "@/lib/epubToPdf";

interface DownloadButtonProps {
  url: string;
  title: string;
  author?: string;
}

export default function DownloadButton({ url, title, author }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showEpubOption, setShowEpubOption] = useState(false);

  const handleDownloadEpub = () => {
    setIsDownloading(true);
    setShowEpubOption(false);
    
    const extension = url.split(".").pop()?.toLowerCase() || "epub";
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    
    const link = document.createElement("a");
    link.href = proxyUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setShowEpubOption(false);
    setProgress(0);
    
    try {
      await convertEpubToPdf(url, title, (p) => setProgress(p), author);
    } catch (error) {
      alert("Error al generar el PDF. Por favor intenta de nuevo.");
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative w-full">
      <button
        onClick={handleDownloadPdf}
        disabled={isDownloading}
        className="w-full min-h-[48px] bg-primary hover:bg-gold-light text-black font-black py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-wait shadow-lg text-sm sm:text-base"
      >
        {isDownloading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs uppercase tracking-tighter">
              {progress > 0 ? `Generando PDF ${progress}%` : "Preparando PDF..."}
            </span>
          </div>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Descargar libro (PDF)</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setShowEpubOption((v) => !v)}
        disabled={isDownloading}
        className="mt-2 w-full text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
      >
        {showEpubOption ? "Ocultar formato EPUB" : "¿Prefieres el EPUB original?"}
      </button>

      {showEpubOption && (
        <button
          onClick={handleDownloadEpub}
          className="mt-2 w-full bg-card border border-gray-700 hover:border-primary/40 text-gray-300 hover:text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Download className="w-4 h-4 text-primary" />
          Descargar EPUB original
        </button>
      )}

      {/* Progress Bar Overlay when processing */}
      {isDownloading && progress > 0 && (
        <div className="absolute -bottom-6 left-0 right-0 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  );
}

