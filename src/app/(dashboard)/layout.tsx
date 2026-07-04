import DashboardShell from '@/components/DashboardShell';
import { requireAdmin } from '@/lib/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return <DashboardShell email={user.email}>{children}</DashboardShell>;
}
