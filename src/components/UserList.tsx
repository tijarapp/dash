'use client';

import NavAnchor from '@/components/NavAnchor';
import type { UserRow } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

function UserRowCard({ user }: { user: UserRow }) {
  return (
    <NavAnchor href={`/users/${user.id}`} className="block">
      <Card className="transition hover:border-brand-blue/30 hover:shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar name={user.name || user.phone || '?'} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{user.name || '—'}</p>
            <p className="truncate text-sm text-gray-500">{user.phone || '—'}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 sm:hidden">
              <span>
                ذهب:{' '}
                <span className="font-semibold text-brand-gold">
                  {user.goldBalance.toLocaleString()}
                </span>
              </span>
              <span>
                دينار:{' '}
                <span className="font-semibold">{user.dinarBalance.toLocaleString()}</span>
              </span>
            </div>
          </div>
          <div className="hidden gap-6 sm:flex">
            <div className="text-left">
              <p className="text-xs text-gray-400">رصيد الذهب</p>
              <p className="font-semibold text-brand-gold">{user.goldBalance.toLocaleString()}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400">رصيد الدينار</p>
              <p className="font-semibold">{user.dinarBalance.toLocaleString()}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400">كود الإحالة</p>
              <p className="font-mono text-xs">{user.referralCode || '—'}</p>
            </div>
          </div>
          <span className="text-gray-300">←</span>
        </div>
      </Card>
    </NavAnchor>
  );
}

export default function UserList({ users }: { users: UserRow[] }) {
  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(users);

  if (users.length === 0) {
    return (
      <Card>
        <EmptyState message="لا يوجد مستخدمون مسجلون بدون استثمارات" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {pageItems.map((user) => (
        <UserRowCard key={user.id} user={user} />
      ))}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </div>
  );
}
