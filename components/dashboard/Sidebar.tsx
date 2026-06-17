import { useState, type KeyboardEvent } from 'react';
import { FolderList } from '@/components/dashboard/FolderList';
import { TagList } from '@/components/dashboard/TagList';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
  view: 'all' | 'favorites' | 'trash' | 'today' | 'notes';
  onViewChange: (view: 'all' | 'favorites' | 'trash' | 'today' | 'notes') => void;
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

      {/* Scrollable Navigation Sections */}
      <div className="sidebar-scrollable-content" style={{ flex: 1, overflowY: 'auto', marginRight: '-0.75rem', paddingRight: '0.75rem', display: 'flex', flexDirection: 'column', paddingBottom: '1.5rem' }}>
        <div className="flex-col gap-1 mb-8">
          <p className="text-muted uppercase mb-4 px-2" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>Library</p>
          <button
            type="button"
            className={`btn-elite w-full justify-between ${view === 'today' ? 'btn-elite-primary' : 'btn-elite-ghost'}`}
            style={{ padding: '0.7rem 1rem' }}
            onClick={() => onViewChange('today')}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span style={{ fontWeight: 700 }}>Today</span>
            </div>
          </button>
          <button
            type="button"
            className={`btn-elite w-full justify-between ${view === 'all' ? 'btn-elite-primary' : 'btn-elite-ghost'}`}
            style={{ padding: '0.7rem 1rem' }}
            onClick={() => onViewChange('all')}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10M6 10h10" />
              </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontWeight: 700 }}>Favorites</span>
            </div>
            <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{stats.favoriteCount}</span>
          </button>
          <button
            type="button"
            className={`btn-elite w-full justify-between ${view === 'notes' ? 'btn-elite-primary' : 'btn-elite-ghost'}`}
            style={{ padding: '0.7rem 1rem' }}
            onClick={() => onViewChange('notes')}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
              <span style={{ fontWeight: 700 }}>Keep Deck</span>
            </div>
          </button>
          <button
            type="button"
            className={`btn-elite w-full justify-between ${view === 'trash' ? 'btn-elite-primary' : 'btn-elite-ghost'}`}
            style={{ padding: '0.7rem 1rem' }}
            onClick={() => onViewChange('trash')}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span style={{ fontWeight: 700 }}>Trash</span>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon" style={{ marginRight: '0.75rem', opacity: 0.7 }}>
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
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

        <div className="flex-col px-2 mb-8">
          <h3 className="text-muted uppercase mb-4" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>Taxonomy</h3>
          <TagList tags={tags} selectedTag={selectedTag} onSelect={onTagSelect} />
        </div>
      </div>

      {/* Fixed Sidebar Footer with Theme Toggle */}
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', paddingBottom: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '1rem' }}>
        <div className="flex-col" style={{ gap: '0.15rem' }}>
          <span className="text-muted uppercase" style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.05em', lineHeight: '1.3' }}>Visual mode</span>
          <p style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-secondary)', margin: 0, lineHeight: '1.3' }}>Interface Theme</p>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

