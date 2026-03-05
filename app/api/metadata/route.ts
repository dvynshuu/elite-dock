import { NextResponse } from 'next/server';
import { fetchMetadata } from '@/lib/metadata';
import { getAuthSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const url = String(body.url || '').trim();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const data = await fetchMetadata(url);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Metadata fetch failed' },
      { status: 500 }
    );
  }
}
