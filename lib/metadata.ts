import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import * as cheerio from 'cheerio';
import { PublicError } from '@/lib/validation';

export type UrlMetadata = {
  title: string;
  description: string;
  favicon: string;
  thumbnail: string;
  siteName: string;
};

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 5000;

function ensureValidUrl(input: string) {
  return new URL(input);
}

function resolveAsset(base: URL, value?: string | null) {
  if (!value) return '';
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

function isPrivateIpAddress(address: string) {
  if (address === '::1' || address === '0:0:0:0:0:0:0:1') return true;

  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);

    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
    return false;
  }

  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }

  return false;
}

async function assertSafeHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
    throw new PublicError('This URL cannot be fetched');
  }

  if (isIP(hostname) && isPrivateIpAddress(hostname)) {
    throw new PublicError('This URL cannot be fetched');
  }

  try {
    const addresses = await lookup(hostname, { all: true });

    if (!addresses.length) {
      throw new PublicError('Could not reach that URL');
    }

    if (addresses.some((addr) => isPrivateIpAddress(addr.address))) {
      throw new PublicError('This URL cannot be fetched');
    }
  } catch (error) {
    if (error instanceof PublicError) {
      throw error;
    }
    throw new PublicError('Could not reach that URL');
  }
}

async function readHtml(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new PublicError('Metadata is only available for HTML pages');
  }

  const announcedLength = Number(response.headers.get('content-length') || '0');
  if (announcedLength > MAX_HTML_BYTES) {
    throw new PublicError('The page is too large to inspect');
  }

  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_HTML_BYTES) {
      throw new PublicError('The page is too large to inspect');
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchHtml(url: URL, redirects = 0): Promise<{ url: URL; html: string }> {
  if (redirects > MAX_REDIRECTS) {
    throw new PublicError('Too many redirects');
  }

  await assertSafeHostname(url.hostname);

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) BookmarkManagerBot/1.0'
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) {
      throw new PublicError('Could not follow redirect');
    }

    return fetchHtml(new URL(location, url), redirects + 1);
  }

  if (!response.ok) {
    throw new PublicError('Could not fetch metadata');
  }

  const html = await readHtml(response);
  return { url, html };
}

export async function fetchMetadata(rawUrl: string): Promise<UrlMetadata> {
  const url = ensureValidUrl(rawUrl.trim());
  const { url: resolvedUrl, html } = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').first().text() ||
    resolvedUrl.hostname;

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    '';

  const thumbnail =
    resolveAsset(resolvedUrl, $('meta[property="og:image"]').attr('content')) ||
    resolveAsset(resolvedUrl, $('meta[name="twitter:image"]').attr('content')) ||
    '';

  const siteName =
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    resolvedUrl.hostname.replace('www.', '');

  const favicon =
    resolveAsset(resolvedUrl, $('link[rel="icon"]').attr('href')) ||
    resolveAsset(resolvedUrl, $('link[rel="shortcut icon"]').attr('href')) ||
    `${resolvedUrl.origin}/favicon.ico`;

  return {
    title: title.trim(),
    description: description.trim(),
    thumbnail,
    siteName: siteName.trim(),
    favicon
  };
}
