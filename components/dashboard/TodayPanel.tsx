'use client';

import { BookmarkView } from '@/types/bookmark';

type TodayPanelProps = {
  insights: {
    inbox: BookmarkView[];
    staleFavorites: BookmarkView[];
    recentlySaved: BookmarkView[];
  };
  onOpen: (bookmark: BookmarkView) => void;
  onAdd: () => void;
  onImport: () => void;
};

type SectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: BookmarkView[];
  emptyLabel: string;
  onOpen: (bookmark: BookmarkView) => void;
};

function TodaySection({ eyebrow, title, description, items, emptyLabel, onOpen }: SectionProps) {
  return (
    <section className="card-elite flex-col gap-4" style={{ padding: '1.75rem' }}>
      <div className="flex-col gap-2">
        <p className="text-muted uppercase" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
          {eyebrow}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 850 }}>{title}</h3>
            <p className="text-secondary" style={{ marginTop: '0.35rem', lineHeight: 1.5 }}>{description}</p>
          </div>
          <span className="pill-count">{items.length}</span>
        </div>
      </div>

      {items.length ? (
        <div className="flex-col gap-3">
          {items.map((bookmark) => (
            <button
              key={bookmark.id}
              type="button"
              className="btn-elite btn-elite-secondary today-row"
              onClick={() => onOpen(bookmark)}
            >
              <div className="flex-col items-start" style={{ flex: 1 }}>
                <span style={{ fontWeight: 750 }}>{bookmark.title}</span>
                <span className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                  {bookmark.siteName || new URL(bookmark.url).hostname.replace('www.', '')}
                </span>
                {bookmark.notes ? (
                  <span className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    {bookmark.notes}
                  </span>
                ) : null}
              </div>
              <span className="text-primary" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Open
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card-muted">{emptyLabel}</div>
      )}
    </section>
  );
}

export function TodayPanel({ insights, onOpen, onAdd, onImport }: TodayPanelProps) {
  return (
    <div className="flex-col gap-6">
      <section className="card-elite flex-col gap-5" style={{ padding: '2rem' }}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex-col gap-2">
            <p className="text-muted uppercase" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
              Daily recall
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Today</h2>
            <p className="text-secondary" style={{ maxWidth: 640, lineHeight: 1.6 }}>
              The goal is not to collect more links. It is to reuse what you already saved, at the right moment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-elite btn-elite-secondary" onClick={onImport}>
              Import existing links
            </button>
            <button type="button" className="btn-elite btn-elite-primary" onClick={onAdd}>
              Save new bookmark
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TodaySection
          eyebrow="Start here"
          title="Unopened bookmarks"
          description="Fresh saves you have not revisited yet."
          items={insights.inbox}
          emptyLabel="You are keeping up. New saves appear here until you open them."
          onOpen={onOpen}
        />
        <TodaySection
          eyebrow="Bring back"
          title="Stale favorites"
          description="High-signal links worth resurfacing before they disappear into the archive."
          items={insights.staleFavorites}
          emptyLabel="Nothing stale right now. Your favorites are getting revisited."
          onOpen={onOpen}
        />
        <TodaySection
          eyebrow="Recent context"
          title="Recently saved"
          description="Quick access to the latest things you decided mattered."
          items={insights.recentlySaved}
          emptyLabel="Save a few links and this queue will start shaping itself."
          onOpen={onOpen}
        />
      </div>
    </div>
  );
}
