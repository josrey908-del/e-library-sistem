import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { exec } from 'child_process';
import util from 'util';
import { resolveGutenbergEpubUrl } from '@/lib/gutenberg';

const execPromise = util.promisify(exec);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fallback fetch using system curl to bypass Gutenberg's anti-bot protections.
 */
async function fetchWithCurl(url: string): Promise<Buffer> {
  try {
    const { stdout } = await execPromise(`curl.exe -sL "${url}" | base64`);
    return Buffer.from(stdout.replace(/\s/g, ''), 'base64');
  } catch (error) {
    const tempFile = `temp_pdf_${Date.now()}.epub`;
    await execPromise(`curl.exe -sL "${url}" --output ${tempFile}`);
    const fs = require('fs');
    const buffer = fs.readFileSync(tempFile);
    fs.unlinkSync(tempFile);
    return buffer;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '  \u2022 ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractHeading(html: string): string {
  const m = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, '').trim();
}

function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\x00-\xFF]/g, '');
}

// ── API Route (GET) ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const title   = searchParams.get('title') || 'Documento';
  const author  = searchParams.get('author') || '';

  if (!rawUrl) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  const epubUrl = resolveGutenbergEpubUrl(rawUrl);

  try {
    console.log(`[PDF API GET] Generating PDF for: "${title}" (${epubUrl})`);

    // 1 ─ Download the EPUB natively on the server using curl
    const buffer = await fetchWithCurl(epubUrl);

    // 2 ─ Unzip ──────────────────────────────────────────────────────────────
    const zip = await JSZip.loadAsync(buffer);

    // 3 ─ Locate OPF ─────────────────────────────────────────────────────────
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('Invalid EPUB');
    const containerXml = await containerFile.async('text');
    const rfMatch = containerXml.match(/full-path="([^"]+)"/);
    if (!rfMatch) throw new Error('Invalid EPUB');
    const opfPath = rfMatch[1];
    const opfDir  = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

    // 4 ─ Parse OPF ──────────────────────────────────────────────────────────
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('Invalid EPUB');
    const opfXml = await opfFile.async('text');

    const manifest = new Map<string, string>();
    const itemRe = /<item\s[^>]*?id="([^"]+)"[^>]*?href="([^"]+)"[^>]*?\/?>/gi;
    const itemRe2 = /<item\s[^>]*?href="([^"]+)"[^>]*?id="([^"]+)"[^>]*?\/?>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(opfXml))) manifest.set(m[1], m[2]);
    while ((m = itemRe2.exec(opfXml))) if (!manifest.has(m[2])) manifest.set(m[2], m[1]);

    const spineIds: string[] = [];
    const spineRe = /<itemref\s[^>]*?idref="([^"]+)"[^>]*?\/?>/gi;
    while ((m = spineRe.exec(opfXml))) spineIds.push(m[1]);

    // 5 ─ Extract text ───────────────────────────────────────────────────────
    interface Chapter { heading: string; text: string }
    const chapters: Chapter[] = [];

    for (const idref of spineIds) {
      const href = manifest.get(idref);
      if (!href) continue;

      const filePath = opfDir + decodeURIComponent(href);
      const file = zip.file(filePath) ?? zip.file(opfDir + href);
      if (!file) continue;

      const html    = await file.async('text');
      const heading = sanitizeForPdf(extractHeading(html));
      const text    = sanitizeForPdf(htmlToText(html));

      if (text.length > 10) {
        chapters.push({ heading, text });
      }
    }

    if (chapters.length === 0) {
      return new NextResponse('No readable content', { status: 422 });
    }

    // 6 ─ Generate PDF ───────────────────────────────────────────────────────
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 210, PH = 297;
    const ML = 25, MR = 25, MT = 30, MB = 25;
    const TW = PW - ML - MR;
    const LH = 5.5;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(160, 160, 160);
    pdf.text('E - L I B R A R Y   S T R E A M', PW / 2, 60, { align: 'center' });

    pdf.setTextColor(30, 30, 30);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    const safeTitle = sanitizeForPdf(title);
    const titleLines = pdf.splitTextToSize(safeTitle, TW);
    let y = PH / 3;
    for (const line of titleLines) {
      pdf.text(line, PW / 2, y, { align: 'center' });
      y += 12;
    }

    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.5);
    pdf.line(PW / 2 - 30, y + 5, PW / 2 + 30, y + 5);

    if (author) {
      pdf.setFont('times', 'italic');
      pdf.setFontSize(16);
      pdf.setTextColor(80, 80, 80);
      pdf.text(sanitizeForPdf(author), PW / 2, y + 20, { align: 'center' });
    }

    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    pdf.text(`Descargado el ${sanitizeForPdf(dateStr)}`, PW / 2, PH - 30, { align: 'center' });
    pdf.text('Edicion Digital Optimizada', PW / 2, PH - 24, { align: 'center' });

    for (const chapter of chapters) {
      pdf.addPage();
      y = MT;

      if (chapter.heading) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(30, 30, 30);
        const hLines = pdf.splitTextToSize(chapter.heading, TW);
        for (const line of hLines) {
          if (y > PH - MB) { pdf.addPage(); y = MT; }
          pdf.text(line, PW / 2, y, { align: 'center' });
          y += 8;
        }
        y += 8;
      }

      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);

      const paragraphs = chapter.text.split(/\n{2,}/);
      for (const para of paragraphs) {
        const clean = para.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (!clean) continue;

        const lines = pdf.splitTextToSize(clean, TW) as string[];
        for (const line of lines) {
          if (y > PH - MB) {
            pdf.setFontSize(8);
            pdf.setTextColor(160, 160, 160);
            pdf.text(`${pdf.getNumberOfPages()}`, PW / 2, PH - 12, { align: 'center' });
            pdf.addPage();
            y = MT;
            pdf.setFontSize(11);
            pdf.setTextColor(40, 40, 40);
          }
          pdf.text(line, ML, y);
          y += LH;
        }
        y += 2.5;
      }
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text(`${pdf.getNumberOfPages()}`, PW / 2, PH - 12, { align: 'center' });
    }

    const pdfOutput = pdf.output('arraybuffer');
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    const finalBuffer = Buffer.from(pdfOutput);

    return new NextResponse(finalBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(finalBuffer.byteLength),
      },
    });
  } catch (error: any) {
    console.error('[PDF API] Error:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
