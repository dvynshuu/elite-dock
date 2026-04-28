import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createBookmark } from '@/lib/database/bookmarks';
import { assertRateLimit } from '@/lib/rate-limit';
import { getPublicError, normalizeImportInput } from '@/lib/validation';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    assertRateLimit(`bookmark-import:${session.user.id}`, 5, 60_000);
    const rows = normalizeImportInput(await request.json());
    const created = [];

    for (const row of rows) {
      const bookmark = await createBookmark(session.user.id, row);

      created.push(bookmark.id);
    }

    return NextResponse.json({ imported: created.length });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
