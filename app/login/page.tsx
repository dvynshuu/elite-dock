import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="login" />
      <p className="text-secondary mt-6">
        New here? <Link href="/signup" className="text-primary font-bold">Create an account</Link>
      </p>
    </main>
  );
}
