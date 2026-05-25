import DocumentViewer from "@/components/DocumentViewer";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function ReadPage({ 
  params,
  searchParams
}: { 
  params: { id: string },
  searchParams: { chapterUrl?: string }
}) {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
  });

  if (!book) {
    notFound();
  }

  const urlToLoad = searchParams.chapterUrl || book.downloadUrl;

  if (!urlToLoad) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-white p-4">
        <h2 className="text-2xl font-bold mb-4">Libro no disponible para lectura</h2>
        <p className="text-gray-400 mb-6">Lo sentimos, este libro no tiene un archivo de lectura asociado.</p>
        <a href={`/book/${params.id}`} className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-gold-light transition-colors">
          Volver al libro
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <DocumentViewer url={urlToLoad} bookId={params.id} title={book.title} />
    </div>
  );
}
