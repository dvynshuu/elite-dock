import { getAuthSession } from '@/lib/auth';
import { listCollections } from '@/lib/database/bookmarks';

export default async function SettingsPage() {
  const session = await getAuthSession();
  const collections = session?.user?.id ? await listCollections(session.user.id) : [];

  return (
    <main className="container py-4">
      <h1 className="h3 mb-4">Workspace</h1>

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5">Profile</h2>
          <p className="mb-1"><strong>Name:</strong> {session?.user?.name || 'Anonymous'}</p>
          <p className="mb-0"><strong>Email:</strong> {session?.user?.email || 'Not provided'}</p>
        </div>
      </section>

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5">Activation checklist</h2>
          <p className="text-secondary mb-0">
            Start by importing your existing bookmarks, then add a short “why this matters” note whenever you save something new. That note powers the Today view and makes resurfacing useful instead of random.
          </p>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5">Shareable collections</h2>
          <p className="text-secondary mb-3">
            You currently have <strong>{collections.length}</strong> collections. Publish the best ones from the dashboard to create public knowledge boards that other people can browse and learn from.
          </p>
          <p className="text-secondary mb-0">
            Import is available directly from the dashboard, and public boards now live under `/share/[slug]` once a collection is published.
          </p>
        </div>
      </section>
    </main>
  );
}
