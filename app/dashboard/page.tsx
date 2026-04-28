import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getDashboardInsights, listBookmarks, listCollections } from '@/lib/database/bookmarks';

export default async function DashboardPage(
  props: {
    searchParams?: Promise<{ view?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const initialView = searchParams?.view === 'trash' ? 'trash' : searchParams?.view === 'today' ? 'today' : 'all';

  const [bookmarkResult, folders, tags, totalCount, favoriteCount, trashCount, mostVisited, collections, insights] = await Promise.all([
    listBookmarks({
      userId,
      includeDeleted: initialView === 'trash',
      limit: 24,
      page: 1
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
    }),
    listCollections(userId),
    getDashboardInsights(userId)
  ]);

  const serialize = <T extends { createdAt: Date }>(rows: T[]) =>
    rows.map((bookmark) => ({
      ...bookmark,
      createdAt: bookmark.createdAt.toISOString()
    }));

  return (
    <DashboardShell
      initialView={initialView}
      initialBookmarks={serialize(bookmarkResult.bookmarks)}
      initialTotalCount={bookmarkResult.totalCount}
      initialHasMore={bookmarkResult.hasMore}
      folders={folders}
      tags={tags}
      collections={collections.map((collection: any) => ({
        ...collection,
        isPublic: Boolean(collection.isPublic),
        publicSlug: collection.publicSlug ?? null
      }))}
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
      insights={{
        inbox: serialize(insights.inbox),
        staleFavorites: serialize(insights.staleFavorites),
        recentlySaved: serialize(insights.recentlySaved)
      }}
    />
  );
}
