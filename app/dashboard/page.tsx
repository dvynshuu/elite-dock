import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { view?: string };
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [bookmarks, folders, tags, totalCount, favoriteCount, trashCount, mostVisited] = await Promise.all([
    prisma.bookmark.findMany({
      where: {
        userId,
        isDeleted: searchParams?.view === 'trash'
      },
      include: {
        folder: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.folder.findMany({
      where: { userId },
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
    }),
    prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            bookmarks: {
              where: {
                bookmark: { isDeleted: false }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.bookmark.count({ where: { userId, isDeleted: false } }),
    prisma.bookmark.count({ where: { userId, isDeleted: false, isFavorite: true } }),
    prisma.bookmark.count({ where: { userId, isDeleted: true } }),
    prisma.bookmark.findMany({
      where: {
        userId,
        isDeleted: false,
        visitedCount: { gt: 0 }
      },
      include: {
        folder: true,
        tags: { include: { tag: true } }
      },
      orderBy: {
        visitedCount: 'desc'
      },
      take: 6
    })
  ]);

  const serialize = (rows: typeof bookmarks) =>
    rows.map((bookmark) => ({
      ...bookmark,
      createdAt: bookmark.createdAt.toISOString()
    }));

  return (
    <DashboardShell
      initialView={searchParams?.view === 'trash' ? 'trash' : 'all'}
      initialBookmarks={serialize(bookmarks)}
      folders={folders}
      tags={tags}
      stats={{
        totalCount,
        favoriteCount,
        trashCount
      }}
      sessionUser={{
        name: session.user.name || 'Anonymous',
        email: session.user.email || ''
      }}
      mostVisited={serialize(mostVisited)}
    />
  );
}
