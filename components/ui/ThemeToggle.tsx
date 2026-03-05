'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('bookmark-theme') as 'light' | 'dark' | null;
    const initial = stored || 'light';
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('bookmark-theme', next);
  };

  return (
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={toggle}>
      {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}
