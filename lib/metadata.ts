import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import * as cheerio from 'cheerio';
import { Agent, fetch as undiciFetch } from 'undici';
import { PublicError } from '@/lib/validation';

export type UrlMetadata = {
  title: string;
  description: string;
  favicon: string;
  thumbnail: string;
  siteName: string;
};

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 1024 * 1024; // 1MB limit
const FETCH_TIMEOUT_MS = 5000;

/**
 * Exhaustive check for private, reserved, and restricted IP ranges (SSRF prevention).
 * Covers all relevant RFC ranges for IPv4 and IPv6 to prevent access to internal infrastructure.
 */
function isPrivateIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return false;

  if (family === 4) {
    const [a, b, c] = address.split('.').map(Number);
    if (a === 0) return true; // 0.0.0.0/8 (Local)
    if (a === 10) return true; // 10.0.0.0/8 (Private)
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
    if (a === 127) return true; // 127.0.0.0/8 (Loopback)
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (Link-local)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (Private)
    if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24 (IETF)
    if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24 (Documentation)
    if (a === 192 && b === 88 && c === 99) return true; // 192.88.99.0/24 (6to4 Relay)
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 (Private)
    if (a === 198 && b >= 18 && b <= 19) return true; // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 (Documentation)
    if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 (Documentation)
    if (a >= 224) return true; // 224.0.0.0/3 (Multicast/Reserved)
    return false;
  }

  if (family === 6) {
    const n = address.toLowerCase();
    if (n === '::1' || n === '0:0:0:0:0:0:0:1') return true; // Loopback
    if (n === '::' || n === '0:0:0:0:0:0:0:0') return true; // Unspecified
    if (n.startsWith('fc') || n.startsWith('fd')) return true; // ULA
    if (n.startsWith('fe8') || n.startsWith('fe9') || n.startsWith('fea') || n.startsWith('feb')) return true; // Link-local
    if (n.startsWith('ff')) return true; // Multicast
    if (n.startsWith('2001:db8:')) return true; // Documentation
    return false;
  }

  return false;
}

/**
 * Custom undici Agent that prevents DNS Rebinding attacks.
 * It enforces IP validation during the actual connection phase, ensuring that
 * even if a DNS record changes between validation and fetch, the connection is blocked.
 */
const ssrfDispatcher = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      import('node:dns').then(({ lookup: dnsLookup }) => {
        dnsLookup(hostname, options, (err, address, family) => {
          if (err) return callback(err, [], family);

          const addresses = Array.isArray(address) ? address : [{ address, family }];
          const privateIp = addresses.find((a) => isPrivateIpAddress(a.address));

          if (privateIp) {
            return callback(new Error(`Access to private IP ${privateIp.address} is prohibited`), [], family);
          }

          callback(null, address, family);
        });
      });
    }
  }
});

function ensureValidUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new PublicError('Only HTTP and HTTPS URLs are supported');
  }
  return url;
}

function resolveAsset(base: URL, value?: string | null) {
  if (!value) return '';
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
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
    if (error instanceof PublicError) throw error;
    throw new PublicError('Could not reach that URL');
  }
}

async function fetchHtml(url: URL, redirects = 0): Promise<{ url: URL; html: string }> {
  if (redirects > MAX_REDIRECTS) {
    throw new PublicError('Too many redirects');
  }

  await assertSafeHostname(url.hostname);

  try {
    const response = await undiciFetch(url.toString(), {
      dispatcher: ssrfDispatcher,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) BookmarkManagerBot/1.0'
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new PublicError('Could not follow redirect');
      return fetchHtml(new URL(location, url), redirects + 1);
    }

    if (!response.ok) throw new PublicError('Could not fetch metadata');

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new PublicError('Metadata is only available for HTML pages');
    }

    const announcedLength = Number(response.headers.get('content-length') || '0');
    if (announcedLength > MAX_HTML_BYTES) {
      throw new PublicError('The page is too large to inspect');
    }

    if (!response.body) return { url, html: '' };

    // Enforce size limit while reading stream
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

    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return { url, html };
  } catch (error: any) {
    if (error instanceof PublicError) throw error;
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new PublicError('Request timed out');
    }
    if (error.message?.includes('prohibited') || error.message?.includes('Forbidden')) {
      throw new PublicError('This URL cannot be fetched');
    }
    throw new PublicError('Could not reach that URL');
  }
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
