import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import { resolveGutenbergEpubUrl } from '@/lib/gutenberg';

const execPromise = util.promisify(exec);

/**
 * Fallback fetch using system curl.
 * Gutenberg has strong anti-bot protections that block Node.js native fetch/https
 * (causing ConnectTimeout or ECONNRESET). Using the system curl bypasses this.
 */
async function fetchWithCurl(url: string): Promise<Buffer> {
  try {
    // -sL: silent, follow redirects
    // We use base64 output to easily parse binary data from stdout in Node
    const { stdout } = await execPromise(`curl.exe -sL "${url}" | base64`);
    return Buffer.from(stdout.replace(/\s/g, ''), 'base64');
  } catch (error) {
    // If base64 pipe fails, try writing to a temp file and reading it (more robust for large files)
    const tempFile = `temp_${Date.now()}.epub`;
    await execPromise(`curl.exe -sL "${url}" --output ${tempFile}`);
    const fs = require('fs');
    const buffer = fs.readFileSync(tempFile);
    fs.unlinkSync(tempFile);
    return buffer;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'document';

  if (!rawUrl) {
    return new NextResponse('URL is required', { status: 400 });
  }

  const fileUrl = resolveGutenbergEpubUrl(rawUrl);

  if (!fileUrl.startsWith('http')) {
    return new NextResponse(`Invalid URL: ${fileUrl}. Must start with http or https`, {
      status: 400,
    });
  }

  try {
    console.log(`[API Download Proxy] Fetching (via curl bypass): ${fileUrl}`);

    const buffer = await fetchWithCurl(fileUrl);

    console.log(`[API Download Proxy] Success: ${buffer.byteLength} bytes`);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/epub+zip',
      },
    });
  } catch (error: any) {
    console.error('[API Download Proxy] Error:', error);
    return new NextResponse(`Error downloading file: ${error.message || 'Unknown error'}`, {
      status: 500,
    });
  }
}
