export class PublicError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PublicError';
    this.status = status;
  }
}

const MAX_TEXT_LENGTH = 500;
const MAX_LONG_TEXT_LENGTH = 5000;
const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 40;
const MAX_IMPORT_ITEMS = 200;

function ensureString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function parseJsonObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PublicError('Invalid request payload');
  }

  return value as Record<string, unknown>;
}

export function normalizeText(value: unknown, fieldName: string, maxLength = MAX_TEXT_LENGTH) {
  const text = ensureString(value).trim();
  if (!text) {
    throw new PublicError(`${fieldName} is required`);
  }

  if (text.length > maxLength) {
    throw new PublicError(`${fieldName} is too long`);
  }

  return text;
}

export function normalizeOptionalText(value: unknown, maxLength = MAX_LONG_TEXT_LENGTH) {
  const text = ensureString(value).trim();
  if (!text) return undefined;
  if (text.length > maxLength) {
    throw new PublicError('Input is too long');
  }
  return text;
}

export function normalizeUrl(value: unknown) {
  const raw = ensureString(value).trim();
  if (!raw) {
    throw new PublicError('URL is required');
  }

  const normalized = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new PublicError('URL is invalid');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new PublicError('Only HTTP and HTTPS URLs are supported');
  }

  return url.toString();
}

export function normalizeId(value: unknown, fieldName: string) {
  const id = ensureString(value).trim();
  if (!id) {
    throw new PublicError(`${fieldName} is required`);
  }
  if (id.length > 191) {
    throw new PublicError(`${fieldName} is invalid`);
  }
  return id;
}

export function normalizeOptionalId(value: unknown) {
  const id = ensureString(value).trim();
  if (!id) return undefined;
  if (id.length > 191) {
    throw new PublicError('Identifier is invalid');
  }
  return id;
}

export function normalizeTags(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new PublicError('Tags must be an array');
  }

  const tags = Array.from(
    new Set(
      value
        .map((tag) => ensureString(tag).trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (tags.length > MAX_TAGS) {
    throw new PublicError(`You can add up to ${MAX_TAGS} tags`);
  }

  for (const tag of tags) {
    if (tag.length > MAX_TAG_LENGTH) {
      throw new PublicError('Tag is too long');
    }
  }

  return tags;
}

export function normalizeBookmarkCreateInput(body: unknown) {
  const payload = parseJsonObject(body);

  return {
    title: normalizeText(payload.title, 'Title'),
    url: normalizeUrl(payload.url),
    description: normalizeOptionalText(payload.description, MAX_LONG_TEXT_LENGTH),
    notes: normalizeOptionalText(payload.notes, MAX_LONG_TEXT_LENGTH),
    favicon: normalizeOptionalText(payload.favicon, 8192),
    thumbnail: normalizeOptionalText(payload.thumbnail, 8192),
    siteName: normalizeOptionalText(payload.siteName, 120),
    folderId: normalizeOptionalId(payload.folderId),
    tags: normalizeTags(payload.tags) || []
  };
}

export function normalizeBookmarkUpdateInput(body: unknown) {
  const payload = parseJsonObject(body);
  const id = normalizeId(payload.id, 'Bookmark');

  return {
    id,
    title: payload.title === undefined ? undefined : normalizeText(payload.title, 'Title'),
    description: payload.description === undefined ? undefined : normalizeOptionalText(payload.description, MAX_LONG_TEXT_LENGTH),
    notes: payload.notes === undefined ? undefined : normalizeOptionalText(payload.notes, MAX_LONG_TEXT_LENGTH),
    folderId:
      payload.folderId === null ? null : payload.folderId === undefined ? undefined : normalizeOptionalId(payload.folderId),
    tags: payload.tags === undefined ? undefined : normalizeTags(payload.tags),
    isFavorite: payload.isFavorite === undefined ? undefined : Boolean(payload.isFavorite),
    isDeleted: payload.isDeleted === undefined ? undefined : Boolean(payload.isDeleted)
  };
}

export function normalizeFolderInput(body: unknown) {
  const payload = parseJsonObject(body);

  return {
    name: normalizeText(payload.name, 'Folder name', 80),
    color: normalizeOptionalText(payload.color, 32)
  };
}

export function normalizeBookmarkActionInput(body: unknown) {
  const payload = parseJsonObject(body);

  return {
    id: normalizeId(payload.id, 'Bookmark'),
    restore: payload.restore === true
  };
}

export function normalizeImportInput(body: unknown) {
  const payload = parseJsonObject(body);
  const rawBookmarks = payload.bookmarks;

  if (!Array.isArray(rawBookmarks) || rawBookmarks.length === 0) {
    throw new PublicError('No bookmarks supplied');
  }

  if (rawBookmarks.length > MAX_IMPORT_ITEMS) {
    throw new PublicError(`Import supports up to ${MAX_IMPORT_ITEMS} bookmarks at a time`);
  }

  return rawBookmarks.map((row) => normalizeBookmarkCreateInput(row));
}

export function normalizeMetadataInput(body: unknown) {
  const payload = parseJsonObject(body);

  return {
    url: normalizeUrl(payload.url)
  };
}

export function getPublicError(error: unknown) {
  if (error instanceof PublicError) {
    return error;
  }

  return new PublicError('Something went wrong', 500);
}
