'use client';

import { FormEvent, useState } from 'react';
import { CollectionView } from '@/types/bookmark';

type CollectionsPanelProps = {
  collections: CollectionView[];
  selectedCount: number;
  onCreateCollection: (payload: { name: string; description: string }) => Promise<void>;
  onAddSelection: (collectionId: string) => Promise<void>;
  onToggleShare: (collectionId: string, isPublic: boolean) => Promise<void>;
};

export function CollectionsPanel({
  collections,
  selectedCount,
  onCreateCollection,
  onAddSelection,
  onToggleShare
}: CollectionsPanelProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await onCreateCollection({ name: name.trim(), description: description.trim() });
    setSaving(false);
    setName('');
    setDescription('');
  };

  return (
    <section className="card-elite flex-col gap-5" style={{ padding: '1.75rem' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted uppercase mb-2" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
            Growth surface
          </p>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 850 }}>Shareable collections</h3>
          <p className="text-secondary" style={{ marginTop: '0.35rem', lineHeight: 1.5 }}>
            Turn great research into public boards people can discover, revisit, and import.
          </p>
        </div>
        <span className="pill-count">{collections.length}</span>
      </div>

      <form onSubmit={submit} className="flex-col gap-3">
        <input
          className="input-elite"
          placeholder="Collection name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <textarea
          className="input-elite"
          style={{ minHeight: '90px' }}
          placeholder="What makes this collection useful?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            {selectedCount ? `${selectedCount} selected bookmark${selectedCount === 1 ? '' : 's'} can be added right away.` : 'Select bookmarks to add them to a board.'}
          </span>
          <button type="submit" className="btn-elite btn-elite-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create collection'}
          </button>
        </div>
      </form>

      <div className="flex-col gap-3">
        {collections.length ? (
          collections.map((collection) => (
            <div key={collection.id} className="collection-row">
              <div className="flex-col" style={{ flex: 1 }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontWeight: 800 }}>{collection.name}</span>
                  <span className="pill-count">{collection._count?.bookmarks || 0}</span>
                  {collection.isPublic ? <span className="pill-public">Public</span> : null}
                </div>
                {collection.description ? (
                  <p className="text-secondary" style={{ marginTop: '0.35rem', lineHeight: 1.5 }}>{collection.description}</p>
                ) : null}
                {collection.isPublic && collection.publicSlug ? (
                  <a
                    href={`/share/${collection.publicSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                    style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 700 }}
                  >
                    Open public board
                  </a>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-elite btn-elite-secondary"
                  onClick={() => onAddSelection(collection.id)}
                  disabled={!selectedCount}
                >
                  Add selection
                </button>
                <button
                  type="button"
                  className={`btn-elite ${collection.isPublic ? 'btn-elite-secondary' : 'btn-elite-primary'}`}
                  onClick={() => onToggleShare(collection.id, !collection.isPublic)}
                >
                  {collection.isPublic ? 'Make private' : 'Publish'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card-muted">Create your first collection to turn saved knowledge into something shareable.</div>
        )}
      </div>
    </section>
  );
}
