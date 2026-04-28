import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicCollectionBySlug } from '@/lib/database/bookmarks';

export default async function SharedCollectionPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const collection = await getPublicCollectionBySlug(params.slug);

  if (!collection) {
    notFound();
  }

  const board = collection;

  return (
    <main className="share-page-shell">
      <section className="card-elite share-hero">
        <p className="text-muted uppercase mb-2" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
          Shared knowledge board
        </p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900 }}>{board.name}</h1>
        {board.description ? (
          <p className="text-secondary" style={{ marginTop: '0.75rem', maxWidth: 760, lineHeight: 1.7 }}>
            {board.description}
          </p>
        ) : null}
        <div className="flex items-center gap-3 mt-6">
          <span className="pill-count">{board.bookmarks.length} links</span>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            Curated by {board.user.name || 'Anonymous'}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {board.bookmarks.map((item) => (
          <article key={item.bookmarkId} className="card-elite flex-col gap-3" style={{ padding: '1.5rem' }}>
            <div className="flex-col gap-2">
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.bookmark.siteName || new URL(item.bookmark.url).hostname.replace('www.', '')}
              </span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 850 }}>{item.bookmark.title}</h2>
            </div>
            {item.bookmark.description ? (
              <p className="text-secondary" style={{ lineHeight: 1.6 }}>{item.bookmark.description}</p>
            ) : null}
            {item.bookmark.notes ? (
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                Why it matters: {item.bookmark.notes}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 mt-2">
              <a href={item.bookmark.url} target="_blank" rel="noreferrer" className="btn-elite btn-elite-primary">
                Open link
              </a>
              <Link href="/login" className="btn-elite btn-elite-secondary">
                Save your own
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
