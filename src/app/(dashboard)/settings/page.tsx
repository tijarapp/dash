import SettingsForm from '@/components/SettingsForm';
import PageHeader from '@/components/ui/PageHeader';
import { getAppSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getAppSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        description="إدارة إصدار التطبيق وروابط المتاجر وأرقام الدعم وطلبات الشحن"
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
