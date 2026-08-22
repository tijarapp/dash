'use client';

import { useState } from 'react';
import NavAnchor from '@/components/NavAnchor';
import { updateWithdrawRequest } from '@/lib/actions';
import type { WithdrawRow } from '@/lib/data';
import { withdrawMethodLabel } from '@/lib/withdraw';
import Card from '@/components/ui/Card';
import ConfirmForm from '@/components/ui/ConfirmForm';
import FormField, { inputClass } from '@/components/ui/FormField';
import FormPendingOverlay from '@/components/ui/FormPendingOverlay';
import SubmitButton from '@/components/ui/SubmitButton';

export default function EditWithdrawForm({
  request,
  userName,
}: {
  request: WithdrawRow;
  userName: string;
}) {
  const [status, setStatus] = useState(request.status);
  const isZainCash = request.method === 'zaincash';
  const willReject =
    status === 'rejected' &&
    (request.status === 'pending' || request.status === 'approved');

  return (
    <Card>
      <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg">
          ✎
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">تعديل طلب السحب</h2>
          <p className="text-sm text-gray-500">
            المستخدم: {userName} — المبلغ الحالي: {request.amount.toLocaleString()} دينار —{' '}
            {withdrawMethodLabel(request.method)}
          </p>
        </div>
      </div>

      <ConfirmForm
        action={updateWithdrawRequest}
        title="تأكيد حفظ التعديلات"
        message={
          willReject
            ? 'سيتم رفض الطلب وإعادة المبلغ إلى رصيد المستخدم. تأكد من كتابة سبب الرفض.'
            : 'هل تريد حفظ تعديلات طلب السحب؟'
        }
        confirmLabel="نعم، حفظ"
        danger={willReject}
        noteField={
          willReject
            ? {
                name: 'adminNote',
                label: 'سبب الرفض للمستخدم',
                placeholder: isZainCash
                  ? 'مثال: رقم المحفظة غير صحيح'
                  : 'مثال: بيانات البطاقة غير صحيحة',
                required: true,
              }
            : undefined
        }
        className="relative space-y-8"
      >
        <FormPendingOverlay message="جاري حفظ التعديلات..." />
        <input type="hidden" name="id" value={request.id} />
        <input type="hidden" name="method" value={request.method} />

        <section>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            بيانات الطلب
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="معرّف المستخدم" hint="معرّف Firebase للمستخدم">
              <input
                name="userId"
                required
                defaultValue={request.userId}
                className={`${inputClass} font-mono text-xs`}
              />
            </FormField>
            <FormField label="المبلغ (دينار)" hint="مبلغ السحب المطلوب">
              <input
                name="amount"
                type="number"
                min="0"
                required
                defaultValue={request.amount}
                className={inputClass}
              />
            </FormField>
            <FormField label="طريقة السحب">
              <div className={`${inputClass} bg-gray-100 text-gray-700`}>
                {withdrawMethodLabel(request.method)}
              </div>
            </FormField>
            <FormField label="الحالة">
              <select
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={inputClass}
              >
                <option value="pending">معلق</option>
                <option value="approved">معتمد</option>
                <option value="rejected">مرفوض</option>
              </select>
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {isZainCash ? 'بيانات زين كاش' : 'بيانات البطاقة البنكية'}
          </h3>
          {isZainCash ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="صاحب المحفظة" className="sm:col-span-2">
                <input
                  name="holderName"
                  required
                  defaultValue={request.holderName}
                  placeholder="الاسم كما هو مسجل في زين كاش"
                  className={inputClass}
                />
              </FormField>
              <FormField label="رقم المحفظة" className="sm:col-span-2">
                <input
                  name="phoneNumber"
                  required
                  defaultValue={request.phoneNumber}
                  placeholder="07XXXXXXXXX"
                  className={`${inputClass} font-mono`}
                />
              </FormField>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="صاحب البطاقة" className="sm:col-span-2">
                <input
                  name="cardHolder"
                  required
                  defaultValue={request.cardHolder}
                  placeholder="الاسم كما يظهر على البطاقة"
                  className={inputClass}
                />
              </FormField>
              <FormField label="رقم البطاقة" className="sm:col-span-2">
                <input
                  name="cardNumber"
                  required
                  defaultValue={request.cardNumber}
                  placeholder="رقم البطاقة أو IBAN"
                  className={`${inputClass} font-mono`}
                />
              </FormField>
              <FormField label="رمز SWIFT" className="sm:col-span-2">
                <input
                  name="swift"
                  defaultValue={request.swift}
                  placeholder="مثال: ARABJOAX"
                  className={`${inputClass} font-mono`}
                />
              </FormField>
            </div>
          )}
        </section>

        {request.adminNote ? (
          <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-red-700">
            <strong>سبب الرفض الحالي:</strong> {request.adminNote}
          </div>
        ) : null}

        {request.status !== 'rejected' ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
            <strong>ملاحظة:</strong> الرصيد يُخصم عند إنشاء الطلب. قبول الطلب لا يخصم مرة أخرى.
            تغيير الحالة إلى «مرفوض» يعيد المبلغ إلى رصيد المستخدم ويتطلب سبب رفض.
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <NavAnchor
            href="/requests"
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            إلغاء
          </NavAnchor>
          <SubmitButton pendingText="جاري الحفظ...">حفظ التعديلات</SubmitButton>
        </div>
      </ConfirmForm>
    </Card>
  );
}
