import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type BookmarkFilters = {
  userId: string;
  query?: string;
  folderId?: string;
  favoritesOnly?: boolean;
  includeDeleted?: boolean;
};

const bookmarkInclude = {
  folder: true,
  tags: {
    include: {
      tag: true
    }
  },
  collections: {
    include: {
      collection: true
    }
  }
} satisfies Prisma.BookmarkInclude;

async function ensureBookmarkOwner(userId: string, bookmarkId: string) {
  const bookmark = await prisma.bookmark.findFirst({
    where: {
      id: bookmarkId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!bookmark) {
    throw new Error('Bookmark not found');
  }
}

export async function listBookmarks(filters: BookmarkFilters) {
  const { userId, query, folderId, favoritesOnly, includeDeleted } = filters;

  return prisma.bookmark.findMany({
    where: {
      userId,
      folderId: folderId || undefined,
      isFavorite: favoritesOnly ? true : undefined,
      isDeleted: includeDeleted ? true : false,
      OR: query
        ? [
            { title: { contains: query, mode: 'insensitive' } },
            { url: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
            {
              tags: {
                some: {
                  tag: { name: { contains: query, mode: 'insensitive' } }
                }
              }
            }
          ]
        : undefined
    },
    include: bookmarkInclude,
    orderBy: { createdAt: 'desc' }
  });
}

export async function createBookmark(
  userId: string,
  payload: {
    title: string;
    url: string;
    description?: string;
    notes?: string;
    favicon?: string;
    thumbnail?: string;
    siteName?: string;
    folderId?: string;
    tags?: string[];
  }
) {
  const tags = payload.tags || [];

  return prisma.bookmark.create({
    data: {
      userId,
      title: payload.title,
      url: payload.url,
      description: payload.description,
      notes: payload.notes,
      favicon: payload.favicon,
      thumbnail: payload.thumbnail,
      siteName: payload.siteName,
      folderId: payload.folderId || null,
      tags: {
        create: tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { userId_name: { userId, name: name.trim().toLowerCase() } },
              create: { name: name.trim().toLowerCase(), userId }
            }
          }
        }))
      }
    },
    include: bookmarkInclude
  });
}

export async function updateBookmark(
  userId: string,
  bookmarkId: string,
  payload: {
    title?: string;
    description?: string;
    notes?: string;
    folderId?: string | null;
    tags?: string[];
    isFavorite?: boolean;
    isDeleted?: boolean;
  }
) {
  await ensureBookmarkOwner(userId, bookmarkId);

  const tags = payload.tags || [];

  return prisma.bookmark.update({
    where: {
      id: bookmarkId
    },
    data: {
      title: payload.title,
      description: payload.description,
      notes: payload.notes,
      folderId: payload.folderId === undefined ? undefined : payload.folderId,
      isFavorite: payload.isFavorite,
      isDeleted: payload.isDeleted,
      tags: payload.tags
        ? {
            deleteMany: {},
            create: tags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId, name: name.trim().toLowerCase() } },
                  create: { userId, name: name.trim().toLowerCase() }
                }
              }
            }))
          }
        : undefined
    },
    include: bookmarkInclude
  });
}

export async function incrementVisit(userId: string, bookmarkId: string) {
  await ensureBookmarkOwner(userId, bookmarkId);

  return prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      visitedCount: { increment: 1 },
      lastVisitedAt: new Date()
    }
  });
}

export async function deleteBookmark(userId: string, bookmarkId: string) {
  await ensureBookmarkOwner(userId, bookmarkId);

  return prisma.bookmark.update({
    where: {
      id: bookmarkId
    },
    data: {
      isDeleted: true
    }
  });
}

export async function restoreBookmark(userId: string, bookmarkId: string) {
  await ensureBookmarkOwner(userId, bookmarkId);

  return prisma.bookmark.update({
    where: {
      id: bookmarkId
    },
    data: {
      isDeleted: false
    }
  });
}

export async function listSidebarData(userId: string) {
  const [folders, tags] = await Promise.all([
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
                bookmark: {
                  isDeleted: false
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  ]);

  return { folders, tags };
}

export async function createFolder(userId: string, name: string, color?: string) {
  return prisma.folder.create({
    data: {
      name,
      color: color || '#4f46e5',
      userId
    }
  });
}
