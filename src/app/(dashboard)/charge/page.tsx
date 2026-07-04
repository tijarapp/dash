import ChargeBalancePanel from '@/components/ChargeBalancePanel';
import PageHeader from '@/components/ui/PageHeader';
import { listUsers } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ChargePage() {
  const users = (await listUsers()).filter((user) => user.role !== 'admin');

  return (
    <div className="space-y-6">
      <PageHeader
        title="شحن الرصيد"
        description="ابحث عن مستخدم بالاسم أو الهاتف أو كود الإحالة ثم اشحن رصيده"
      />
      <ChargeBalancePanel users={users} />
    </div>
  );
}
