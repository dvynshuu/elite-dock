'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { createNoteAction, updateNoteAction, deleteNoteAction } from '@/lib/actions/notes';

type Folder = {
  id: string;
  name: string;
  color: string;
};

type NoteView = {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  folderId: string | null;
  folder?: Folder | null;
  createdAt: string;
  updatedAt: string;
};

type NotesPanelProps = {
  initialNotes: NoteView[];
  folders: Folder[];
  onFolderSelect: (folderId: string | null) => void;
};

const NOTE_COLORS = [
  { name: 'default', label: 'Default', hex: 'var(--text-muted)' },
  { name: 'red', label: 'Ruby Red', hex: '#ef4444' },
  { name: 'orange', label: 'Coral Orange', hex: '#f97316' },
  { name: 'yellow', label: 'Amber Yellow', hex: '#eab308' },
  { name: 'green', label: 'Emerald Green', hex: '#10b981' },
  { name: 'teal', label: 'Mint Teal', hex: '#14b8a6' },
  { name: 'blue', label: 'Indigo Blue', hex: '#3b82f6' },
  { name: 'purple', label: 'Violet Purple', hex: '#8b5cf6' },
  { name: 'pink', label: 'Rose Pink', hex: '#ec7299' },
];

export function NotesPanel({ initialNotes, folders, onFolderSelect }: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteView[]>(initialNotes);
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeColorPickerNoteId, setActiveColorPickerNoteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<NoteView | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  // Click outside to collapse the input bar and save
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isExpanded) {
          handleSaveNote();
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, title, content, color, isPinned, selectedFolderId]);

  const handleSaveNote = async () => {
    if (!title.trim() && !content.trim()) {
      setIsExpanded(false);
      resetInput();
      return;
    }

    try {
      const payload = {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        color,
        isPinned,
        folderId: selectedFolderId,
      };

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const matchedFolder = folders.find(f => f.id === selectedFolderId);
      const newNote: NoteView = {
        id: tempId,
        ...payload,
        folder: matchedFolder ? { ...matchedFolder } : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setNotes(prev => [newNote, ...prev]);
      setIsExpanded(false);
      resetInput();

      const saved = await createNoteAction(payload);
      setNotes(prev => prev.map(n => n.id === tempId ? { ...saved, createdAt: saved.createdAt.toISOString(), updatedAt: saved.updatedAt.toISOString() } as any : n));
      pushToast('Note captured successfully', 'success');
    } catch (err) {
      pushToast('Failed to save note', 'danger');
    }
  };

  const resetInput = () => {
    setTitle('');
    setContent('');
    setColor('default');
    setIsPinned(false);
    setSelectedFolderId(null);
  };

  const handleTogglePin = async (note: NoteView) => {
    try {
      setNotes(prev =>
        prev.map(n => (n.id === note.id ? { ...n, isPinned: !n.isPinned } : n))
      );
      await updateNoteAction(note.id, { isPinned: !note.isPinned });
      pushToast(note.isPinned ? 'Note unpinned' : 'Note pinned to top', 'success');
    } catch {
      pushToast('Action failed', 'danger');
    }
  };

  const handleChangeNoteColor = async (noteId: string, newColor: string) => {
    try {
      setNotes(prev =>
        prev.map(n => (n.id === noteId ? { ...n, color: newColor } : n))
      );
      setActiveColorPickerNoteId(null);
      await updateNoteAction(noteId, { color: newColor });
    } catch {
      pushToast('Failed to update color', 'danger');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      await deleteNoteAction(noteId);
      pushToast('Note deleted', 'success');
    } catch {
      pushToast('Failed to delete note', 'danger');
    }
  };

  const handleUpdateEditingNote = async () => {
    if (!editingNote) return;

    try {
      const updated = await updateNoteAction(editingNote.id, {
        title: editingNote.title,
        content: editingNote.content,
        color: editingNote.color,
        folderId: editingNote.folderId,
      });

      setNotes(prev =>
        prev.map(n =>
          n.id === editingNote.id
            ? ({
                ...updated,
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
              } as any)
            : n
        )
      );
      setEditingNote(null);
      pushToast('Note updated', 'success');
    } catch {
      pushToast('Failed to update note', 'danger');
    }
  };

  // Helper to extract URLs from text
  const extractUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s$.?#].[^\s]*)/g;
    return text.match(urlRegex) || [];
  };

  // Render parsed link previews
  const renderLinkPreviews = (text: string) => {
    const urls = extractUrls(text);
    if (urls.length === 0) return null;

    return (
      <div className="flex flex-col gap-3 mt-4 pt-3.5" style={{ borderTop: '1px solid var(--border)' }}>
        {urls.slice(0, 3).map((url, i) => {
          let hostname = '';
          try {
            hostname = new URL(url).hostname.replace('www.', '');
          } catch {
            hostname = url;
          }
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center rounded-lg"
              style={{
                padding: '0.75rem 1rem',
                gap: '0.85rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.82rem',
                transition: 'all 0.2s ease',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <img
                src={`https://www.google.com/s2/favicons?sz=32&domain=${hostname}`}
                alt=""
                style={{ width: 18, height: 18, borderRadius: 3 }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-truncate" style={{ fontWeight: 600, flex: 1 }}>{hostname}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          );
        })}
      </div>
    );
  };

  const pinnedNotes = notes.filter(n => n.isPinned);
  const otherNotes = notes.filter(n => !n.isPinned);

  return (
    <div className="flex flex-col gap-8 w-full" style={{ paddingBottom: '3rem' }}>
      
      {/* 1. Google Keep Creator Bar */}
      <div className="flex justify-center w-full">
        <div
          ref={containerRef}
          className="card-elite flex-col"
          style={{
            maxWidth: '600px',
            width: '100%',
            padding: isExpanded ? '1.5rem' : '0.8rem 1.5rem',
            background: `var(--note-${color}-bg)`,
            borderColor: color === 'default' ? 'var(--border)' : `var(--note-${color}-border)`,
            boxShadow: color === 'default' ? 'var(--shadow-md)' : `0 8px 30px var(--note-${color}-glow)`,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {isExpanded ? (
            <div className="flex flex-col gap-3">
              {/* Title Section with Pin */}
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
                <button
                  type="button"
                  className="btn-elite"
                  style={{
                    padding: '0.4rem',
                    borderRadius: '50%',
                    background: isPinned ? 'var(--accent-glow)' : 'transparent',
                    borderColor: 'transparent',
                    boxShadow: 'none',
                    color: isPinned ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                  onClick={() => setIsPinned(!isPinned)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </button>
              </div>

              {/* Note Content */}
              <textarea
                placeholder="Take a note..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  width: '100%',
                  resize: 'none',
                  lineHeight: 1.6,
                }}
              />

              {/* Toolbar Actions */}
              <div className="flex items-center justify-between gap-4 mt-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  
                  {/* Folder Selector */}
                  <select
                    className="input-elite"
                    value={selectedFolderId || ''}
                    onChange={e => setSelectedFolderId(e.target.value || null)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      width: 'auto',
                      borderRadius: '8px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <option value="">📂 Link Folder...</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>

                  {/* Color Selector */}
                  <div className="dropdown" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn-elite"
                      style={{
                        padding: '0.4rem',
                        borderRadius: '50%',
                        background: 'transparent',
                        borderColor: 'transparent',
                        boxShadow: 'none',
                        color: 'var(--text-muted)',
                      }}
                      onClick={() => setActiveColorPickerNoteId(activeColorPickerNoteId === 'creator' ? null : 'creator')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                        <path d="M7.5 10.5C8.32843 10.5 9 9.82843 9 9C9 8.17157 8.32843 7.5 7.5 7.5C6.67157 7.5 6 8.17157 6 9C6 9.82843 6.67157 10.5 7.5 10.5Z" />
                        <path d="M11.5 7.5C12.3284 7.5 13 6.82843 13 6C13 5.17157 12.3284 4.5 11.5 4.5C10.6716 4.5 10 5.17157 10 6C10 6.82843 10.6716 7.5 11.5 7.5Z" />
                        <path d="M16.5 10.5C17.3284 10.5 18 9.82843 18 9C18 8.17157 17.3284 7.5 16.5 7.5C15.6716 7.5 15 8.17157 15 9C15 9.82843 15.6716 10.5 16.5 10.5Z" />
                        <path d="M6 14C6 14 7.5 17 12 17C16.5 17 18 14 18 14" />
                      </svg>
                    </button>

                    {activeColorPickerNoteId === 'creator' && (
                      <div
                        className="card-elite flex items-center gap-1.5"
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '0',
                          zIndex: 50,
                          padding: '0.4rem',
                          borderRadius: '8px',
                          display: 'flex',
                          boxShadow: 'var(--shadow-lg)',
                          border: '1px solid var(--border-strong)',
                          background: 'var(--bg-base)',
                        }}
                      >
                        {NOTE_COLORS.map(c => (
                          <button
                            key={c.name}
                            type="button"
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: `var(--note-${c.name}-bg)`,
                              border: color === c.name ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
                              cursor: 'pointer',
                            }}
                            title={c.label}
                            onClick={() => {
                              setColor(c.name);
                              setActiveColorPickerNoteId(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-elite btn-elite-secondary"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.78rem' }}
                    onClick={() => {
                      setIsExpanded(false);
                      resetInput();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-elite btn-elite-primary"
                    style={{ padding: '0.4rem 1.2rem', fontSize: '0.78rem' }}
                    onClick={handleSaveNote}
                  >
                    Capture
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between w-full"
              onClick={() => setIsExpanded(true)}
              style={{ cursor: 'text' }}
            >
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>Take a note...</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn-elite"
                  style={{ padding: '0.4rem', borderRadius: '50%', background: 'transparent', borderColor: 'transparent', boxShadow: 'none', color: 'var(--text-muted)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Masonry Deck Grid of Notes */}
      <div className="flex flex-col gap-8">
        
        {/* Pinned section */}
        {pinnedNotes.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-muted uppercase px-2" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>Pinned</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pinnedNotes.map(note => renderNoteCard(note))}
            </div>
          </div>
        )}

        {/* Regular section */}
        <div className="flex flex-col gap-3">
          {pinnedNotes.length > 0 && otherNotes.length > 0 && (
            <span className="text-muted uppercase px-2" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>Others</span>
          )}
          {otherNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherNotes.map(note => renderNoteCard(note))}
            </div>
          ) : pinnedNotes.length === 0 ? (
            <div className="card-muted text-center" style={{ padding: '3rem' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>💡</span>
              <h4 style={{ fontWeight: 850, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No notes captured yet</h4>
              <p className="text-secondary" style={{ maxWidth: '350px', margin: '0 auto', fontSize: '0.88rem' }}>
                Brainstorming ideas, hackathon details, or quick checklists? Add them here. Links will render visually.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* 3. Glassmorphic Edit Note Modal */}
      {editingNote && (
        <div
          className="modal-backdrop-custom flex items-center justify-center"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={() => handleUpdateEditingNote()}
        >
          <div
            className="card-elite flex-col"
            style={{
              maxWidth: '550px',
              width: '100%',
              background: `var(--note-${editingNote.color}-bg)`,
              borderColor: editingNote.color === 'default' ? 'var(--border)' : `var(--note-${editingNote.color}-border)`,
              boxShadow: `0 12px 40px var(--note-${editingNote.color}-glow)`,
              padding: '1.75rem',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={editingNote.title}
                onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              />
              <textarea
                value={editingNote.content}
                onChange={e => setEditingNote({ ...editingNote, content: e.target.value })}
                rows={6}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  width: '100%',
                  resize: 'none',
                  lineHeight: 1.6,
                }}
              />

              {/* Modal Link Previews */}
              {renderLinkPreviews(editingNote.content)}

              <div className="flex items-center justify-between gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  
                  {/* Folder link dropdown */}
                  <select
                    className="input-elite"
                    value={editingNote.folderId || ''}
                    onChange={e => setEditingNote({ ...editingNote, folderId: e.target.value || null })}
                    style={{
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.78rem',
                      width: 'auto',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <option value="">📂 Link Folder...</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>

                  {/* Modal Color Picker */}
                  <div className="dropdown" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn-elite"
                      style={{
                        padding: '0.4rem',
                        borderRadius: '50%',
                        background: 'transparent',
                        borderColor: 'transparent',
                        boxShadow: 'none',
                        color: 'var(--text-muted)',
                      }}
                      onClick={() => setActiveColorPickerNoteId(activeColorPickerNoteId === 'modal' ? null : 'modal')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                        <path d="M7.5 10.5C8.32843 10.5 9 9.82843 9 9C9 8.17157 8.32843 7.5 7.5 7.5C6.67157 7.5 6 8.17157 6 9C6 9.82843 6.67157 10.5 7.5 10.5Z" />
                        <path d="M11.5 7.5C12.3284 7.5 13 6.82843 13 6C13 5.17157 12.3284 4.5 11.5 4.5C10.6716 4.5 10 5.17157 10 6C10 6.82843 10.6716 7.5 11.5 7.5Z" />
                        <path d="M16.5 10.5C17.3284 10.5 18 9.82843 18 9C18 8.17157 17.3284 7.5 16.5 7.5C15.6716 7.5 15 8.17157 15 9C15 9.82843 15.6716 10.5 16.5 10.5Z" />
                        <path d="M6 14C6 14 7.5 17 12 17C16.5 17 18 14 18 14" />
                      </svg>
                    </button>

                    {activeColorPickerNoteId === 'modal' && (
                      <div
                        className="card-elite flex items-center gap-1.5"
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '0',
                          zIndex: 50,
                          padding: '0.4rem',
                          borderRadius: '8px',
                          display: 'flex',
                          boxShadow: 'var(--shadow-lg)',
                          border: '1px solid var(--border-strong)',
                          background: 'var(--bg-base)',
                        }}
                      >
                        {NOTE_COLORS.map(c => (
                          <button
                            key={c.name}
                            type="button"
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: `var(--note-${c.name}-bg)`,
                              border: editingNote.color === c.name ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
                              cursor: 'pointer',
                            }}
                            title={c.label}
                            onClick={() => {
                              setEditingNote({ ...editingNote, color: c.name });
                              setActiveColorPickerNoteId(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-elite btn-elite-secondary"
                    style={{ padding: '0.4rem 1.2rem', fontSize: '0.78rem' }}
                    onClick={() => setEditingNote(null)}
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    className="btn-elite btn-elite-primary"
                    style={{ padding: '0.4rem 1.4rem', fontSize: '0.78rem' }}
                    onClick={handleUpdateEditingNote}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Note Card
  function renderNoteCard(note: NoteView) {
    const isTemp = note.id.startsWith('temp-');
    return (
      <article
        key={note.id}
        className="card-elite note-card-elite flex-col"
        onClick={() => !isTemp && setEditingNote(note)}
        style={{
          padding: '1.25rem',
          minHeight: '180px',
          cursor: isTemp ? 'default' : 'pointer',
          background: `var(--note-${note.color}-bg)`,
          borderColor: note.color === 'default' ? 'var(--border)' : `var(--note-${note.color}-border)`,
          boxShadow: note.color === 'default' ? 'var(--shadow-sm)' : `0 4px 15px var(--note-${note.color}-glow)`,
          display: 'flex',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
          opacity: isTemp ? 0.6 : 1,
        }}
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-4">
            <h4 style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
               {note.title}
            </h4>
            
            {!isTemp && (
              <button
                type="button"
                className={`btn-elite text-muted pin-btn ${note.isPinned ? 'is-pinned' : ''}`}
                style={{
                  padding: '0.2rem',
                  borderRadius: '50%',
                  background: 'transparent',
                  borderColor: 'transparent',
                  boxShadow: 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePin(note);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={note.isPinned ? 'var(--accent)' : 'none'} stroke={note.isPinned ? 'var(--accent)' : 'currentColor'} strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </button>
            )}
          </div>

          <p
            className="text-secondary"
            style={{
              fontSize: '0.86rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 8,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {note.content}
          </p>

          {/* Render Parsed Link Cards */}
          {renderLinkPreviews(note.content)}
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {note.folder ? (
              <button
                type="button"
                className="btn-elite text-primary"
                onClick={() => onFolderSelect(note.folderId)}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-strong)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  boxShadow: 'none',
                }}
              >
                📂 {note.folder.name}
              </button>
            ) : null}
          </div>

          {!isTemp && (
            <div className="flex items-center gap-1">
              
              {/* Color Grid Selector */}
              <div className="dropdown" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn-elite text-muted"
                  style={{ padding: '0.3rem', borderRadius: '50%', background: 'transparent', borderColor: 'transparent', boxShadow: 'none' }}
                  onClick={() => setActiveColorPickerNoteId(activeColorPickerNoteId === note.id ? null : note.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                </button>

                {activeColorPickerNoteId === note.id && (
                  <div
                    className="card-elite flex items-center gap-1"
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: '0',
                      zIndex: 50,
                      padding: '0.3rem',
                      borderRadius: '8px',
                      display: 'flex',
                      boxShadow: 'var(--shadow-md)',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-base)',
                    }}
                  >
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: `var(--note-${c.name}-bg)`,
                          border: note.color === c.name ? '1.5px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                        }}
                        title={c.label}
                        onClick={() => handleChangeNoteColor(note.id, c.name)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Icon */}
              <button
                type="button"
                className="btn-elite text-muted"
                style={{ padding: '0.3rem', borderRadius: '50%', background: 'transparent', borderColor: 'transparent', boxShadow: 'none' }}
                onClick={() => handleDeleteNote(note.id)}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }
}
