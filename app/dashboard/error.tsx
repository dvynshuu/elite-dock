'use client';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container py-5">
      <div className="alert alert-danger">
        <h2 className="h5 mb-2">Dashboard failed to load</h2>
        <p className="mb-3">{error.message}</p>
        <button type="button" className="btn btn-danger" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
