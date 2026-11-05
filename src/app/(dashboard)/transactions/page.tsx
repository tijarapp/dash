import TransactionList from '@/components/TransactionList';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { getUserNameMap, listTransactions } from '@/lib/data';

export const dynamic = 'force-dynamic';

const typeLabels: Record<string, string> = {
  charge: 'شحن',
  withdraw: 'سحب',
  profit: 'ربح',
  monthly_payout: 'دفعة شهرية (رأس مال وربح)',
  invest: 'استثمار',
};

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="!p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
    </Card>
  );
}

export default async function TransactionsPage() {
  const [transactions, userMap] = await Promise.all([listTransactions(), getUserNameMap()]);

  const byType = transactions.reduce(
    (acc, t) => {
      acc[t.type] = (acc[t.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(t.dinarAmount), 0);
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المعاملات"
        description="سجل جميع معاملات الشحن والسحب والاستثمار والأرباح"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatBox label="إجمالي المعاملات" value={transactions.length.toLocaleString()} />
        <StatBox
          label="حجم المعاملات"
          value={totalVolume.toLocaleString()}
          accent="text-brand-gold"
        />
        <StatBox
          label="معلقة"
          value={pendingCount.toLocaleString()}
          accent={pendingCount > 0 ? 'text-amber-600' : undefined}
        />
        {Object.entries(typeLabels).map(([type, label]) =>
          byType[type] ? (
            <StatBox key={type} label={label} value={byType[type].toLocaleString()} />
          ) : null,
        )}
      </div>

      <TransactionList transactions={transactions} userMap={userMap} />
    </div>
  );
}
