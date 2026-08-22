'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import InvestorList from '@/components/InvestorList';
import UserList from '@/components/UserList';
import { useNavigation } from '@/components/NavigationProvider';
import FormField, { inputClass } from '@/components/ui/FormField';
import type { InvestorSummary, UserRow } from '@/lib/data';
import { matchesPersonQuery } from '@/lib/userSearch';

type PeopleTab = 'users' | 'investors';

export default function PeopleDirectory({
  users,
  investors,
}: {
  users: UserRow[];
  investors: InvestorSummary[];
}) {
  const searchParams = useSearchParams();
  const { navigate } = useNavigation();
  const tabFromUrl: PeopleTab =
    searchParams.get('tab') === 'investors' ? 'investors' : 'users';
  const [tab, setTab] = useState<PeopleTab>(tabFromUrl);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  function switchTab(next: PeopleTab) {
    setTab(next);
    navigate(next === 'investors' ? '/users?tab=investors' : '/users');
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => matchesPersonQuery(user, query));
  }, [users, query]);

  const filteredInvestors = useMemo(() => {
    return investors.filter((investor) => matchesPersonQuery(investor, query));
  }, [investors, query]);

  const activeCount = tab === 'users' ? filteredUsers.length : filteredInvestors.length;
  const totalCount = tab === 'users' ? users.length : investors.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchTab('users')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === 'users'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          المستخدمون ({users.length})
        </button>
        <button
          type="button"
          onClick={() => switchTab('investors')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === 'investors'
              ? 'bg-brand-gold text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          المستثمرون ({investors.length})
        </button>
      </div>

      <FormField
        label="بحث"
        hint="ابحث بالاسم أو رقم الهاتف أو كود الإحالة"
        className="max-w-xl"
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="مثال: أحمد أو 079 أو REF123"
          className={inputClass}
        />
      </FormField>

      {query.trim() ? (
        <p className="text-sm text-gray-500">
          {activeCount} من {totalCount} نتيجة
        </p>
      ) : null}

      {tab === 'users' ? (
        <UserList
          users={filteredUsers}
          emptyMessage={
            query.trim() ? 'لا توجد نتائج مطابقة للبحث بين المستخدمين' : undefined
          }
        />
      ) : (
        <InvestorList
          investors={filteredInvestors}
          emptyMessage={
            query.trim() ? 'لا توجد نتائج مطابقة للبحث بين المستثمرين' : undefined
          }
        />
      )}
    </div>
  );
}
