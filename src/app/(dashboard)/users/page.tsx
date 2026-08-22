import { Suspense } from 'react';
import PeopleDirectory from '@/components/PeopleDirectory';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { listInvestors, listRegularUsers } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const [users, investors] = await Promise.all([listRegularUsers(), listInvestors()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون والمستثمرون"
        description="تصفّح المستخدمين والمستثمرين وابحث بالاسم أو الهاتف أو كود الإحالة"
      />
      <Suspense fallback={<LoadingSpinner />}>
        <PeopleDirectory users={users} investors={investors} />
      </Suspense>
    </div>
  );
}
