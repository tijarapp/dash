import NavAnchor from '@/components/NavAnchor';
import SyncWithdrawTransactionsButton from '@/components/SyncWithdrawTransactionsButton';
import WithdrawRequestList from '@/components/WithdrawRequestList';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { getUserNameMap, listWithdrawRequests } from '@/lib/data';

export const dynamic = 'force-dynamic';

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="!p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
    </Card>
  );
}

export default async function RequestsPage() {
  const [requests, userMap] = await Promise.all([listWithdrawRequests(), getUserNameMap()]);

  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const rejected = requests.filter((r) => r.status === 'rejected');
  const pendingTotal = pending.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="طلبات السحب"
        description="مراجعة ومعالجة طلبات سحب الأرصدة من المستثمرين"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SyncWithdrawTransactionsButton />
            <NavAnchor
              href="/charge"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              شحن رصيد مستخدم
            </NavAnchor>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          label="طلبات معلقة"
          value={pending.length.toLocaleString()}
          accent={pending.length > 0 ? 'text-amber-600' : undefined}
        />
        <StatBox
          label="مبلغ معلق"
          value={pendingTotal.toLocaleString()}
          accent="text-red-600"
        />
        <StatBox label="معتمدة" value={approved.length.toLocaleString()} accent="text-green-600" />
        <StatBox label="مرفوضة" value={rejected.length.toLocaleString()} accent="text-gray-500" />
      </div>

      <WithdrawRequestList requests={requests} userMap={userMap} />
    </div>
  );
}
