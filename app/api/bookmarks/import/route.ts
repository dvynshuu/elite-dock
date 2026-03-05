import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createBookmark } from '@/lib/database/bookmarks';

type ImportedBookmark = {
  title?: string;
  url?: string;
  description?: string;
  tags?: string[];
};

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rows: ImportedBookmark[] = Array.isArray(body.bookmarks) ? body.bookmarks : [];

    if (!rows.length) {
      return NextResponse.json({ error: 'No bookmarks supplied' }, { status: 400 });
    }

    const created = [];

    for (const row of rows) {
      if (!row.url || !row.title) continue;

      const bookmark = await createBookmark(session.user.id, {
        title: row.title,
        url: row.url,
        description: row.description,
        tags: row.tags || []
      });

      created.push(bookmark.id);
    }

    return NextResponse.json({ imported: created.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 400 }
    );
  }
}
