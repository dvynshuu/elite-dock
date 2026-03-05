'use client';

import { useState, type RefObject } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { SearchBar } from '@/components/dashboard/SearchBar';

type TopbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onAdd: () => void;
  inputRef?: RefObject<HTMLInputElement>;
  user: {
    name: string;
    email: string;
  };
};

export function Topbar({ query, onQueryChange, onAdd, inputRef, user }: TopbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="flex items-center justify-between gap-10 mb-10 py-2">
      <div style={{ flex: 1, maxWidth: 800 }}>
        <SearchBar value={query} onChange={onQueryChange} inputRef={inputRef} />
      </div>

      <div className="flex items-center gap-6">
        <button type="button" className="btn-elite btn-elite-primary" style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }} onClick={onAdd}>
          <span>Add Asset</span>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="btn-elite btn-elite-secondary"
            type="button"
            style={{ padding: '0.6rem 1.25rem', borderRadius: '12px' }}
            onClick={() => setShowDropdown(!showDropdown)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: 'var(--accent)',
              color: 'white',
              display: 'grid',
              placeItems: 'center',
              fontSize: '0.8rem',
              fontWeight: 900
            }}>
              {user.name[0]}
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginLeft: '0.25rem' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {showDropdown && (
            <div className="card-elite" style={{
              position: 'absolute',
              top: '130%',
              right: 0,
              zIndex: 1000,
              width: 240,
              padding: '1.25rem',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(24px)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-strong)'
            }}>
              <div className="flex-col gap-1 mb-5">
                <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{user.name}</p>
                <p className="text-secondary" style={{ fontSize: '0.75rem' }}>{user.email}</p>
              </div>
              <div className="flex-col gap-3">
                <Link href="/dashboard/settings" className="text-secondary hover:text-primary" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Account Settings</Link>
                <button
                  type="button"
                  className="text-primary"
                  style={{ textAlign: 'left', fontWeight: 800, fontSize: '0.95rem', padding: 0, marginTop: '0.5rem' }}
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  Terminate Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
