'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BookmarkView, FolderView } from '@/types/bookmark';
import { useToast } from '@/components/ui/ToastProvider';

type EditBookmarkModalProps = {
  show: boolean;
  bookmark: BookmarkView | null;
  folders: FolderView[];
  onClose: () => void;
  onUpdated: (bookmark: BookmarkView) => void;
};

export function EditBookmarkModal({ show, bookmark, folders, onClose, onUpdated }: EditBookmarkModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [folderId, setFolderId] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    if (!bookmark) return;
    setTitle(bookmark.title);
    setDescription(bookmark.description || '');
    setNotes(bookmark.notes || '');
    setFolderId(bookmark.folderId || '');
    setTags(bookmark.tags.map((item) => item.tag.name).join(', '));
  }, [bookmark]);

  if (!show || !bookmark) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetch('/api/bookmarks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bookmark.id,
        title,
        description,
        notes,
        folderId: folderId || null,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      })
    });

    setSaving(false);

    if (!response.ok) {
      pushToast('Failed to update bookmark', 'danger');
      return;
    }

    const payload = await response.json();
    onUpdated({ ...payload.bookmark, createdAt: new Date(payload.bookmark.createdAt).toISOString() });
    pushToast('Bookmark updated', 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-custom card-elite" style={{ padding: '2.5rem' }}>
        <div className="flex items-center justify-between mb-8">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>Edit Asset</h2>
          <button className="btn-elite btn-elite-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={submit} className="flex-col gap-5">
          <div>
            <label className="form-label-elite">Asset Title</label>
            <input
              required
              type="text"
              className="input-elite"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div>
            <label className="form-label-elite">Brief Description</label>
            <textarea
              className="input-elite"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div>
            <label className="form-label-elite">Encapsulated Insights (Notes)</label>
            <textarea
              className="input-elite"
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label-elite">Target Folder</label>
              <select className="select-elite" value={folderId} onChange={(event) => setFolderId(event.target.value)}>
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label-elite">Tags (delimited by comma)</label>
              <input className="input-elite" value={tags} onChange={(event) => setTags(event.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button className="btn-elite btn-elite-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-elite btn-elite-primary" type="submit" disabled={saving}>
              {saving ? 'Synchronizing...' : 'Update Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

