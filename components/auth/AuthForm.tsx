'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const result = await signIn(process.env.NODE_ENV === 'development' ? 'credentials' : 'email', {
      email,
      callbackUrl,
      redirect: true
    });

    setLoading(false);
  };

  return (
    <div className="card-elite max-w-md w-full">
      <div className="auth-header">
        <h1>{mode === 'login' ? 'Welcome Back' : 'Join the Elite'}</h1>
        <p className="text-secondary">
          {mode === 'login'
            ? 'Open the workspace that brings the right saved knowledge back at the right moment.'
            : 'Import your links, save why they matter, and build a bookmark system you will actually revisit.'}
        </p>
      </div>

      <form onSubmit={submitEmail} className="flex-col gap-6">
        <div className="flex-col gap-2">
          <label className="text-secondary font-medium" style={{ fontSize: '0.9rem' }}>
            Work Email
          </label>
          <input
            type="email"
            className="input-elite"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <button type="submit" className="btn-elite btn-elite-primary w-full" disabled={loading}>
          {loading ? 'Entering...' : 'Continue with Email'}
        </button>
      </form>

      <div className="text-center text-muted mt-6" style={{ fontSize: '0.85rem' }}>
        or elevate with
      </div>

      <button
        type="button"
        className="btn-elite btn-elite-secondary w-full mt-6"
        onClick={() => signIn('google', { callbackUrl })}
      >
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
