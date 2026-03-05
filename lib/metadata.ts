import * as cheerio from 'cheerio';

export type UrlMetadata = {
  title: string;
  description: string;
  favicon: string;
  thumbnail: string;
  siteName: string;
};

function ensureValidUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return new URL(`https://${input}`);
  }
}

function resolveAsset(base: URL, value?: string | null) {
  if (!value) return '';
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

export async function fetchMetadata(rawUrl: string): Promise<UrlMetadata> {
  const url = ensureValidUrl(rawUrl.trim());

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) BookmarkManagerBot/1.0'
    },
    next: { revalidate: 3600 }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').first().text() ||
    url.hostname;

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    '';

  const thumbnail =
    resolveAsset(url, $('meta[property="og:image"]').attr('content')) ||
    resolveAsset(url, $('meta[name="twitter:image"]').attr('content')) ||
    '';

  const siteName =
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    url.hostname.replace('www.', '');

  const favicon =
    resolveAsset(url, $('link[rel="icon"]').attr('href')) ||
    resolveAsset(url, $('link[rel="shortcut icon"]').attr('href')) ||
    `${url.origin}/favicon.ico`;

  return {
    title: title.trim(),
    description: description.trim(),
    thumbnail,
    siteName: siteName.trim(),
    favicon
  };
}
