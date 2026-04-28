import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { PublicError } from '@/lib/validation';

type BookmarkFilters = {
  userId: string;
  query?: string;
  folderId?: string;
  tag?: string;
  favoritesOnly?: boolean;
  includeDeleted?: boolean;
  sort?: 'newest' | 'oldest' | 'visited';
  limit?: number;
  page?: number;
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
    throw new PublicError('Bookmark not found', 404);
  }
}

async function ensureFolderOwner(userId: string, folderId: string | null | undefined) {
  if (!folderId) return null;

  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!folder) {
    throw new PublicError('Folder not found', 404);
  }

  return folder.id;
}

export async function listBookmarks(filters: BookmarkFilters) {
  const {
    userId,
    query,
    folderId,
    tag,
    favoritesOnly,
    includeDeleted,
    sort = 'newest',
    limit = 24,
    page = 1
  } = filters;

  const where: Prisma.BookmarkWhereInput = {
    userId,
    folderId: folderId || undefined,
    isFavorite: favoritesOnly ? true : undefined,
    isDeleted: includeDeleted ? true : false,
    tags: tag
      ? {
          some: {
            tag: {
              name: {
                equals: tag.toLowerCase()
              }
            }
          }
        }
      : undefined,
    OR: query
      ? [
          { title: { contains: query } },
          { url: { contains: query } },
          { notes: { contains: query } },
          { description: { contains: query } },
          {
            tags: {
              some: {
                tag: { name: { contains: query } }
              }
            }
          }
        ]
      : undefined
  };

  const orderBy: Prisma.BookmarkOrderByWithRelationInput[] =
    sort === 'oldest'
      ? [{ createdAt: 'asc' }, { id: 'asc' }]
      : sort === 'visited'
        ? [{ visitedCount: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }, { id: 'desc' }];

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [bookmarks, totalCount] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      include: bookmarkInclude,
      orderBy,
      take: safeLimit,
      skip
    }),
    prisma.bookmark.count({ where })
  ]);

  return {
    bookmarks,
    totalCount,
    page: safePage,
    limit: safeLimit,
    hasMore: skip + bookmarks.length < totalCount
  };
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
  const folderId = await ensureFolderOwner(userId, payload.folderId);
  try {
    return await prisma.bookmark.create({
      data: {
        userId,
        title: payload.title,
        url: payload.url,
        description: payload.description,
        notes: payload.notes,
        favicon: payload.favicon,
        thumbnail: payload.thumbnail,
        siteName: payload.siteName,
        folderId: folderId || null,
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new PublicError('You already saved this URL');
    }

    throw error;
  }
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
  const folderId =
    payload.folderId === undefined ? undefined : await ensureFolderOwner(userId, payload.folderId ?? null);

  const tags = payload.tags || [];

  return prisma.bookmark.update({
    where: {
      id: bookmarkId
    },
    data: {
      title: payload.title,
      description: payload.description,
      notes: payload.notes,
      folderId,
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
  try {
    return await prisma.folder.create({
      data: {
        name,
        color: color || '#4f46e5',
        userId
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new PublicError('A folder with that name already exists');
    }

    throw error;
  }
}

export async function batchUpdateBookmarks(
  userId: string,
  bookmarkIds: string[],
  payload: {
    isFavorite?: boolean;
    isDeleted?: boolean;
    folderId?: string | null;
  }
) {
  const ids = Array.from(new Set(bookmarkIds.filter(Boolean)));
  if (!ids.length) {
    throw new PublicError('Select at least one bookmark');
  }

  const ownedBookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      id: {
        in: ids
      }
    },
    select: {
      id: true
    }
  });

  if (ownedBookmarks.length !== ids.length) {
    throw new PublicError('Some bookmarks were not found', 404);
  }

  const folderId =
    payload.folderId === undefined ? undefined : await ensureFolderOwner(userId, payload.folderId ?? null);

  await prisma.bookmark.updateMany({
    where: {
      userId,
      id: {
        in: ids
      }
    },
    data: {
      isFavorite: payload.isFavorite,
      isDeleted: payload.isDeleted,
      folderId
    }
  });

  return prisma.bookmark.findMany({
    where: {
      userId,
      id: {
        in: ids
      }
    },
    include: bookmarkInclude
  });
}

function createPublicSlug() {
  return randomBytes(6).toString('base64url').toLowerCase();
}

type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  isPublic: number | boolean | null;
  publicSlug: string | null;
  bookmarkCount: number;
};

async function getCollectionById(collectionId: string) {
  const rows = await prisma.$queryRaw<CollectionRow[]>`
    SELECT
      c.id,
      c.name,
      c.description,
      c.isPublic,
      c.publicSlug,
      COUNT(bc.bookmarkId) as bookmarkCount
    FROM Collection c
    LEFT JOIN BookmarkCollection bc ON bc.collectionId = c.id
    WHERE c.id = ${collectionId}
    GROUP BY c.id, c.name, c.description, c.isPublic, c.publicSlug
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: Boolean(row.isPublic),
    publicSlug: row.publicSlug,
    _count: {
      bookmarks: Number(row.bookmarkCount || 0)
    }
  };
}

export async function listCollections(userId: string) {
  const rows = await prisma.$queryRaw<CollectionRow[]>`
    SELECT
      c.id,
      c.name,
      c.description,
      c.isPublic,
      c.publicSlug,
      COUNT(bc.bookmarkId) as bookmarkCount
    FROM Collection c
    LEFT JOIN BookmarkCollection bc ON bc.collectionId = c.id
    WHERE c.userId = ${userId}
    GROUP BY c.id, c.name, c.description, c.isPublic, c.publicSlug, c.updatedAt
    ORDER BY c.isPublic DESC, c.updatedAt DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: Boolean(row.isPublic),
    publicSlug: row.publicSlug,
    _count: {
      bookmarks: Number(row.bookmarkCount || 0)
    }
  }));
}

