import { sendNotification } from '@/lib/actions';
import Card from '@/components/ui/Card';
import FormField, { inputClass } from '@/components/ui/FormField';
import FormPendingOverlay from '@/components/ui/FormPendingOverlay';
import SubmitButton from '@/components/ui/SubmitButton';

export default function SendNotificationForm() {
  return (
    <Card>
      <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-lg">
          🔔
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">إرسال إشعار جديد</h2>
          <p className="text-sm text-gray-500">أرسل إشعاراً لمستخدم محدد أو لجميع المستخدمين</p>
        </div>
      </div>

      <form action={sendNotification} className="relative space-y-6">
        <FormPendingOverlay message="جاري إرسال الإشعار..." />
        <section>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            محتوى الإشعار
          </h3>
          <div className="space-y-4">
            <FormField label="عنوان الإشعار" hint="عنوان قصير وواضح">
              <input
                name="title"
                required
                placeholder="مثال: تحديث جديد في المنصة"
                className={inputClass}
              />
            </FormField>
            <FormField label="نص الإشعار" hint="الرسالة التي ستظهر للمستخدم">
              <textarea
                name="body"
                required
                rows={4}
                placeholder="اكتب نص الإشعار هنا..."
                className={`${inputClass} resize-none`}
              />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            المستهدفون
          </h3>
          <FormField
            label="معرّف المستخدم (اختياري)"
            hint="اتركه فارغاً لإرسال الإشعار لجميع المستخدمين"
          >
            <input
              name="userId"
              placeholder="مثال: u-1001 أو معرّف Firebase"
              className={inputClass}
            />
          </FormField>
        </section>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
          <strong>تنبيه:</strong> الإرسال للجميع سيصل لكل المستخدمين المسجلين في التطبيق.
        </div>

        <div className="flex items-center justify-end border-t border-gray-100 pt-5">
          <SubmitButton pendingText="جاري الإرسال...">إرسال الإشعار</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
