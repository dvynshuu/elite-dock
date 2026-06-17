'use server';

import { revalidatePath } from 'next/cache';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ensureUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function createNoteAction(payload: {
  title: string;
  content: string;
  color?: string;
  isPinned?: boolean;
  folderId?: string | null;
}) {
  const userId = await ensureUser();
  const note = await prisma.note.create({
    data: {
      userId,
      title: payload.title,
      content: payload.content,
      color: payload.color ?? 'default',
      isPinned: payload.isPinned ?? false,
      folderId: payload.folderId || null,
    },
    include: {
      folder: true
    }
  });
  revalidatePath('/dashboard');
  return note;
}

export async function updateNoteAction(
  noteId: string,
  payload: {
    title?: string;
    content?: string;
    color?: string;
    isPinned?: boolean;
    isArchived?: boolean;
    folderId?: string | null;
  }
) {
  const userId = await ensureUser();
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });
  if (!note || note.userId !== userId) {
    throw new Error('NotFound');
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data: {
      title: payload.title !== undefined ? payload.title : undefined,
      content: payload.content !== undefined ? payload.content : undefined,
      color: payload.color !== undefined ? payload.color : undefined,
      isPinned: payload.isPinned !== undefined ? payload.isPinned : undefined,
      isArchived: payload.isArchived !== undefined ? payload.isArchived : undefined,
      folderId: payload.folderId !== undefined ? payload.folderId : undefined,
    },
    include: {
      folder: true
    }
  });

  revalidatePath('/dashboard');
  return updated;
}

export async function deleteNoteAction(noteId: string) {
  const userId = await ensureUser();
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });
  if (!note || note.userId !== userId) {
    throw new Error('NotFound');
  }

  await prisma.note.delete({
    where: { id: noteId },
  });

  revalidatePath('/dashboard');
}
