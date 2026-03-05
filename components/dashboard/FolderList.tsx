'use client';

type Folder = {
  id: string;
  name: string;
  color: string;
  _count?: {
    bookmarks: number;
  };
};

type FolderListProps = {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onDropBookmark: (bookmarkId: string, folderId: string) => void;
};

export function FolderList({ folders, selectedFolderId, onSelect, onDropBookmark }: FolderListProps) {
  return (
    <div className="flex-col gap-1">
      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className={`btn-elite w-full justify-between ${selectedFolderId === folder.id ? 'btn-elite-primary' : 'btn-elite-secondary'}`}
          style={{
            padding: '0.8rem 1.25rem',
            border: selectedFolderId === folder.id ? 'none' : '1px solid var(--border)',
            background: selectedFolderId === folder.id ? 'var(--accent)' : 'transparent',
            color: selectedFolderId === folder.id ? 'white' : 'var(--text-primary)'
          }}
          onClick={() => onSelect(folder.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const bookmarkId = event.dataTransfer.getData('bookmark-id');
            if (bookmarkId) onDropBookmark(bookmarkId, folder.id);
          }}
        >
          <div className="flex items-center gap-3">
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: folder.color || 'var(--accent-alt)',
              boxShadow: `0 0 8px ${folder.color || 'var(--accent-glow)'}`,
              flexShrink: 0
            }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{folder.name}</span>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            opacity: 0.6,
            background: selectedFolderId === folder.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-raised)',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {folder._count?.bookmarks || 0}
          </span>
        </button>
      ))}
    </div>
  );
}

