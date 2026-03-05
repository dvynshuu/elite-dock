'use server';

import { revalidatePath } from 'next/cache';
import { getAuthSession } from '@/lib/auth';
import {
  createBookmark,
  createFolder,
  deleteBookmark,
  updateBookmark
} from '@/lib/database/bookmarks';

async function ensureUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function createBookmarkAction(payload: {
  title: string;
  url: string;
  description?: string;
  notes?: string;
  favicon?: string;
  thumbnail?: string;
  siteName?: string;
  folderId?: string;
  tags?: string[];
}) {
  const userId = await ensureUser();
  const result = await createBookmark(userId, payload);
  revalidatePath('/dashboard');
  return result;
}

export async function updateBookmarkAction(
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
  const userId = await ensureUser();
  const result = await updateBookmark(userId, bookmarkId, payload);
  revalidatePath('/dashboard');
  return result;
}

export async function deleteBookmarkAction(bookmarkId: string) {
  const userId = await ensureUser();
  await deleteBookmark(userId, bookmarkId);
  revalidatePath('/dashboard');
}

export async function createFolderAction(name: string, color?: string) {
  const userId = await ensureUser();
  const folder = await createFolder(userId, name, color);
  revalidatePath('/dashboard');
  return folder;
}
