import { PublicError } from '@/lib/validation';

type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new PublicError('Too many requests. Please try again shortly.', 429);
  }

  current.count += 1;
}
