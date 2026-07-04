import NavAnchor from '@/components/NavAnchor';
import type { InvestorSummary } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

function InvestorRowCard({ investor }: { investor: InvestorSummary }) {
  return (
    <NavAnchor href={`/users/${investor.id}`} className="block">
      <Card className="transition hover:border-brand-gold/30 hover:shadow-md">
        <div className="flex items-center gap-4">
          <Avatar name={investor.name || investor.phone || '?'} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{investor.name || '—'}</p>
            <p className="text-sm text-gray-500">{investor.phone || '—'}</p>
          </div>
          <div className="hidden gap-6 sm:flex">
            <div className="text-left">
              <p className="text-xs text-gray-400">الاستثمارات</p>
              <p className="font-semibold text-brand-blue">{investor.investmentCount}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400">إجمالي المستثمر</p>
              <p className="font-semibold text-brand-gold">
                {investor.totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400">الأرباح</p>
              <p className="font-semibold text-green-600">
                {investor.totalProfit > 0 ? `+${investor.totalProfit.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
          <span className="text-gray-300">←</span>
        </div>
      </Card>
    </NavAnchor>
  );
}

export default function InvestorList({ investors }: { investors: InvestorSummary[] }) {
  if (investors.length === 0) {
    return (
      <Card>
        <EmptyState message="لا يوجد مستثمرون بعد" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {investors.map((investor) => (
        <InvestorRowCard key={investor.id} investor={investor} />
      ))}
    </div>
  );
}
