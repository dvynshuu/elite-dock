import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="signup" />
      <p className="text-secondary mt-6">
        Already have access? <Link href="/login" className="text-primary font-bold">Sign in</Link>
      </p>
    </main>
  );
}
