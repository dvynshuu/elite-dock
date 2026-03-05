import { redirect } from 'next/navigation';

export default function TrashPage() {
  redirect('/dashboard?view=trash');
}
