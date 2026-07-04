import NavAnchor from '@/components/NavAnchor';
import InvestorList from '@/components/InvestorList';
import PageHeader from '@/components/ui/PageHeader';
import { listInvestors } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function InvestorsPage() {
  const investors = await listInvestors();

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستثمرون"
        description="المستخدمون الذين لديهم استثمارات — اضغط على أي مستثمر لعرض التفاصيل"
        action={
          <NavAnchor
            href="/users"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            عرض المستخدمين
          </NavAnchor>
        }
      />
      <InvestorList investors={investors} />
    </div>
  );
}
