/**
 * Helpers for Project Gutenberg assets (covers + EPUB files).
 * Direct cache URLs are more reliable than /ebooks/*.epub.images pages.
 */

export function extractGutenbergId(value: string): number | null {
  const fromSource = value.match(/^gut-(\d+)$/);
  if (fromSource) return parseInt(fromSource[1], 10);

  const fromUrl = value.match(/gutenberg\.org\/(?:ebooks|cache\/epub)\/(\d+)/i);
  return fromUrl ? parseInt(fromUrl[1], 10) : null;
}

export function gutenbergEpubUrl(id: number, withImages = true): string {
  return withImages
    ? `https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.epub`
    : `https://www.gutenberg.org/cache/epub/${id}/pg${id}.epub`;
}

export function gutenbergCoverUrl(
  id: number,
  size: 'small' | 'medium' | 'large' = 'medium',
): string {
  return `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.${size}.jpg`;
}

/** Normalizes Gutenberg ebook page URLs to direct EPUB cache URLs. */
export function resolveGutenbergEpubUrl(url: string): string {
  const id = extractGutenbergId(url);
  if (id) return gutenbergEpubUrl(id);
  return url;
}
