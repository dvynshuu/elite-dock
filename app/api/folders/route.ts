import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createFolder } from '@/lib/database/bookmarks';
import { prisma } from '@/lib/prisma';
import { getPublicError, normalizeFolderInput } from '@/lib/validation';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          bookmarks: {
            where: {
              isDeleted: false
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = normalizeFolderInput(await request.json());
    const folder = await createFolder(session.user.id, input.name, input.color);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
