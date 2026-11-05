'use server';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { adminDb } from './firebaseAdmin';
import { requireAdmin } from './session';
import { DEMO_MODE } from './demo';
import { addCalendarMonths, buildMonthlySchedule, nextMonthlyPayoutDate, MONTHLY_PAYOUT_MODEL } from './categoryProfit';
import type { FormActionState } from './actions';

export async function listMonthlyPayouts() {
  await requireAdmin();
  if (DEMO_MODE) return [];
  const snap = await adminDb.collection('investments').where('payoutModel', '==', MONTHLY_PAYOUT_MODEL).get();
  return snap.docs.flatMap((doc) => {
    const data = doc.data();
    if (data.status !== 'active') return [];
    const paidMonths = Number(data.paidMonths) || 0;
    const row = buildMonthlySchedule(Number(data.amount), Number(data.durationMonths), Number(data.expectedTotalReturn))[paidMonths];
    const start = (data.startDate as Timestamp).toDate();
    if (!row) return [];
    const due = nextMonthlyPayoutDate(start, row.month, data.nextPayoutAt?.toDate?.());
    return [{ id: doc.id, userId: String(data.userId), title: String(data.categoryTitle),
      month: row.month, principal: row.principal, expectedProfit: row.expectedProfit,
      remainingCapital: row.remainingCapital, dueAt: due.toISOString(), isDue: due.getTime() <= Date.now() }];
  }).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export async function approveMonthlyPayout(_previous: FormActionState, form: FormData): Promise<FormActionState> {
  try {
    const admin = await requireAdmin();
    const id = String(form.get('investmentId') ?? '');
    const month = Number(form.get('month'));
    const rawProfit = String(form.get('actualProfit') ?? '').trim();
    const profit = Number(rawProfit);
    const note = String(form.get('note') ?? '').trim();
    if (!id || id.includes('/') || !Number.isInteger(month) || month < 1) throw new Error('بيانات الدفعة غير صحيحة');
    if (!rawProfit || !Number.isFinite(profit) || profit < 0 || !Number.isSafeInteger(Math.round(profit * 100)) ||
      Math.abs(profit * 100 - Math.round(profit * 100)) > 0.00001) throw new Error('أدخل الربح الفعلي المعتمد للشهر بمنزلتين عشريتين كحد أقصى، ويمكن إدخال صفر');
    if (DEMO_MODE) return { error: 'اعتماد الدفعات غير متاح في الوضع التجريبي' };
    const investmentRef = adminDb.collection('investments').doc(id);
    const payoutRef = investmentRef.collection('monthlyPayouts').doc(String(month));
    const ledgerRef = adminDb.collection('transactions').doc(`monthly_${id}_${month}`);
    const notificationRef = adminDb.collection('notifications').doc(`monthly_${id}_${month}`);
    await adminDb.runTransaction(async (txn) => {
      const [investment, previous] = await Promise.all([txn.get(investmentRef), txn.get(payoutRef)]);
      if (previous.exists) return; // Concurrent approvals/retries cannot credit twice.
      const data = investment.data();
      if (!data || data.payoutModel !== MONTHLY_PAYOUT_MODEL || data.status !== 'active') throw new Error('الاشتراك غير متاح للصرف الشهري');
      const paidMonths = Number(data.paidMonths) || 0;
      if (month !== paidMonths + 1) throw new Error('يجب اعتماد الدفعات بترتيب الأشهر؛ حدّث الصفحة');
      const schedule = buildMonthlySchedule(Number(data.amount), Number(data.durationMonths), Number(data.expectedTotalReturn));
      const row = schedule[paidMonths];
      if (!row) throw new Error('اكتملت دفعات الاشتراك');
      const due = nextMonthlyPayoutDate((data.startDate as Timestamp).toDate(), month, data.nextPayoutAt?.toDate?.());
      if (due.getTime() > Date.now()) throw new Error('لم يحن موعد الدفعة الشهرية');
      const userRef = adminDb.collection('users').doc(String(data.userId));
      const user = (await txn.get(userRef)).data();
      if (!user || !Number.isFinite(user.goldBalance) || !Number.isFinite(user.dinarBalance)) throw new Error('تعذر العثور على محفظة صالحة');
      const paymentUnits = Math.round(row.principal * 100) + Math.round(profit * 100);
      if (!Number.isSafeInteger(paymentUnits)) throw new Error('قيمة الدفعة أكبر من الحد المسموح');
      const amount = paymentUnits / 100;
      const final = month === schedule.length;
      const approvedAt = Timestamp.now();
      txn.update(userRef, { goldBalance: FieldValue.increment(amount), dinarBalance: FieldValue.increment(amount) });
      txn.create(payoutRef, { month, principal: row.principal, actualProfit: profit, expectedProfit: row.expectedProfit,
        amount, remainingCapital: row.remainingCapital, approvedBy: admin.uid, approvedAt, note });
      txn.update(investmentRef, {
        paidMonths: month, recoveredAmount: Number(data.amount) - row.remainingCapital,
        totalProfit: FieldValue.increment(profit), totalIncome: FieldValue.increment(amount),
        status: final ? 'expired' : 'active',
        nextPayoutAt: final ? null : Timestamp.fromDate(addCalendarMonths((data.startDate as Timestamp).toDate(), month + 1)),
      });
      txn.create(ledgerRef, { userId: data.userId, investmentId: id, type: 'monthly_payout', month,
        principalAmount: row.principal, profitAmount: profit, goldAmount: amount, dinarAmount: amount,
        status: 'completed', note: `دفعة الشهر ${month}: رأس مال معاد وربح فعلي معتمد${note ? ` — ${note}` : ''}`, createdAt: approvedAt });
      txn.create(notificationRef, { userId: data.userId, title: 'تم صرف الدفعة الشهرية',
        body: `أضيفت دفعة الشهر ${month}: ${row.principal} رأس مال معاد و${profit} ربح معتمد.`, read: false, createdAt: approvedAt });
    });
    for (const path of ['/monthly-payouts', '/', '/investors', '/users', '/transactions']) revalidatePath(path);
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'تعذر اعتماد الدفعة' };
  }
}
