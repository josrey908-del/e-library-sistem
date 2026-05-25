/**
 * Triggers a PDF download via the server API (/api/pdf).
 * The server downloads the EPUB and generates the PDF.
 */
export async function convertEpubToPdf(
  epubUrl: string,
  title: string,
  onProgress?: (progress: number) => void,
  author?: string,
) {
  onProgress?.(5);

  const params = new URLSearchParams({
    url: epubUrl,
    title,
    ...(author ? { author } : {}),
  });

  const pdfApiUrl = `/api/pdf?${params.toString()}`;
  const filename = `${title.replace(/[^a-z0-9áéíóúñ]/gi, '_').toLowerCase()}.pdf`;

  let simProgress = 5;
  const interval = setInterval(() => {
    simProgress = Math.min(simProgress + 4, 92);
    onProgress?.(simProgress);
  }, 600);

  try {
    // Native download: browser handles the long-running GET and saves the PDF
    const link = document.createElement('a');
    link.href = pdfApiUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onProgress?.(100);
  } finally {
    clearInterval(interval);
  }
}
