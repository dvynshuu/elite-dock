'use client';

type Tag = {
  id: string;
  name: string;
  _count?: {
    bookmarks: number;
  };
};

type TagListProps = {
  tags: Tag[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
};

export function TagList({ tags, selectedTag, onSelect }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onSelect(selectedTag === tag.name ? null : tag.name)}
          className={`btn-elite`}
          style={{
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            borderRadius: '8px',
            background: selectedTag === tag.name ? 'var(--accent-soft)' : 'var(--bg-surface-raised)',
            color: selectedTag === tag.name ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: `2px solid ${selectedTag === tag.name ? 'var(--accent-alt)' : 'var(--border)'}`,
            boxShadow: selectedTag === tag.name ? '0 0 10px var(--accent-glow)' : 'none',
            letterSpacing: '0.01em',
            textTransform: 'uppercase'
          }}
        >
          {tag.name}
          <span style={{ opacity: 0.5, marginLeft: '6px' }}>{tag._count?.bookmarks || 0}</span>
        </button>
      ))}
    </div>
  );
}
