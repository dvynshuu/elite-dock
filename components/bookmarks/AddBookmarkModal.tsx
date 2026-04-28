'use client';

import { FormEvent, useMemo, useState } from 'react';
import { FolderView } from '@/types/bookmark';
import { useToast } from '@/components/ui/ToastProvider';

type AddBookmarkModalProps = {
  show: boolean;
  folders: FolderView[];
  onClose: () => void;
  onCreated: (bookmark: any) => void;
};

type FormState = {
  url: string;
  title: string;
  description: string;
  notes: string;
  tags: string;
  folderId: string;
  favicon: string;
  thumbnail: string;
  siteName: string;
};

const initialState: FormState = {
  url: '',
  title: '',
  description: '',
  notes: '',
  tags: '',
  folderId: '',
  favicon: '',
  thumbnail: '',
  siteName: ''
};

export function AddBookmarkModal({ show, folders, onClose, onCreated }: AddBookmarkModalProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { pushToast } = useToast();

  const aiTagHint = useMemo(() => {
    if (!form.title) return [];
    return form.title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 3);
  }, [form.title]);

  if (!show) return null;

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchMeta = async () => {
    if (!form.url.trim()) return;

    try {
      setStep(2);
      setLoadingMeta(true);
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.url })
      });

      if (!response.ok) throw new Error('Metadata failed');

      const data = await response.json();
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title || '',
        description: data.description || prev.description || '',
        favicon: data.favicon || prev.favicon,
        thumbnail: data.thumbnail || prev.thumbnail,
        siteName: data.siteName || prev.siteName,
        tags: prev.tags || aiTagHint.join(',')
      }));
      setStep(3);
    } catch {
      pushToast('Could not fetch metadata', 'danger');
      setStep(1);
    } finally {
      setLoadingMeta(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        folderId: form.folderId || undefined,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      })
    });

    setSaving(false);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      pushToast(errorData.error || 'Failed to create bookmark', 'danger');
      return;
    }

    const payload = await response.json();
    onCreated({
      ...payload.bookmark,
      createdAt: new Date(payload.bookmark.createdAt).toISOString()
    });
    pushToast('Bookmark added', 'success');
    setForm(initialState);
    setStep(1);
    onClose();
  };

  return (
    <div className="modal-backdrop-custom" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog-custom card-elite" style={{ padding: '2.5rem', maxWidth: step === 3 ? '720px' : '540px' }}>

        <div className="flex items-center justify-between mb-8">
          <div className="flex-col">
            <span className="text-muted uppercase" style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em' }}>Ritual Phase {step}/3</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {step === 1 && "Save a bookmark"}
              {step === 2 && "Fetching page details"}
              {step === 3 && "Why it matters"}
            </h2>
          </div>
          <button className="btn-elite btn-elite-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }} type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="flex-col gap-6 animate-fadeIn">
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>Paste a link and we will pull in the title, summary, and site details for you.</p>
            <div className="form-group-elite">
              <label className="form-label-elite">Bookmark URL</label>
              <input
                required
                autoFocus
                type="url"
                className="input-elite"
                style={{ height: '56px', fontSize: '1.1rem' }}
                value={form.url}
                onChange={(event) => setField('url', event.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMeta()}
                placeholder="https://example.com/article"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-elite btn-elite-primary" style={{ padding: '1rem 2.5rem' }} onClick={fetchMeta}>
                Fetch details
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-col items-center justify-center py-10 gap-6 animate-pulse">
            <div style={{ fontSize: '3rem' }}>📡</div>
            <p style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>Looking up the page and pulling useful context...</p>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={submit} className="flex-col gap-6 animate-slideUp">
            <div className="grid grid-cols-3 gap-6">
              <div className="form-group-elite" style={{ gridColumn: 'span 2' }}>
                <label className="form-label-elite">Title</label>
                <input
                  required
                  type="text"
                  className="input-elite"
                  value={form.title}
                  onChange={(event) => setField('title', event.target.value)}
                />
              </div>
              <div className="form-group-elite">
                <label className="form-label-elite">Folder</label>
                <select
                  className="select-elite"
                  value={form.folderId}
                  onChange={(event) => setField('folderId', event.target.value)}
                >
                  <option value="">Ungrouped</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group-elite">
              <label className="form-label-elite">Description</label>
              <textarea
                className="input-elite"
                style={{ minHeight: '80px' }}
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="form-group-elite">
                <label className="form-label-elite">Tags</label>
                <input
                  type="text"
                  className="input-elite"
                  value={form.tags}
                  onChange={(event) => setField('tags', event.target.value)}
                />
              </div>
              <div className="form-group-elite">
                <label className="form-label-elite">Why did you save this?</label>
                <textarea
                  className="input-elite"
                  style={{ minHeight: '80px' }}
                  value={form.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-elite btn-elite-secondary" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn-elite btn-elite-primary" type="submit" disabled={saving} style={{ minWidth: '180px' }}>
                {saving ? 'Saving...' : 'Save Bookmark'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

