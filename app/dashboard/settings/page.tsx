import { getAuthSession } from '@/lib/auth';

export default async function SettingsPage() {
  const session = await getAuthSession();

  return (
    <main className="container py-4">
      <h1 className="h3 mb-4">Settings</h1>

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5">Profile</h2>
          <p className="mb-1"><strong>Name:</strong> {session?.user?.name || 'Anonymous'}</p>
          <p className="mb-0"><strong>Email:</strong> {session?.user?.email || 'Not provided'}</p>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5">Data</h2>
          <p className="text-secondary mb-0">
            Browser import and full export APIs are available via `/api/bookmarks/import` and can be connected to a
            UI workflow in the next iteration.
          </p>
        </div>
      </section>
    </main>
  );
}
