import { NextResponse } from 'next/server';
import { fetchMetadata } from '@/lib/metadata';
import { getAuthSession } from '@/lib/auth';
import { assertRateLimit } from '@/lib/rate-limit';
import { getPublicError, normalizeMetadataInput } from '@/lib/validation';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    assertRateLimit(`metadata:${session.user.id}`, 30, 60_000);
    const input = normalizeMetadataInput(body);
    const data = await fetchMetadata(input.url);
    return NextResponse.json(data);
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
