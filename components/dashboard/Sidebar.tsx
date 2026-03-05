import { useState, type KeyboardEvent } from 'react';
import { FolderList } from '@/components/dashboard/FolderList';
import { TagList } from '@/components/dashboard/TagList';

type Folder = {
  id: string;
  name: string;
  color: string;
  _count?: {
    bookmarks: number;
  };
};

type Tag = {
  id: string;
  name: string;
  _count?: {
    bookmarks: number;
  };
};

type SidebarProps = {
  view: 'all' | 'favorites' | 'trash';
  onViewChange: (view: 'all' | 'favorites' | 'trash') => void;
  folders: Folder[];
  tags: Tag[];
  selectedFolderId: string | null;
  selectedTag: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onTagSelect: (tag: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDropBookmark: (bookmarkId: string, folderId: string) => void;
  stats: {
    totalCount: number;
    favoriteCount: number;
    trashCount: number;
  };
};

export function Sidebar({
  view,
  onViewChange,
  folders,
  tags,
  selectedFolderId,
  selectedTag,
  onFolderSelect,
  onTagSelect,
  onCreateFolder,
  onDropBookmark,
  stats
}: SidebarProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreateFolder();
    if (e.key === 'Escape') {
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  };

  return (
    <aside className="sidebar-elite">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div style={{ width: 14, height: 14, borderRadius: '4px', background: 'var(--accent)', transform: 'rotate(45deg)', boxShadow: '0 0 12px var(--accent-glow)' }}></div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>ELITE DOCK</h2>
      </div>

      <div className="flex-col gap-1 mb-10">
        <p className="text-muted uppercase mb-4 px-2" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>Library</p>
        <button
          type="button"
          className={`btn-elite w-full justify-between ${view === 'all' ? 'btn-elite-primary' : 'btn-elite-ghost'}`}
          style={{ padding: '0.7rem 1rem' }}
          onClick={() => onViewChange('all')}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.1rem' }}>📚</span>
            <span style={{ fontWeight: 700 }}>Universal</span>
          </div>
          <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{stats.totalCount}</span>
        </button>
        <button
          type="button"
          className={`btn-elite w-full justify-between ${view === 'favorites' ? 'btn-elite-primary' : 'btn-elite-ghost'}`}
          style={{ padding: '0.7rem 1rem' }}
          onClick={() => onViewChange('favorites')}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.1rem' }}>⭐</span>
            <span style={{ fontWeight: 700 }}>Favorites</span>
          </div>
          <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{stats.favoriteCount}</span>
        </button>
        <button
          type="button"
          className={`btn-elite w-full justify-between ${view === 'trash' ? 'btn-elite-primary' : 'btn-elite-ghost'}`}
          style={{ padding: '0.7rem 1rem' }}
          onClick={() => onViewChange('trash')}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.1rem' }}>📦</span>
            <span style={{ fontWeight: 700 }}>Archive</span>
          </div>
          <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{stats.trashCount}</span>
        </button>
      </div>

      <div className="flex-col mb-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-muted uppercase" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>Folders</h3>
          <button
            type="button"
            className="btn-elite btn-elite-ghost"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 900 }}
            onClick={() => setIsCreatingFolder(true)}
          >
            + New
          </button>
        </div>

        {isCreatingFolder && (
          <div className="mb-4 px-2">
            <input
              autoFocus
              className="input-elite"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              placeholder="Identifier..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newFolderName.trim()) setIsCreatingFolder(false);
              }}
            />
          </div>
        )}

        <div className="flex-col gap-1">
          <button
            type="button"
            className={`btn-elite btn-elite-ghost w-full ${selectedFolderId === null ? 'active' : ''}`}
            style={{ fontSize: '0.9rem', justifyContent: 'flex-start', padding: '0.6rem 1rem', background: selectedFolderId === null ? 'var(--accent-glow)' : 'transparent', color: selectedFolderId === null ? 'var(--accent)' : 'inherit' }}
            onClick={() => onFolderSelect(null)}
          >
            <span style={{ marginRight: '0.75rem', opacity: 0.7 }}>📂</span>
            <span style={{ fontWeight: selectedFolderId === null ? 800 : 500 }}>Global View</span>
          </button>
          <FolderList
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={onFolderSelect}
            onDropBookmark={onDropBookmark}
          />
        </div>
      </div>

      <div className="flex-col px-2">
        <h3 className="text-muted uppercase mb-4" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>Taxonomy</h3>
        <TagList tags={tags} selectedTag={selectedTag} onSelect={onTagSelect} />
      </div>
    </aside>
  );
}

