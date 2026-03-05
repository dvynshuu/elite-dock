'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid';
import { AddBookmarkModal } from '@/components/bookmarks/AddBookmarkModal';
import { EditBookmarkModal } from '@/components/bookmarks/EditBookmarkModal';
import { useToast } from '@/components/ui/ToastProvider';
import { BookmarkView, FolderView } from '@/types/bookmark';

type Tag = {
  id: string;
  name: string;
  _count?: { bookmarks: number };
};

type DashboardShellProps = {
  initialView: 'all' | 'trash';
  initialBookmarks: BookmarkView[];
  folders: FolderView[];
  tags: Tag[];
  stats: {
    totalCount: number;
    favoriteCount: number;
    trashCount: number;
  };
  sessionUser: {
    name: string;
    email: string;
  };
  mostVisited: BookmarkView[];
};

export function DashboardShell({
  initialView,
  initialBookmarks,
  folders,
  tags,
  stats,
  sessionUser,
  mostVisited
}: DashboardShellProps) {
  const [view, setView] = useState<'all' | 'favorites' | 'trash'>(initialView === 'trash' ? 'trash' : 'all');
  const [bookmarks, setBookmarks] = useState<BookmarkView[]>(initialBookmarks);
  const [foldersState, setFoldersState] = useState(folders);
  const [query, setQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBookmark, setEditBookmark] = useState<BookmarkView | null>(null);
  const [statsState, setStatsState] = useState(stats);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { pushToast } = useToast();

  const loadBookmarks = useCallback(async () => {
    const params = new URLSearchParams();
    if (view === 'favorites') params.set('favorites', 'true');
    if (view === 'trash') params.set('deleted', 'true');

    const response = await fetch(`/api/bookmarks?${params.toString()}`);
    if (!response.ok) {
      pushToast('Failed to load bookmarks', 'danger');
      return;
    }

    const payload = await response.json();
    setBookmarks(
      payload.bookmarks.map((bookmark: any) => ({
        ...bookmark,
        createdAt: new Date(bookmark.createdAt).toISOString()
      }))
    );
    setSelectedIds([]);
  }, [pushToast, view]);

  useEffect(() => {
    if (view !== (initialView === 'trash' ? 'trash' : 'all')) {
      loadBookmarks();
    }
  }, [view, loadBookmarks, initialView]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (isTyping) return;

      if (event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setShowAddModal(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredBookmarks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return bookmarks
      .filter((bookmark) => (selectedFolderId ? bookmark.folderId === selectedFolderId : true))
      .filter((bookmark) =>
        selectedTag ? bookmark.tags.some((item) => item.tag.name.toLowerCase() === selectedTag.toLowerCase()) : true
      )
      .filter((bookmark) => {
        if (!search) return true;
        const haystack = [
          bookmark.title,
          bookmark.url,
          bookmark.notes || '',
          bookmark.description || '',
          bookmark.tags.map((item) => item.tag.name).join(' ')
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });
  }, [bookmarks, query, selectedFolderId, selectedTag]);

  const quickAccess = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.isFavorite && !bookmark.isDeleted).slice(0, 5),
    [bookmarks]
  );
  const recentlyAdded = useMemo(() => bookmarks.slice(0, 5), [bookmarks]);

  const upsertBookmark = (updated: BookmarkView) => {
    setBookmarks((prev) => {
      const exists = prev.some((item) => item.id === updated.id);
      if (!exists) return [updated, ...prev];
      return prev.map((item) => (item.id === updated.id ? updated : item));
    });
  };

  const openBookmark = async (bookmark: BookmarkView) => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    await fetch('/api/bookmarks/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookmark.id })
    });

    setBookmarks((prev) =>
      prev.map((item) =>
        item.id === bookmark.id ? { ...item, visitedCount: item.visitedCount + 1, lastVisitedAt: new Date().toISOString() } : item
      )
    );
  };

  const deleteOrRestoreBookmark = async (bookmark: BookmarkView) => {
    const response = await fetch('/api/bookmarks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bookmark.id,
        restore: bookmark.isDeleted
      })
    });

    if (!response.ok) {
      pushToast('Bookmark action failed', 'danger');
      return;
    }

    if (bookmark.isDeleted) {
      setBookmarks((prev) => prev.filter((item) => item.id !== bookmark.id));
      setStatsState((prev) => ({ ...prev, trashCount: Math.max(prev.trashCount - 1, 0), totalCount: prev.totalCount + 1 }));
      pushToast('Bookmark restored', 'success');
      return;
    }

    setBookmarks((prev) => prev.filter((item) => item.id !== bookmark.id));
    setStatsState((prev) => ({ ...prev, trashCount: prev.trashCount + 1, totalCount: Math.max(prev.totalCount - 1, 0) }));
    pushToast('Bookmark moved to trash', 'info');
  };

  const toggleFavorite = async (bookmark: BookmarkView) => {
    const response = await fetch('/api/bookmarks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bookmark.id,
        isFavorite: !bookmark.isFavorite
      })
    });

    if (!response.ok) {
      pushToast('Failed to update favorite', 'danger');
      return;
    }

    const payload = await response.json();
    upsertBookmark({ ...payload.bookmark, createdAt: new Date(payload.bookmark.createdAt).toISOString() });
    setStatsState((prev) => ({
      ...prev,
      favoriteCount: bookmark.isFavorite ? Math.max(prev.favoriteCount - 1, 0) : prev.favoriteCount + 1
    }));
  };

  const selectBookmark = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id)));
  };

  const selectAllVisible = (ids: string[]) => {
    setSelectedIds((prev) => (prev.length ? [] : ids));
  };

  const bulkDelete = async () => {
    await Promise.all(
      selectedIds.map((id) =>
        fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })
      )
    );

    setBookmarks((prev) => prev.filter((bookmark) => !selectedIds.includes(bookmark.id)));
    setSelectedIds([]);
    pushToast('Selected bookmarks moved to trash', 'info');
  };

  const bulkFavorite = async () => {
    await Promise.all(
      selectedIds.map((id) =>
        fetch('/api/bookmarks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, isFavorite: true })
        })
      )
    );

    setBookmarks((prev) =>
      prev.map((bookmark) => (selectedIds.includes(bookmark.id) ? { ...bookmark, isFavorite: true } : bookmark))
    );
    setSelectedIds([]);
    pushToast('Selected bookmarks favorited', 'success');
  };

  const createFolder = async (name: string) => {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      pushToast('Failed to create folder', 'danger');
      return;
    }

    const payload = await response.json();
    setFoldersState((prev) => [...prev, payload.folder]);
    pushToast('Folder created', 'success');
  };

  const dropBookmarkToFolder = async (bookmarkId: string, folderId: string) => {
    const response = await fetch('/api/bookmarks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookmarkId, folderId })
    });

    if (!response.ok) {
      pushToast('Could not move bookmark', 'danger');
      return;
    }

    const payload = await response.json();
    upsertBookmark({ ...payload.bookmark, createdAt: new Date(payload.bookmark.createdAt).toISOString() });
    pushToast('Bookmark moved', 'success');
  };

  return (
    <div className="dashboard-shell">
      <Sidebar
        view={view}
        onViewChange={setView}
        folders={foldersState}
        tags={tags}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onFolderSelect={setSelectedFolderId}
        onTagSelect={setSelectedTag}
        onCreateFolder={createFolder}
        onDropBookmark={dropBookmarkToFolder}
        stats={statsState}
      />

      <div className="main-content-elite">
        <Topbar query={query} onQueryChange={setQuery} onAdd={() => setShowAddModal(true)} inputRef={searchInputRef} user={sessionUser} />

        <div className="flex-col gap-6">
          {selectedIds.length ? (
            <div className="card-elite flex items-center justify-between" style={{ padding: '1rem 2rem' }}>
              <div className="flex items-center gap-4">
                <span style={{ fontWeight: 700 }}>{selectedIds.length} Selected</span>
                <button type="button" className="btn-elite btn-elite-secondary" onClick={bulkFavorite}>
                  Favorite Selected
                </button>
                <button type="button" className="btn-elite btn-elite-secondary" style={{ color: '#ef4444' }} onClick={bulkDelete}>
                  Move to Trash
                </button>
              </div>
              <button type="button" className="text-primary" onClick={() => setSelectedIds([])}>Clear</button>
            </div>
          ) : null}

          {view !== 'trash' ? (
            <div className="grid grid-cols-3 gap-8">
              <div className="card-elite flex items-center gap-6" style={{ padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', background: 'var(--accent-glow)', width: '64px', height: '64px', display: 'grid', placeItems: 'center', borderRadius: '16px' }}>📚</div>
                <div className="flex-col">
                  <p className="text-muted uppercase mb-1" style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em' }}>Total Library</p>
                  <p style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--text-primary)', lineHeight: 1 }}>{statsState.totalCount}</p>
                </div>
              </div>
              <div className="card-elite flex items-center gap-6" style={{ padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', background: 'var(--accent-glow)', width: '64px', height: '64px', display: 'grid', placeItems: 'center', borderRadius: '16px' }}>🔥</div>
                <div className="flex-col">
                  <p className="text-muted uppercase mb-1" style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em' }}>Peak Visited</p>
                  <p style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--text-primary)', lineHeight: 1 }}>{mostVisited.length}</p>
                </div>
              </div>
              <div className="card-elite flex items-center gap-6" style={{ padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', background: 'var(--accent-glow)', width: '64px', height: '64px', display: 'grid', placeItems: 'center', borderRadius: '16px' }}>⚡</div>
                <div className="flex-col">
                  <p className="text-muted uppercase mb-1" style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em' }}>Quick Access</p>
                  <p style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--text-primary)', lineHeight: 1 }}>{quickAccess.length}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <BookmarkGrid
              bookmarks={filteredBookmarks}
              selectedIds={selectedIds}
              onSelect={selectBookmark}
              onSelectAll={selectAllVisible}
              onOpen={openBookmark}
              onEdit={setEditBookmark}
              onDelete={deleteOrRestoreBookmark}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>
      </div>

      <AddBookmarkModal
        show={showAddModal}
        folders={foldersState}
        onClose={() => setShowAddModal(false)}
        onCreated={(bookmark) => {
          upsertBookmark(bookmark);
          setStatsState((prev) => ({ ...prev, totalCount: prev.totalCount + 1 }));
        }}
      />

      <EditBookmarkModal
        show={Boolean(editBookmark)}
        bookmark={editBookmark}
        folders={foldersState}
        onClose={() => setEditBookmark(null)}
        onUpdated={(bookmark) => {
          upsertBookmark(bookmark);
          setEditBookmark(null);
        }}
      />
    </div>
  );
}
