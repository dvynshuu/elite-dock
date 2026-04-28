import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
  restoreBookmark,
  updateBookmark
} from '@/lib/database/bookmarks';
import {
  getPublicError,
  normalizeBookmarkActionInput,
  normalizeBookmarkCreateInput,
  normalizeBookmarkUpdateInput
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '24');
  const result = await listBookmarks({
    userId: session.user.id,
    query: searchParams.get('q') || undefined,
    folderId: searchParams.get('folderId') || undefined,
    tag: searchParams.get('tag') || undefined,
    favoritesOnly: searchParams.get('favorites') === 'true',
    includeDeleted: searchParams.get('deleted') === 'true',
    sort:
      searchParams.get('sort') === 'oldest' || searchParams.get('sort') === 'visited'
        ? (searchParams.get('sort') as 'oldest' | 'visited')
        : 'newest',
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 24
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Create bookmark payload:', body);
    const input = normalizeBookmarkCreateInput(body);
    const bookmark = await createBookmark(session.user.id, input);

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    console.error('Create Bookmark Error:', error);
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
    const input = normalizeBookmarkUpdateInput(await request.json());
    const bookmark = await updateBookmark(session.user.id, input.id, input);

    return NextResponse.json({ bookmark });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = normalizeBookmarkActionInput(await request.json());

    if (input.restore) {
      await restoreBookmark(session.user.id, input.id);
      return NextResponse.json({ ok: true, restored: true });
    }

    await deleteBookmark(session.user.id, input.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
