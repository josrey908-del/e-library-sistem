"use client";

import { X } from "lucide-react";
import Link from "next/link";
import EpubReader from "./EpubReader";

interface DocumentViewerProps {
  url: string;
  bookId: string;
  title: string;
}

export default function DocumentViewer({ url, bookId, title }: DocumentViewerProps) {
  // Simple check for file type based on extension
  const isPdf = url.toLowerCase().includes('.pdf');

  if (isPdf) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0F0F0F] text-gray-200">
        <div className="h-14 border-b border-gray-700/30 flex items-center justify-between px-4 shrink-0 bg-black">
          <Link href={`/book/${bookId}`} className="p-2 hover:bg-gray-500/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </Link>
          <span className="font-bold font-serif text-sm">Leyendo: {title}</span>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
        <div className="flex-1 w-full h-full relative">
          <iframe
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            title={title}
          />
        </div>
      </div>
    );
  }

  return <EpubReader url={url} bookId={bookId} title={title} />;
}
