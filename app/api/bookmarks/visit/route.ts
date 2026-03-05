import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { incrementVisit } from '@/lib/database/bookmarks';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await incrementVisit(session.user.id, body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record visit' },
      { status: 400 }
    );
  }
}
