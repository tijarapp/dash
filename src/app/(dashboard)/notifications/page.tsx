import SendNotificationForm from '@/components/SendNotificationForm';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';

export const dynamic = 'force-dynamic';

const tips = [
  {
    title: 'إشعار لمستخدم واحد',
    description: 'أدخل معرّف المستخدم من صفحة تفاصيله لإرسال إشعار مخصص.',
  },
  {
    title: 'إشعار للجميع',
    description: 'اترك حقل المعرّف فارغاً وسيصل الإشعار لكل المستخدمين المسجلين.',
  },
  {
    title: 'نصائح للمحتوى',
    description: 'استخدم عنواناً قصيراً ونصاً واضحاً — يظهر الإشعار مباشرة في تطبيق المستخدم.',
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="الإشعارات"
        description="إرسال إشعارات push للمستخدمين والمستثمرين"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SendNotificationForm />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500">دليل سريع</h2>
          {tips.map((tip) => (
            <Card key={tip.title} className="!p-4">
              <p className="font-medium text-gray-900">{tip.title}</p>
              <p className="mt-1 text-sm text-gray-500">{tip.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
