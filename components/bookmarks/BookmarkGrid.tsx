'use client';

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
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onAddFirst?: () => void;
  onImportFirst?: () => void;
};

export function BookmarkGrid({
  bookmarks,
  selectedIds,
  onSelect,
  onSelectAll,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  hasMore,
  onLoadMore,
  loadingMore,
  onAddFirst,
  onImportFirst
}: BookmarkGridProps) {
  if (!bookmarks.length) {
    return (
      <EmptyState
        primaryActionLabel={onAddFirst ? 'Save first bookmark' : undefined}
        secondaryActionLabel={onImportFirst ? 'Import bookmarks' : undefined}
        onPrimaryAction={onAddFirst}
        onSecondaryAction={onImportFirst}
      />
    );
  }

  return (
    <div className="flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-elite btn-elite-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => onSelectAll(bookmarks.map((bookmark) => bookmark.id))}
          >
            {selectedIds.length ? 'Clear Selection' : 'Select Visible'}
          </button>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedIds.length} items selected</span>
        </div>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Showing {bookmarks.length} assets</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-start">
        {bookmarks.map((bookmark) => (
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

      {hasMore && onLoadMore ? (
        <div className="flex justify-center mt-8">
          <button type="button" className="btn-elite btn-elite-secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load More Assets'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

