'use client';

import Image from 'next/image';
import { BookmarkView } from '@/types/bookmark';

type BookmarkCardProps = {
  bookmark: BookmarkView;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onOpen: (bookmark: BookmarkView) => void;
  onEdit: (bookmark: BookmarkView) => void;
  onDelete: (bookmark: BookmarkView) => void;
  onToggleFavorite: (bookmark: BookmarkView) => void;
};

export function BookmarkCard({
  bookmark,
  selected,
  onSelect,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite
}: BookmarkCardProps) {
  return (
    <article
      className="card-elite flex-col"
      draggable
      style={{ padding: '0', cursor: 'pointer', minHeight: '100%', maxWidth: '320px', width: '100%' }}
      onDragStart={(event) => {
        event.dataTransfer.setData('bookmark-id', bookmark.id);
      }}
      onClick={() => onOpen(bookmark)}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: bookmark.thumbnail ? '1.7/1' : '2.8/1',
        background: 'var(--bg-base)',
        borderBottom: '2px solid var(--border)',
        overflow: 'hidden'
      }}>
        {bookmark.thumbnail ? (
          <Image
            src={bookmark.thumbnail}
            alt={bookmark.title}
            fill
            unoptimized
            className="bookmark-thumb"
            style={{ objectFit: 'cover', transition: 'transform 0.8s var(--transition-smooth)' }}
            sizes="(max-width: 640px) 100vw, 320px"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full" style={{ background: 'linear-gradient(145deg, var(--bg-surface-raised), var(--bg-base))' }}>
            <div className="flex items-center justify-center" style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'white',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--border)',
              opacity: 0.95
            }}>
              {bookmark.favicon ? (
                <Image src={bookmark.favicon} alt="" width={24} height={24} unoptimized />
              ) : (
                <span style={{ fontSize: '1.2rem' }}>🔗</span>
              )}
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect(bookmark.id, event.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: 'var(--accent)',
              cursor: 'pointer',
              opacity: selected ? 1 : 0.5,
              transition: 'opacity 0.2s ease'
            }}
          />
        </div>

        <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 10 }}>
          <button
            type="button"
            className="btn-elite"
            style={{
              padding: '0.4rem',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              color: bookmark.isFavorite ? '#eab308' : 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(bookmark); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmark.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-col gap-2.5" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex items-center gap-2 mb-0.5">
          {bookmark.favicon ? (
            <Image src={bookmark.favicon} alt="favicon" width={14} height={14} unoptimized style={{ borderRadius: 3 }} />
          ) : (
            <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--accent)', opacity: 0.15 }}></div>
          )}
          <span className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {new URL(bookmark.url).hostname.replace('www.', '')}
          </span>
        </div>

        <div className="flex-col gap-1">
          <h3 style={{ fontSize: '1rem', fontWeight: 950, lineHeight: 1.3, color: 'var(--text-primary)', letterSpacing: '-0.015em' }} className="text-truncate">
            {bookmark.title}
          </h3>
          {bookmark.description && (
            <p className="text-secondary" style={{ fontSize: '0.8rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: 0.8 }}>
              {bookmark.description}
            </p>
          )}
          {bookmark.notes ? (
            <p className="text-primary" style={{ fontSize: '0.76rem', lineHeight: 1.5, fontWeight: 700, opacity: 0.85 }}>
              Why saved: {bookmark.notes}
            </p>
          ) : null}
        </div>

        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {bookmark.tags.slice(0, 2).map((tag) => (
              <span key={tag.tag.id} style={{
                fontSize: '0.6rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'var(--bg-surface-raised)',
                border: '2px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {tag.tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-3" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn-elite btn-elite-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem' }} onClick={() => onOpen(bookmark)}>
            Open Bookmark
          </button>
          <div className="flex gap-1.5">
            <button type="button" className="btn-elite btn-elite-secondary" style={{ padding: '0.6rem', borderRadius: '10px' }} onClick={() => onEdit(bookmark)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button
              type="button"
              className="btn-elite btn-elite-secondary"
              style={{ padding: '0.6rem', borderRadius: '10px', color: bookmark.isDeleted ? 'var(--accent)' : '#ef4444' }}
              onClick={() => onDelete(bookmark)}
            >
              {bookmark.isDeleted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

