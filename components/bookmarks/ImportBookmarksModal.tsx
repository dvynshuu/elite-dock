'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

type ImportBookmarksModalProps = {
  show: boolean;
  onClose: () => void;
  onImported: () => void;
};

function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.includes('|') ? line.split('|') : [line, line];
      return {
        title: title.trim(),
        url: url.trim()
      };
    });
}

export function ImportBookmarksModal({ show, onClose, onImported }: ImportBookmarksModalProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  const rows = useMemo(() => parseLines(value), [value]);

  if (!show) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rows.length) {
      pushToast('Paste at least one URL to import', 'danger');
      return;
    }

    setSaving(true);
    const response = await fetch('/api/bookmarks/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: rows })
    });
    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      pushToast(payload?.error || 'Import failed', 'danger');
      return;
    }

    setValue('');
    onImported();
    pushToast('Bookmarks imported', 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop-custom" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-dialog-custom card-elite" style={{ padding: '2.25rem', maxWidth: '720px' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-muted uppercase mb-2" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
              Import to get started
            </p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Bring your existing links in</h2>
          </div>
          <button className="btn-elite btn-elite-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={submit} className="flex-col gap-5">
          <p className="text-secondary" style={{ lineHeight: 1.6 }}>
            Paste one item per line. Use `title | https://example.com` or just a URL and the app will use it as the title until metadata fills in.
          </p>

          <textarea
            className="input-elite"
            style={{ minHeight: '280px', resize: 'vertical' }}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={'Design systems | https://example.com/design\nhttps://example.com/research'}
          />

          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              {rows.length} item{rows.length === 1 ? '' : 's'} ready
            </span>
            <button type="submit" className="btn-elite btn-elite-primary" disabled={saving}>
              {saving ? 'Importing...' : 'Import Bookmarks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
