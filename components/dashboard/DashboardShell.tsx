'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid';
import { AddBookmarkModal } from '@/components/bookmarks/AddBookmarkModal';
import { EditBookmarkModal } from '@/components/bookmarks/EditBookmarkModal';
import { ImportBookmarksModal } from '@/components/bookmarks/ImportBookmarksModal';
import { TodayPanel } from '@/components/dashboard/TodayPanel';
import { CollectionsPanel } from '@/components/dashboard/CollectionsPanel';
import { useToast } from '@/components/ui/ToastProvider';
import { BookmarkView, CollectionView, FolderView } from '@/types/bookmark';

type Tag = {
  id: string;
  name: string;
  _count?: { bookmarks: number };
};

type DashboardShellProps = {
  initialView: 'all' | 'trash' | 'today';
  initialBookmarks: BookmarkView[];
  initialTotalCount: number;
  initialHasMore: boolean;
  folders: FolderView[];
  tags: Tag[];
  collections: CollectionView[];
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
  insights: {
    inbox: BookmarkView[];
    staleFavorites: BookmarkView[];
    recentlySaved: BookmarkView[];
  };
};

export function DashboardShell({
  initialView,
  initialBookmarks,
  initialTotalCount,
  initialHasMore,
  folders,
  tags,
  collections,
  stats,
  sessionUser,
  mostVisited,
  insights
}: DashboardShellProps) {
  const [view, setView] = useState<'all' | 'favorites' | 'trash' | 'today'>(initialView);
  const [bookmarks, setBookmarks] = useState<BookmarkView[]>(initialBookmarks);
  const [foldersState, setFoldersState] = useState(folders);
  const [collectionsState, setCollectionsState] = useState(collections);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editBookmark, setEditBookmark] = useState<BookmarkView | null>(null);
  const [statsState, setStatsState] = useState(stats);
  const [insightsState, setInsightsState] = useState(insights);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'visited'>('newest');
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { pushToast } = useToast();

  const normalizeBookmark = useCallback(
    (bookmark: any) => ({
      ...bookmark,
      createdAt: new Date(bookmark.createdAt).toISOString()
    }),
    []
  );

  const loadBookmarks = useCallback(async (page = 1, append = false) => {
    if (view === 'today') return;

    const params = new URLSearchParams();
    if (view === 'favorites') params.set('favorites', 'true');
    if (view === 'trash') params.set('deleted', 'true');
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (selectedFolderId) params.set('folderId', selectedFolderId);
    if (selectedTag) params.set('tag', selectedTag);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '24');

    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingList(true);
    }

    const response = await fetch(`/api/bookmarks?${params.toString()}`);
    if (!response.ok) {
      pushToast('Failed to load bookmarks', 'danger');
      setLoadingList(false);
      setLoadingMore(false);
      return;
    }

    const payload = await response.json();
    const normalized = payload.bookmarks.map(normalizeBookmark);
    setBookmarks((prev) => (append ? [...prev, ...normalized] : normalized));
    setHasMore(Boolean(payload.hasMore));
    setTotalCount(payload.totalCount || normalized.length);
    if (!append) setSelectedIds([]);
    setLoadingList(false);
    setLoadingMore(false);
  }, [debouncedQuery, normalizeBookmark, pushToast, selectedFolderId, selectedTag, sort, view]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (view === 'today') return;
    loadBookmarks(1, false);
  }, [view, debouncedQuery, selectedFolderId, selectedTag, sort, loadBookmarks]);

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
    setInsightsState((prev) => ({
      ...prev,
      recentlySaved: [updated, ...prev.recentlySaved.filter((item) => item.id !== updated.id)].slice(0, 5)
    }));
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
    setInsightsState((prev) => ({
      ...prev,
      inbox: prev.inbox.filter((item) => item.id !== bookmark.id),
      staleFavorites: prev.staleFavorites.filter((item) => item.id !== bookmark.id)
    }));
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
    upsertBookmark(normalizeBookmark(payload.bookmark));
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
    const response = await fetch('/api/bookmarks/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, isDeleted: true })
    });

    if (!response.ok) {
      pushToast('Bulk delete failed', 'danger');
      return;
    }

    setBookmarks((prev) => prev.filter((bookmark) => !selectedIds.includes(bookmark.id)));
    setSelectedIds([]);
    setStatsState((prev) => ({
      ...prev,
      totalCount: Math.max(prev.totalCount - selectedIds.length, 0),
      trashCount: prev.trashCount + selectedIds.length
    }));
    pushToast('Selected bookmarks moved to trash', 'info');
  };

  const bulkFavorite = async () => {
    const response = await fetch('/api/bookmarks/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, isFavorite: true })
    });

    if (!response.ok) {
      pushToast('Bulk favorite failed', 'danger');
      return;
    }

    setBookmarks((prev) =>
      prev.map((bookmark) => (selectedIds.includes(bookmark.id) ? { ...bookmark, isFavorite: true } : bookmark))
    );
    setStatsState((prev) => ({
      ...prev,
      favoriteCount: prev.favoriteCount + selectedIds.filter((id) => !bookmarks.find((bookmark) => bookmark.id === id)?.isFavorite).length
    }));
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
    upsertBookmark(normalizeBookmark(payload.bookmark));
    pushToast('Bookmark moved', 'success');
  };

  const createCollection = async ({ name, description }: { name: string; description: string }) => {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, bookmarkIds: selectedIds })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      pushToast(payload?.error || 'Failed to create collection', 'danger');
      return;
    }

    setCollectionsState((prev) => [payload.collection, ...prev]);
    setSelectedIds([]);
    pushToast('Collection created', 'success');
  };

  const addSelectionToCollection = async (collectionId: string) => {
    const response = await fetch('/api/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId, bookmarkIds: selectedIds })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      pushToast(payload?.error || 'Failed to update collection', 'danger');
      return;
    }

    setCollectionsState((prev) => prev.map((item) => (item.id === collectionId ? payload.collection : item)));
    pushToast('Selection added to collection', 'success');
    setSelectedIds([]);
  };

  const toggleCollectionShare = async (collectionId: string, isPublic: boolean) => {
    const response = await fetch('/api/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId, isPublic })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      pushToast(payload?.error || 'Failed to update sharing', 'danger');
      return;
    }

    setCollectionsState((prev) => prev.map((item) => (item.id === collectionId ? payload.collection : item)));
    pushToast(isPublic ? 'Collection published' : 'Collection hidden', 'success');
  };

  const switchFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    if (view === 'today') setView('all');
  };

  const switchTag = (tag: string | null) => {
    setSelectedTag(tag);
    if (view === 'today') setView('all');
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
        onFolderSelect={switchFolder}
        onTagSelect={switchTag}
        onCreateFolder={createFolder}
        onDropBookmark={dropBookmarkToFolder}
        stats={statsState}
      />

      <div className="main-content-elite">
        <Topbar
          query={query}
          onQueryChange={setQuery}
          onAdd={() => setShowAddModal(true)}
          sort={sort}
          onSortChange={setSort}
          inputRef={searchInputRef}
          user={sessionUser}
        />

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
                <button type="button" className="btn-elite btn-elite-secondary" onClick={() => setShowImportModal(true)}>
                  Import More
                </button>
              </div>
              <button type="button" className="text-primary" onClick={() => setSelectedIds([])}>Clear</button>
            </div>
          ) : null}

          {view !== 'trash' && view !== 'today' ? (
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

          {view === 'today' ? (
            <>
              <TodayPanel
                insights={insightsState}
                onOpen={openBookmark}
                onAdd={() => setShowAddModal(true)}
                onImport={() => setShowImportModal(true)}
              />
              <CollectionsPanel
                collections={collectionsState}
                selectedCount={selectedIds.length}
                onCreateCollection={createCollection}
                onAddSelection={addSelectionToCollection}
                onToggleShare={toggleCollectionShare}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mt-2">
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  {loadingList
                    ? 'Refreshing results...'
                    : totalCount
                      ? `${totalCount} bookmark${totalCount === 1 ? '' : 's'} match this view.`
                      : 'No bookmarks match this view yet.'}
                </p>
                <button type="button" className="btn-elite btn-elite-secondary" onClick={() => setShowImportModal(true)}>
                  Import bookmarks
                </button>
              </div>

              <div className="mt-6">
                <BookmarkGrid
                  bookmarks={bookmarks}
                  selectedIds={selectedIds}
                  onSelect={selectBookmark}
                  onSelectAll={selectAllVisible}
                  onOpen={openBookmark}
                  onEdit={setEditBookmark}
                  onDelete={deleteOrRestoreBookmark}
                  onToggleFavorite={toggleFavorite}
                  hasMore={hasMore}
                  onLoadMore={() => loadBookmarks(Math.floor(bookmarks.length / 24) + 1, true)}
                  loadingMore={loadingMore}
                  onAddFirst={() => setShowAddModal(true)}
                  onImportFirst={() => setShowImportModal(true)}
                />
              </div>

              <CollectionsPanel
                collections={collectionsState}
                selectedCount={selectedIds.length}
                onCreateCollection={createCollection}
                onAddSelection={addSelectionToCollection}
                onToggleShare={toggleCollectionShare}
              />
            </>
          )}
        </div>
      </div>

      <AddBookmarkModal
        show={showAddModal}
        folders={foldersState}
        onClose={() => setShowAddModal(false)}
        onCreated={(bookmark) => {
          upsertBookmark(bookmark);
          setStatsState((prev) => ({ ...prev, totalCount: prev.totalCount + 1 }));
          setTotalCount((prev) => prev + 1);
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

      <ImportBookmarksModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          setView('all');
          loadBookmarks(1, false);
        }}
      />
    </div>
  );
}
