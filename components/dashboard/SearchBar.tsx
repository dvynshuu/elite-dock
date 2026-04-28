'use client';

import type { RefObject } from 'react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
};

export function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="search"
        className="input-elite"
        style={{ paddingLeft: '3.5rem', background: 'var(--bg-surface-raised)' }}
        placeholder="Explore knowledge library..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <div style={{
        position: 'absolute',
        left: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      <div style={{
        position: 'absolute',
        right: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '0.7rem',
        fontWeight: 800,
        color: 'var(--text-muted)',
        background: 'var(--bg-base)',
        padding: '2px 8px',
        borderRadius: '6px',
        border: '2px solid var(--border)',
        pointerEvents: 'none',
        letterSpacing: '0.1em'
      }}>
        /
      </div>
    </div>
  );
}
