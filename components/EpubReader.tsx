"use client";

import React, { useState, useEffect, useRef } from "react";
import ePub, { Book, Rendition, Location } from "epubjs";
import { Settings, ChevronLeft, ChevronRight, X, Loader2, Type, AlignLeft, Highlighter, MessageSquare, BookOpen, User as UserIcon, Trash2, Languages, Search, Headphones, Play as PlayIcon, Square, Pause as PauseIcon, FileText, Clock } from "lucide-react";
import Link from "next/link";
import AmbientSoundPlayer from "./AmbientSoundPlayer";
import { useSession } from "next-auth/react";
import { convertEpubToPdf } from "@/lib/epubToPdf";

interface EpubReaderProps {
  url: string;
  bookId: string;
  title: string;
}

export default function EpubReader({ url, bookId, title }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings state
  const [theme, setTheme] = useState<"day" | "night" | "sepia" | "oldpaper" | "warm">("night");
  const [fontSize, setFontSize] = useState(100); // percentage
  const [fontFamily, setFontFamily] = useState("serif");
  const [lineHeight, setLineHeight] = useState(1.5);

  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Annotations & selection
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [selection, setSelection] = useState<{ cfiRange: string; text: string; x: number; y: number } | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"annotations" | "characters" | "glossary">("annotations");
  const [characters, setCharacters] = useState<any[]>([]);
  const [showSpoilers, setShowSpoilers] = useState(false);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const [currentChapter, setCurrentChapter] = useState<{ title: string; index: number; total: number } | null>(null);
  const [chapterProgress, setChapterProgress] = useState(0);
  
  // Health Break system
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakCountdown, setBreakCountdown] = useState(0);
  const readingTimeRef = useRef<number>(0);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportProgress(0);
    try {
      await convertEpubToPdf(url, title, (p) => setExportProgress(p));
    } catch (e) {
      console.error("Export failed", e);
      alert("Error al exportar PDF");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let newBook: Book | null = null;
    let currentRendition: Rendition | null = null;

    const loadBook = async () => {
      if (!viewerRef.current) return;
      setIsLoading(true);
      setError(null);

      try {
        const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=book.epub`;
        console.log("Fetching book from:", proxyUrl);
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load book file: ${errorText || response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        if (!isMounted) return;

        console.log("Book buffer loaded, size:", buffer.byteLength);
        viewerRef.current.innerHTML = "";

        newBook = ePub(buffer);
        setBook(newBook);

        currentRendition = newBook.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          manager: "default",
          spread: "none",
        });

        setRendition(currentRendition);

        // Handle window resize
        const handleResize = () => {
          if (currentRendition && viewerRef.current) {
            currentRendition.resize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
          }
        };
        window.addEventListener("resize", handleResize);

        await newBook.ready;
        console.log("Book is ready");
        if (!isMounted) return;
        
        // Generate locations in background to not block initial display
        newBook.locations.generate(1600).then(() => console.log("Locations generated")).catch(e => console.error("Error generating locations", e));

        currentRendition.on("relocated", (location: Location) => {
          if (newBook && newBook.locations.length() > 0) {
            const percentage = newBook.locations.percentageFromCfi(location.start.cfi);
            const currentProgress = Math.round(percentage * 100);
            setProgress(currentProgress);
            
            // Save progress silently
            fetch('/api/user/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookId, progress: currentProgress })
            }).catch(e => console.error("Error saving progress", e));

            // Update streak silently
            fetch('/api/user/streak', { method: 'POST' }).catch(e => console.error("Error updating streak", e));
          
            // Chapter progress
            const spine = newBook.spine;
            const currentItem = spine.get(location.start.cfi);
            if (currentItem) {
              const totalItems = (spine as any).length;
              setCurrentChapter({
                title: currentItem.href, 
                index: currentItem.index,
                total: totalItems
              });
              setChapterProgress(Math.round((currentItem.index / totalItems) * 100));
            }
          }
        });

        await currentRendition.display();
        console.log("Rendition displayed");
        
        // Load existing annotations (Soft failure)
        try {
          const annRes = await fetch(`/api/user/annotations?bookId=${bookId}`);
          if (annRes.ok) {
            const data = await annRes.json();
            setAnnotations(data);
            data.forEach((ann: any) => {
              currentRendition?.annotations.add("highlight", ann.cfiRange, {}, (e: any) => console.log("clicked", e), "hl", { fill: ann.color || "yellow", "fill-opacity": "0.3" });
            });
          }
        } catch (e) {
          console.error("Failed to load annotations:", e);
        }

        // Load characters (Soft failure)
        try {
          const charRes = await fetch(`/api/books/${bookId}/characters`);
          if (charRes.ok) {
            const charData = await charRes.json();
            setCharacters(charData);
          }
        } catch (e) {
          console.error("Failed to load characters:", e);
        }

        // Selection handling
        currentRendition.on("selected", (cfiRange: string, contents: any) => {
          const range = contents.range(cfiRange);
          const rect = range.getBoundingClientRect();
          newBook?.getRange(cfiRange).then((r) => {
            setSelection({
              cfiRange,
              text: contents.window.getSelection().toString(),
              x: rect.left + rect.width / 2,
              y: rect.top,
            });
          });
          contents.window.getSelection().removeAllRanges();
        });

        if (isMounted) setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading epub:", err);
        if (isMounted) {
          setError(err.message || "No se pudo cargar el libro.");
          setIsLoading(false);
        }
      }
    };

    const handleResize = () => {
      if (currentRendition && viewerRef.current) {
        currentRendition.resize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    loadBook();

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (currentRendition) {
        currentRendition.destroy();
      }
      if (newBook) {
        newBook.destroy();
      }
      if (viewerRef.current) {
        viewerRef.current.innerHTML = ""; 
      }
    };
  }, [url]);

  // Timer for break system
  useEffect(() => {
    const checkBreak = () => {
      const breakEnd = localStorage.getItem("reading_break_end");
      if (breakEnd) {
        const remaining = Math.max(0, Math.floor((parseInt(breakEnd) - Date.now()) / 1000));
        if (remaining > 0) {
          setIsOnBreak(true);
          setBreakCountdown(remaining);
          if (synth) synth.cancel();
          setIsSpeaking(false);
          return true;
        } else {
          localStorage.removeItem("reading_break_end");
          setIsOnBreak(false);
          return false;
        }
      }
      return false;
    };

    const interval = setInterval(() => {
      const onBreak = checkBreak();
      if (!onBreak && !isLoading && !error) {
        readingTimeRef.current += 1;
        // Trigger break after 45 minutes (2700 seconds)
        if (readingTimeRef.current >= 2700) {
          const breakDuration = 20 * 60 * 1000; // 20 minutes
          const endTime = Date.now() + breakDuration;
          localStorage.setItem("reading_break_end", endTime.toString());
          readingTimeRef.current = 0;
          setIsOnBreak(true);
          setBreakCountdown(20 * 60);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, error]);

  // Apply settings
  useEffect(() => {
    if (rendition) {
      // Inject font styles into the iframe
      rendition.hooks.content.register((contents: any) => {
        contents.addStylesheet("https://fonts.cdnfonts.com/css/opendyslexic");
      });

      rendition.themes.fontSize(`${fontSize}%`);
      
      const themes = {
        day: { body: { background: "#ffffff", color: "#000000", "font-family": `${fontFamily} !important`, "line-height": `${lineHeight} !important`, "max-width": "100vw !important", "overflow-x": "hidden !important" } },
        night: { body: { background: "#0F0F0F", color: "#E0E0E0", "font-family": `${fontFamily} !important`, "line-height": `${lineHeight} !important`, "max-width": "100vw !important", "overflow-x": "hidden !important" } },
        sepia: { body: { background: "#F4ECD8", color: "#3E2F1C", "font-family": `${fontFamily} !important`, "line-height": `${lineHeight} !important`, "max-width": "100vw !important", "overflow-x": "hidden !important" } },
        oldpaper: { body: { background: "#D2B48C", color: "#4B3621", "font-family": `${fontFamily} !important`, "line-height": `${lineHeight} !important`, "max-width": "100vw !important", "overflow-x": "hidden !important" } },
        warm: { body: { background: "#2D241E", color: "#E8D5B5", "font-family": `${fontFamily} !important`, "line-height": `${lineHeight} !important`, "max-width": "100vw !important", "overflow-x": "hidden !important" } },
      };
      
      Object.entries(themes).forEach(([name, style]) => {
        rendition.themes.register(name, style);
      });
      
      rendition.themes.select(theme);
    }
  }, [rendition, theme, fontSize, fontFamily, lineHeight]);

  const next = () => {
    if (synth) synth.cancel();
    setIsSpeaking(false);
    rendition?.next();
  };
  const prev = () => {
    if (synth) synth.cancel();
    setIsSpeaking(false);
    rendition?.prev();
  };

  const handleAddAnnotation = async (color: string = "yellow") => {
    if (!selection || !session) return;
    
    const res = await fetch("/api/user/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        cfiRange: selection.cfiRange,
        text: selection.text,
        color,
        note: showNoteInput ? noteText : null
      })
    });

    if (res.ok) {
      const newAnn = await res.json();
      setAnnotations([...annotations, newAnn]);
      rendition?.annotations.add("highlight", selection.cfiRange, {}, () => {}, "hl", { fill: color, "fill-opacity": "0.3" });
      setSelection(null);
      setShowNoteInput(false);
      setNoteText("");
    }
  };

  const removeAnnotation = async (id: string, cfiRange: string) => {
    const res = await fetch("/api/user/annotations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (res.ok) {
      setAnnotations(annotations.filter(a => a.id !== id));
      rendition?.annotations.remove(cfiRange, "highlight");
    }
  };

  const toggleTTS = () => {
    if (!synth) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      // Get text from the rendition's iframe
      let text = "";
      const contents = (rendition as any).getContents();
      if (contents && contents[0]) {
        text = contents[0].document.body.innerText;
      }

      if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";
        
        // Try to find a Spanish voice
        const voices = synth.getVoices();
        const spanishVoice = voices.find(v => v.lang.startsWith("es"));
        if (spanishVoice) utterance.voice = spanishVoice;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        synth.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  const themeClasses = {
    day: "bg-white text-black",
    sepia: "bg-[#F4ECD8] text-[#3E2F1C]",
    night: "bg-[#0F0F0F] text-gray-200",
    oldpaper: "bg-[#D2B48C] text-[#4B3621]",
    warm: "bg-[#2D241E] text-[#E8D5B5]"
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${themeClasses[theme]}`}>
      
      {/* Top Bar */}
      <div className="min-h-14 border-b border-gray-700/30 flex items-center gap-1 px-2 sm:px-4 safe-top shrink-0">
        <Link href={`/book/${bookId}`} aria-label="Cerrar lector" className="touch-target hover:bg-gray-500/20 rounded-full shrink-0">
          <X className="w-6 h-6" />
        </Link>
        <span className="flex-1 min-w-0 font-bold font-serif text-xs sm:text-sm truncate text-center px-1">
          {title}
        </span>
        <div className="flex items-center shrink-0 gap-0.5">
          <button type="button" aria-label="Panel" onClick={() => setShowSidebar(!showSidebar)} className="touch-target hover:bg-gray-500/20 rounded-full">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button type="button" aria-label="Audio" onClick={toggleTTS} className={`touch-target rounded-full ${isSpeaking ? "bg-primary text-black" : "hover:bg-gray-500/20"}`}>
            {isSpeaking ? <Square className="w-5 h-5 sm:w-6 sm:h-6" /> : <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          <button type="button" aria-label="Ajustes" onClick={() => setShowSettings(!showSettings)} className="touch-target hover:bg-gray-500/20 rounded-full">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="absolute sm:relative inset-0 sm:inset-auto z-40 w-full sm:w-80 max-w-full border-r border-gray-700/30 flex flex-col bg-card/95 sm:bg-card/80 backdrop-blur-md">
            <div className="flex border-b border-gray-700/30">
              <button 
                onClick={() => setSidebarTab("annotations")} 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === "annotations" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
              >
                Notas
              </button>
              <button 
                onClick={() => setSidebarTab("characters")} 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === "characters" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
              >
                Personajes
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {sidebarTab === "annotations" ? (
                <div className="space-y-4">
                  {annotations.length === 0 && <p className="text-gray-500 text-center py-10">No hay notas todavía.</p>}
                  {annotations.map((ann) => (
                    <div key={ann.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ann.color }} />
                        <button onClick={() => removeAnnotation(ann.id, ann.cfiRange)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm italic mb-2">"{ann.text}"</p>
                      {ann.note && <p className="text-sm text-gray-300 bg-black/20 p-2 rounded">{ann.note}</p>}
                      <button 
                        onClick={() => rendition?.display(ann.cfiRange)}
                        className="text-xs text-primary mt-2 hover:underline"
                      >
                        Ir a la página
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 uppercase font-bold">Evitar Spoilers</span>
                    <button 
                      onClick={() => setShowSpoilers(!showSpoilers)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${showSpoilers ? "bg-primary" : "bg-gray-700"}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showSpoilers ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                  {characters.length === 0 && <p className="text-gray-500 text-center py-10">Cargando mapa de personajes...</p>}
                  {characters.map((char) => (
                    <div key={char.id} className="flex gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                        <UserIcon className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold">{char.name}</h5>
                        <p className="text-xs text-gray-400 mb-1">{char.role}</p>
                        <p className={`text-xs ${char.isSpoiler && !showSpoilers ? "blur-sm select-none" : ""}`}>
                          {char.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Selection Menu */}
        {selection && (
          <div 
            className="absolute z-[60] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-2 flex flex-col gap-2 animate-in fade-in zoom-in duration-200"
            style={{ 
              left: `${Math.min(window.innerWidth - 200, Math.max(20, selection.x - 100))}px`, 
              top: `${Math.max(60, selection.y - 120)}px` 
            }}
          >
            {!showNoteInput ? (
              <>
                <div className="flex gap-1 border-b border-gray-700 pb-2 mb-1">
                  {["#FFEB3B", "#FF5252", "#4CAF50", "#2196F3", "#E040FB"].map(color => (
                    <button 
                      key={color} 
                      onClick={() => handleAddAnnotation(color)}
                      className="w-6 h-6 rounded-full hover:scale-110 transition-transform" 
                      style={{ backgroundColor: color }} 
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNoteInput(true)} className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-800 rounded transition-colors text-gray-300">
                    <MessageSquare className="w-3 h-3" /> Nota
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-800 rounded transition-colors text-gray-300">
                    <Languages className="w-3 h-3" /> Traducir
                  </button>
                  <button onClick={() => setSelection(null)} className="p-1 hover:bg-red-500/20 text-red-500 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-48">
                <textarea 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white focus:outline-none focus:border-primary"
                  placeholder="Escribe tu nota..."
                  rows={3}
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setShowNoteInput(false)} className="text-xs text-gray-500">Cancelar</button>
                  <button onClick={() => handleAddAnnotation("#FFEB3B")} className="text-xs bg-primary px-2 py-1 rounded">Guardar</button>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-64 bg-card text-white p-4 rounded-lg shadow-2xl z-50 border border-gray-700">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-gray-400 mb-2">Tema</h4>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setTheme("day")} className={`py-1 bg-white text-black text-xs rounded border border-gray-300 ${theme==="day" ? "ring-2 ring-primary":""}`}>Día</button>
              <button onClick={() => setTheme("sepia")} className={`py-1 bg-[#F4ECD8] text-[#3E2F1C] text-xs rounded border border-gray-300 ${theme==="sepia" ? "ring-2 ring-primary":""}`}>Sepia</button>
              <button onClick={() => setTheme("night")} className={`py-1 bg-[#0F0F0F] text-white text-xs border border-gray-600 rounded ${theme==="night" ? "ring-2 ring-primary":""}`}>Noche</button>
              <button onClick={() => setTheme("oldpaper")} className={`py-1 bg-[#D2B48C] text-[#4B3621] text-xs rounded border border-gray-400 ${theme==="oldpaper" ? "ring-2 ring-primary":""}`}>Papel</button>
              <button onClick={() => setTheme("warm")} className={`py-1 bg-[#2D241E] text-[#E8D5B5] text-xs rounded border border-gray-800 ${theme==="warm" ? "ring-2 ring-primary":""}`}>Cálido</button>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-bold text-gray-400 mb-2">Fuente</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFontFamily("serif")} className={`flex-1 py-1 text-xs font-serif border border-gray-600 rounded ${fontFamily==="serif" ? "bg-primary text-white":"bg-gray-800"}`}>Serif</button>
              <button onClick={() => setFontFamily("sans-serif")} className={`flex-1 py-1 text-xs font-sans border border-gray-600 rounded ${fontFamily==="sans-serif" ? "bg-primary text-white":"bg-gray-800"}`}>Sans</button>
              <button onClick={() => setFontFamily("'OpenDyslexic', sans-serif")} className={`w-full py-1 text-xs border border-gray-600 rounded ${fontFamily.includes('OpenDyslexic') ? "bg-primary text-white":"bg-gray-800"}`} style={{fontFamily: "'OpenDyslexic', sans-serif"}}>OpenDyslexic</button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <h4 className="text-sm font-bold text-gray-400 flex items-center gap-1"><Type className="w-4 h-4" /> Tamaño</h4>
              <span className="text-xs text-gray-500">{fontSize}%</span>
            </div>
            <input 
              type="range" 
              min="80" max="200" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <h4 className="text-sm font-bold text-gray-400 flex items-center gap-1"><AlignLeft className="w-4 h-4" /> Interlineado</h4>
              <span className="text-xs text-gray-500">{lineHeight}</span>
            </div>
            <input 
              type="range" 
              min="1" max="2.5" step="0.1"
              value={lineHeight} 
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <button 
              onClick={handleExportPdf}
              disabled={isExporting}
              className="w-full bg-primary hover:bg-gold-light text-black font-black py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs uppercase tracking-tight">Exportando {exportProgress}%</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Descargar como PDF</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-500 mt-2 text-center italic">
              Genera una copia optimizada para impresión y lectura offline.
            </p>
          </div>

          <AmbientSoundPlayer />
        </div>
      )}

      {/* Reader Container */}
      <div className="flex-1 relative bg-card/50 overflow-hidden">
        {!isLoading && !error && (
          <button onClick={prev} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-40 p-2 md:p-4 hover:bg-gray-500/20 rounded-full transition-colors">
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-background">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-400 font-bold">Cargando libro...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 px-8 text-center bg-background">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8" />
            </div>
            <p className="text-red-400 font-bold text-lg mb-2">Error de lectura</p>
            <p className="text-gray-400 max-w-md">{error}</p>
          </div>
        )}

        {isOnBreak && (
          <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-6 border-4 border-blue-500/40">
              <Clock className="w-12 h-12 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">¡Tiempo de descansar la vista!</h2>
            <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
              Has estado leyendo por mucho tiempo. Para proteger tu salud visual, hemos pausado la lectura por 20 minutos. 
              Aprovecha para mirar a lo lejos y estirarte.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 px-8 py-4 rounded-2xl mb-8">
              <span className="text-4xl font-mono font-black text-blue-400">
                {Math.floor(breakCountdown / 60)}:{(breakCountdown % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Link href="/" className="text-gray-500 hover:text-white transition-colors">
              Volver al Catálogo
            </Link>
          </div>
        )}

        <div 
          ref={viewerRef} 
          className={`absolute inset-0 px-6 md:px-24 transition-opacity duration-500 ${isLoading || error || isOnBreak ? 'opacity-0' : 'opacity-100'}`} 
          style={{ boxSizing: "border-box" }}
        />

        {!isLoading && !error && (
          <button onClick={next} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-40 p-2 md:p-4 hover:bg-gray-500/20 rounded-full transition-colors">
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>

      {/* Progress Bar */}
      <div className="h-14 flex flex-col justify-center px-8 border-t border-gray-700/30">
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
          <span>Capítulo {currentChapter ? currentChapter.index + 1 : "?"} de {currentChapter?.total || "?"}</span>
          <span>Progreso Total: {progress}%</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/20" style={{ width: `${progress}%` }} />
            <div className="absolute inset-0 bg-primary" style={{ width: `${chapterProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
