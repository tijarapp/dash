import HomeTickerForm from '@/components/HomeTickerForm';
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
        description="إدارة الشريط المتحرك في الرئيسية وإصدار التطبيق وروابط المتاجر وأرقام الدعم وطلبات الشحن"
      />
      <HomeTickerForm text={settings.homeTickerText} />
      <SettingsForm settings={settings} />
    </div>
  );
}
