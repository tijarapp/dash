import { redirect } from 'next/navigation';

export default function InvestorsPage() {
  redirect('/users?tab=investors');
}
