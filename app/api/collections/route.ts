import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  addBookmarksToCollection,
  createCollection,
  listCollections,
  toggleCollectionShare
} from '@/lib/database/bookmarks';
import { getPublicError, normalizeOptionalText, normalizeText, parseJsonObject } from '@/lib/validation';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collections = await listCollections(session.user.id);
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = parseJsonObject(await request.json());
    const bookmarkIds = Array.isArray(payload.bookmarkIds)
      ? payload.bookmarkIds.filter((id): id is string => typeof id === 'string')
      : [];

    const collection = await createCollection(session.user.id, {
      name: normalizeText(payload.name, 'Collection name', 80),
      description: normalizeOptionalText(payload.description, 240),
      bookmarkIds
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = parseJsonObject(await request.json());
    const collectionId = normalizeText(payload.collectionId, 'Collection', 191);

    if (payload.bookmarkIds !== undefined) {
      const bookmarkIds = Array.isArray(payload.bookmarkIds)
        ? payload.bookmarkIds.filter((id): id is string => typeof id === 'string')
        : [];

      const collection = await addBookmarksToCollection(session.user.id, collectionId, bookmarkIds);
      return NextResponse.json({ collection });
    }

    const collection = await toggleCollectionShare(session.user.id, collectionId, Boolean(payload.isPublic));
    return NextResponse.json({ collection });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