export async function createCollection(userId: string, payload: { name: string; description?: string; bookmarkIds?: string[] }) {
  const bookmarkIds = Array.from(new Set(payload.bookmarkIds || []));

  if (bookmarkIds.length) {
    const bookmarks = await prisma.bookmark.count({
      where: {
        userId,
        id: {
          in: bookmarkIds
        }
      }
    });

    if (bookmarks !== bookmarkIds.length) {
      throw new PublicError('Some bookmarks were not found', 404);
    }
  }

  try {
    const created = await prisma.collection.create({
      data: {
        userId,
        name: payload.name,
        description: payload.description,
        bookmarks: bookmarkIds.length
          ? {
              create: bookmarkIds.map((bookmarkId) => ({
                bookmark: {
                  connect: {
                    id: bookmarkId
                  }
                }
              }))
            }
          : undefined
      },
    });
    return getCollectionById(created.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new PublicError('A collection with that name already exists');
    }

    throw error;
  }
}

async function ensureCollectionOwner(userId: string, collectionId: string) {
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!collection) {
    throw new PublicError('Collection not found', 404);
  }
}

export async function addBookmarksToCollection(userId: string, collectionId: string, bookmarkIds: string[]) {
  await ensureCollectionOwner(userId, collectionId);
  const ids = Array.from(new Set(bookmarkIds));

  const bookmarks = await prisma.bookmark.count({
    where: {
      userId,
      id: {
        in: ids
      }
    }
  });

  if (bookmarks !== ids.length) {
    throw new PublicError('Some bookmarks were not found', 404);
  }

  const existingLinks = await prisma.bookmarkCollection.findMany({
    where: {
      collectionId,
      bookmarkId: {
        in: ids
      }
    },
    select: {
      bookmarkId: true
    }
  });

  const existingIds = new Set(existingLinks.map((item) => item.bookmarkId));
  const newIds = ids.filter((id) => !existingIds.has(id));

  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      bookmarks: newIds.length
        ? {
            create: newIds.map((bookmarkId) => ({
              bookmark: {
                connect: {
                  id: bookmarkId
                }
              }
            }))
          }
        : undefined
    }
  });

  return getCollectionById(collectionId);
}

export async function toggleCollectionShare(userId: string, collectionId: string, isPublic: boolean) {
  await ensureCollectionOwner(userId, collectionId);

  await prisma.$executeRaw`
    UPDATE Collection
    SET isPublic = ${isPublic ? 1 : 0},
        publicSlug = ${isPublic ? createPublicSlug() : null}
    WHERE id = ${collectionId} AND userId = ${userId}
  `;

  return getCollectionById(collectionId);
}

export async function getPublicCollectionBySlug(slug: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; name: string; description: string | null; userName: string | null }>>`
    SELECT c.id, c.name, c.description, u.name as userName
    FROM Collection c
    INNER JOIN User u ON u.id = c.userId
    WHERE c.publicSlug = ${slug} AND c.isPublic = 1
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  const collection = await prisma.collection.findUnique({
    where: { id: row.id },
    include: {
      bookmarks: {
        include: {
          bookmark: {
            include: bookmarkInclude
          }
        }
      }
    }
  });

  if (!collection) {
    return null;
  }

  return {
    ...collection,
    name: row.name,
    description: row.description,
    user: {
      name: row.userName
    }
  };
}

export async function getDashboardInsights(userId: string) {
  const now = new Date();
  const staleDate = new Date(now);
  staleDate.setDate(staleDate.getDate() - 14);

  const [inbox, staleFavorites, recentlySaved] = await Promise.all([
    prisma.bookmark.findMany({
      where: {
        userId,
        isDeleted: false,
        visitedCount: 0
      },
      include: bookmarkInclude,
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.bookmark.findMany({
      where: {
        userId,
        isDeleted: false,
        isFavorite: true,
        OR: [{ lastVisitedAt: null }, { lastVisitedAt: { lt: staleDate } }]
      },
      include: bookmarkInclude,
      orderBy: [{ lastVisitedAt: 'asc' }, { createdAt: 'desc' }],
      take: 5
    }),
    prisma.bookmark.findMany({
      where: {
        userId,
        isDeleted: false
      },
      include: bookmarkInclude,
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  return {
    inbox,
    staleFavorites,
    recentlySaved
  };
}
