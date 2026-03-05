export function EmptyState() {
  return (
    <div className="card-elite flex-col items-center justify-center text-center" style={{ padding: '6rem 2rem', gap: '1.5rem', background: 'var(--bg-glass)', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-strong)' }}>
      <div style={{
        width: 84,
        height: 84,
        borderRadius: '24px',
        background: 'var(--bg-glass)',
        border: '3px solid var(--accent-soft)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--accent)',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow-md)',
        backdropFilter: 'blur(10px)'
      }}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      </div>
      <div>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Your knowledge hub is empty</h3>
        <p className="text-secondary" style={{ maxWidth: 420, fontSize: '1rem', lineHeight: 1.6 }}>
          Begin curating your digital legacy by adding your first asset. Every great repository starts with a single insight.
        </p>
      </div>
    </div>
  );
}
