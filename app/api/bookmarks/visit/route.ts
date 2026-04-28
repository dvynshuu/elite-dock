import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { incrementVisit } from '@/lib/database/bookmarks';
import { assertRateLimit } from '@/lib/rate-limit';
import { getPublicError, normalizeBookmarkActionInput } from '@/lib/validation';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    assertRateLimit(`bookmark-visit:${session.user.id}`, 300, 60_000);
    const input = normalizeBookmarkActionInput(await request.json());
    await incrementVisit(session.user.id, input.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
