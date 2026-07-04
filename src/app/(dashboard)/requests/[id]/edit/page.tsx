import NavAnchor from '@/components/NavAnchor';
import { notFound } from 'next/navigation';
import EditWithdrawForm from '@/components/EditWithdrawForm';
import PageHeader from '@/components/ui/PageHeader';
import { getUserNameMap, getWithdrawRequestById } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function EditWithdrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [request, userMap] = await Promise.all([getWithdrawRequestById(id), getUserNameMap()]);
  if (!request) notFound();

  const userName = userMap[request.userId] ?? request.userId;

  return (
    <div className="space-y-6">
      <NavAnchor
        href="/requests"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-brand-blue"
      >
        → رجوع إلى الطلبات
      </NavAnchor>
      <PageHeader
        title="تعديل طلب السحب"
        description="عدّل جميع بيانات الطلب — المبلغ، البطاقة، الحالة، والمستخدم"
      />
      <EditWithdrawForm request={request} userName={userName} />
    </div>
  );
}
