import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { batchUpdateBookmarks } from '@/lib/database/bookmarks';
import { getPublicError, parseJsonObject } from '@/lib/validation';

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = parseJsonObject(await request.json());
    const ids = Array.isArray(payload.ids) ? payload.ids.filter((id): id is string => typeof id === 'string') : [];

    const bookmarks = await batchUpdateBookmarks(session.user.id, ids, {
      isFavorite: payload.isFavorite === undefined ? undefined : Boolean(payload.isFavorite),
      isDeleted: payload.isDeleted === undefined ? undefined : Boolean(payload.isDeleted),
      folderId:
        payload.folderId === undefined ? undefined : payload.folderId === null ? null : String(payload.folderId).trim()
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
