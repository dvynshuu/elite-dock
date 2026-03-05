import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
  restoreBookmark,
  updateBookmark
} from '@/lib/database/bookmarks';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const bookmarks = await listBookmarks({
    userId: session.user.id,
    query: searchParams.get('q') || undefined,
    folderId: searchParams.get('folderId') || undefined,
    favoritesOnly: searchParams.get('favorites') === 'true',
    includeDeleted: searchParams.get('deleted') === 'true'
  });

  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bookmark = await createBookmark(session.user.id, {
      title: body.title,
      url: body.url,
      description: body.description,
      notes: body.notes,
      favicon: body.favicon,
      thumbnail: body.thumbnail,
      siteName: body.siteName,
      folderId: body.folderId,
      tags: body.tags
    });

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create bookmark' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bookmark = await updateBookmark(session.user.id, body.id, {
      title: body.title,
      description: body.description,
      notes: body.notes,
      folderId: body.folderId,
      tags: body.tags,
      isFavorite: body.isFavorite,
      isDeleted: body.isDeleted
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update bookmark' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.restore) {
      await restoreBookmark(session.user.id, body.id);
      return NextResponse.json({ ok: true, restored: true });
    }

    await deleteBookmark(session.user.id, body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete bookmark' },
      { status: 400 }
    );
  }
}
