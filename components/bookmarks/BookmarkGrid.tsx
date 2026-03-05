'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookmarkView } from '@/types/bookmark';
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard';
import { EmptyState } from '@/components/bookmarks/EmptyState';

type BookmarkGridProps = {
  bookmarks: BookmarkView[];
  selectedIds: string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (ids: string[]) => void;
  onOpen: (bookmark: BookmarkView) => void;
  onEdit: (bookmark: BookmarkView) => void;
  onDelete: (bookmark: BookmarkView) => void;
  onToggleFavorite: (bookmark: BookmarkView) => void;
};

export function BookmarkGrid({
  bookmarks,
  selectedIds,
  onSelect,
  onSelectAll,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite
}: BookmarkGridProps) {
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [bookmarks]);

  const visibleBookmarks = useMemo(() => bookmarks.slice(0, visibleCount), [bookmarks, visibleCount]);

  if (!bookmarks.length) {
    return <EmptyState />;
  }

  return (
    <div className="flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-elite btn-elite-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => onSelectAll(visibleBookmarks.map((bookmark) => bookmark.id))}
          >
            {selectedIds.length ? 'Clear Selection' : 'Select Visible'}
          </button>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedIds.length} items selected</span>
        </div>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Showing {bookmarks.length} assets</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-start">
        {visibleBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            selected={selectedIds.includes(bookmark.id)}
            onSelect={onSelect}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {visibleCount < bookmarks.length ? (
        <div className="flex justify-center mt-8">
          <button type="button" className="btn-elite btn-elite-secondary" onClick={() => setVisibleCount((prev) => prev + 12)}>
            Load More Assets
          </button>
        </div>
      ) : null}
    </div>
  );
}

