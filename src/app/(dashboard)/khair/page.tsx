import { requireAdmin } from '@/lib/session';
import KhairPanel from '@/components/KhairPanel';
export default async function KhairPage() {
  await requireAdmin();
  return <KhairPanel />;
}
