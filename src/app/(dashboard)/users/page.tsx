import NavAnchor from '@/components/NavAnchor';
import UserList from '@/components/UserList';
import PageHeader from '@/components/ui/PageHeader';
import { listRegularUsers } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await listRegularUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون"
        description="المستخدمون المسجلون بدون استثمارات — اضغط على أي مستخدم لعرض التفاصيل"
        action={
          <NavAnchor
            href="/investors"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            عرض المستثمرين
          </NavAnchor>
        }
      />
      <UserList users={users} />
    </div>
  );
}
