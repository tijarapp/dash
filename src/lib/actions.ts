'use server';

import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminDb } from './firebaseAdmin';
import { requireAdmin } from './session';
import { DEMO_MODE } from './demo';
import {
  CATEGORY_DURATION_MONTHS,
  validateDailyProfitRate,
} from './categoryProfit';

export type FormActionState = { error: string | null };

function categoryFinancialFields(formData: FormData) {
  const dailyProfitRate = Number(formData.get('dailyProfitRate') ?? 0);
  const rateError = validateDailyProfitRate(dailyProfitRate);
  if (rateError) throw new Error(rateError);

  return {
    dailyProfitRate,
    minInvestment: Number(formData.get('minInvestment') ?? 0),
    durationMonths: CATEGORY_DURATION_MONTHS,
  };
}

export async function createCategory(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    await requireAdmin();
    const financial = categoryFinancialFields(formData);

    if (DEMO_MODE) {
      revalidatePath('/categories');
      return { error: null };
    }

    await adminDb.collection('investmentCategories').add({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      imageUrl: String(formData.get('imageUrl') ?? ''),
      ...financial,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    revalidatePath('/categories');
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل إنشاء الفئة';
    return { error: message };
  }
}

export async function updateCategory(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    await requireAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { error: 'معرّف الفئة غير موجود' };

    const data = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      imageUrl: String(formData.get('imageUrl') ?? ''),
      ...categoryFinancialFields(formData),
      isActive: formData.get('isActive') === 'true',
      annualYield: FieldValue.delete(),
    };

    if (DEMO_MODE) {
      revalidatePath('/categories');
      revalidatePath(`/categories/${id}/edit`);
      return { error: null };
    }

    await adminDb.collection('investmentCategories').doc(id).update(data);
    revalidatePath('/categories');
    revalidatePath(`/categories/${id}/edit`);
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل حفظ الفئة';
    return { error: message };
  }
}

export async function toggleCategory(id: string, isActive: boolean) {
  await requireAdmin();
  if (DEMO_MODE) {
    revalidatePath('/categories');
    return;
  }
  await adminDb.collection('investmentCategories').doc(id).update({ isActive });
  revalidatePath('/categories');
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  if (DEMO_MODE) {
    revalidatePath('/categories');
    return;
  }
  await adminDb.collection('investmentCategories').doc(id).delete();
  revalidatePath('/categories');
}

/// Charges a user's gold + dinar balance and records a matching transaction.
export async function chargeUserBalance(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    await requireAdmin();
    const userId = String(formData.get('userId') ?? '');
    const amount = Number(formData.get('amount') ?? 0);

    if (!userId) return { error: 'يرجى اختيار مستخدم' };
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: 'أدخل مبلغاً موجباً للشحن' };
    }

    if (DEMO_MODE) {
      revalidatePath('/charge');
      revalidatePath('/users');
      revalidatePath('/transactions');
      return { error: null };
    }

    const userRef = adminDb.collection('users').doc(userId);
    await adminDb.runTransaction(async (txn) => {
      const snap = await txn.get(userRef);
      if (!snap.exists) throw new Error('المستخدم غير موجود');

      const gold = Number(snap.data()?.goldBalance) || 0;
      const dinar = Number(snap.data()?.dinarBalance) || 0;

      txn.update(userRef, {
        goldBalance: gold + amount,
        dinarBalance: dinar + amount,
      });

      const txnRef = adminDb.collection('transactions').doc();
      txn.set(txnRef, {
        userId,
        type: 'charge',
        goldAmount: amount,
        dinarAmount: amount,
        status: 'completed',
        note: 'شحن رصيد من لوحة التحكم',
        createdAt: FieldValue.serverTimestamp(),
      });

      const notifRef = adminDb.collection('notifications').doc();
      txn.set(notifRef, {
        userId,
        title: 'تم شحن الرصيد',
        body: `تم شحن رصيدك بمبلغ ${amount.toLocaleString('ar')}.`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    revalidatePath('/charge');
    revalidatePath('/users');
    revalidatePath('/investors');
    revalidatePath('/transactions');
    revalidatePath('/notifications');
    revalidatePath(`/users/${userId}`);
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل شحن الرصيد';
    return { error: message };
  }
}

function withdrawApprovalNotification(userId: string, amount: number) {
  return {
    userId,
    title: 'تم قبول طلب السحب',
    body: `تم اعتماد طلب السحب بمبلغ ${amount.toLocaleString('ar')} دينار. سيتم تحويل المبلغ إلى حسابك البنكي.`,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function withdrawRejectionNotification(
  userId: string,
  amount: number,
  adminNote?: string,
) {
  const notePart = adminNote?.trim()
    ? ` السبب: ${adminNote.trim()}`
    : '';
  return {
    userId,
    title: 'تم رفض طلب السحب',
    body: `تم رفض طلب السحب بمبلغ ${amount.toLocaleString('ar')} دينار. تم إعادة المبلغ إلى رصيدك.${notePart}`,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function findWithdrawTransactionRefs(
  txn: Transaction,
  userId: string,
  amount: number,
  withdrawRequestId: string,
  statuses: string[],
): Promise<DocumentReference[]> {
  const byRequestId = adminDb
    .collection('transactions')
    .where('withdrawRequestId', '==', withdrawRequestId);
  const byRequestSnap = await txn.get(byRequestId);

  if (!byRequestSnap.empty) {
    return byRequestSnap.docs
      .filter((doc) => statuses.includes(doc.data().status ?? ''))
      .map((doc) => doc.ref);
  }

  const userTxns = adminDb.collection('transactions').where('userId', '==', userId);
  const snap = await txn.get(userTxns);

  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.type !== 'withdraw' || !statuses.includes(d.status ?? '')) continue;

    const txnAmount = Math.abs(Number(d.goldAmount) || Number(d.dinarAmount) || 0);
    if (txnAmount === amount) {
      return [doc.ref];
    }
  }

  return [];
}

async function findPendingWithdrawTransactionRefs(
  txn: Transaction,
  userId: string,
  amount: number,
  withdrawRequestId: string,
): Promise<DocumentReference[]> {
  return findWithdrawTransactionRefs(txn, userId, amount, withdrawRequestId, ['pending']);
}

export async function approveWithdraw(id: string) {
  await requireAdmin();
  if (DEMO_MODE) {
    revalidatePath('/requests');
    return;
  }
  const reqRef = adminDb.collection('withdrawRequests').doc(id);
  let userId = '';
  await adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(reqRef);
    if (!snap.exists) return;
    const data = snap.data()!;
    if (data.status !== 'pending') return;

    const amount = Number(data.amount) || 0;
    userId = data.userId;

    const pendingTxnRefs = await findPendingWithdrawTransactionRefs(
      txn,
      data.userId,
      amount,
      id,
    );

    txn.update(reqRef, { status: 'approved' });
    for (const ref of pendingTxnRefs) {
      txn.update(ref, { status: 'completed', note: 'سحب معتمد' });
    }

    const notifRef = adminDb.collection('notifications').doc();
    txn.set(notifRef, withdrawApprovalNotification(data.userId, amount));
  });
  revalidatePath('/requests');
  revalidatePath('/transactions');
  if (userId) revalidatePath(`/users/${userId}`);
}

export async function updateWithdrawRequest(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const userId = String(formData.get('userId') ?? '');
  const amount = Number(formData.get('amount') ?? 0);
  const cardHolder = String(formData.get('cardHolder') ?? '');
  const cardNumber = String(formData.get('cardNumber') ?? '');
  const swift = String(formData.get('swift') ?? '');
  const newStatus = String(formData.get('status') ?? 'pending');
  const adminNote = String(formData.get('adminNote') ?? '').trim();

  if (DEMO_MODE) {
    revalidatePath('/requests');
    revalidatePath(`/requests/${id}/edit`);
    redirect('/requests');
  }

  const reqRef = adminDb.collection('withdrawRequests').doc(id);
  const snap = await reqRef.get();
  if (!snap.exists) return;

  const oldStatus = snap.data()!.status ?? 'pending';
  const refundUserId = userId || snap.data()!.userId;

  if (oldStatus === 'pending' && newStatus === 'approved') {
    await adminDb.runTransaction(async (txn) => {
      const freshSnap = await txn.get(reqRef);
      if (!freshSnap.exists || freshSnap.data()!.status !== 'pending') return;

      const pendingTxnRefs = await findPendingWithdrawTransactionRefs(
        txn,
        userId,
        amount,
        id,
      );

      txn.update(reqRef, {
        userId,
        amount,
        cardHolder,
        cardNumber,
        swift,
        status: 'approved',
      });
      for (const ref of pendingTxnRefs) {
        txn.update(ref, { status: 'completed', note: 'سحب معتمد' });
      }

      const notifRef = adminDb.collection('notifications').doc();
      txn.set(notifRef, withdrawApprovalNotification(userId, amount));
    });
  } else if (
    newStatus === 'rejected' &&
    (oldStatus === 'pending' || oldStatus === 'approved')
  ) {
    if (!adminNote) {
      throw new Error('يرجى كتابة سبب الرفض للمستخدم');
    }

    await adminDb.runTransaction(async (txn) => {
      const freshSnap = await txn.get(reqRef);
      if (!freshSnap.exists) return;

      const currentStatus = freshSnap.data()!.status ?? 'pending';
      if (currentStatus === 'rejected') return;
      if (currentStatus !== 'pending' && currentStatus !== 'approved') return;

      const refundAmount = Number(freshSnap.data()!.amount) || amount;
      const targetUserId = freshSnap.data()!.userId || userId;

      const userRef = adminDb.collection('users').doc(targetUserId);
      const userSnap = await txn.get(userRef);
      const withdrawTxnRefs = await findWithdrawTransactionRefs(
        txn,
        targetUserId,
        refundAmount,
        id,
        ['pending', 'completed'],
      );

      const gold = Number(userSnap.data()?.goldBalance) || 0;
      const dinar = Number(userSnap.data()?.dinarBalance) || 0;

      txn.update(userRef, {
        goldBalance: gold + refundAmount,
        dinarBalance: dinar + refundAmount,
      });
      txn.update(reqRef, {
        userId,
        amount,
        cardHolder,
        cardNumber,
        swift,
        status: 'rejected',
        adminNote: adminNote || null,
      });
      for (const ref of withdrawTxnRefs) {
        txn.update(ref, {
          status: 'rejected',
          note: adminNote
            ? `طلب سحب مرفوض: ${adminNote}`
            : 'طلب سحب مرفوض',
        });
      }

      const txnRef = adminDb.collection('transactions').doc();
      txn.set(txnRef, {
        userId: targetUserId,
        type: 'charge',
        goldAmount: refundAmount,
        dinarAmount: refundAmount,
        status: 'completed',
        note: 'استرداد طلب سحب مرفوض',
        createdAt: FieldValue.serverTimestamp(),
      });

      const notifRef = adminDb.collection('notifications').doc();
      txn.set(
        notifRef,
        withdrawRejectionNotification(targetUserId, refundAmount, adminNote),
      );
    });
  } else {
    await reqRef.update({
      userId,
      amount,
      cardHolder,
      cardNumber,
      swift,
      status: newStatus,
    });
  }

  revalidatePath('/requests');
  revalidatePath('/transactions');
  revalidatePath(`/requests/${id}/edit`);
  revalidatePath(`/users/${refundUserId}`);

  redirect('/requests');
}

export async function rejectWithdraw(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const adminNote = String(formData.get('adminNote') ?? '').trim();
  if (!id) return;
  if (!adminNote) return;

  if (DEMO_MODE) {
    revalidatePath('/requests');
    return;
  }
  const reqRef = adminDb.collection('withdrawRequests').doc(id);
  let userId = '';
  await adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(reqRef);
    if (!snap.exists) return;
    const data = snap.data()!;
    if (data.status !== 'pending') return;

    const amount = Number(data.amount) || 0;
    userId = data.userId;

    const userRef = adminDb.collection('users').doc(data.userId);
    const userSnap = await txn.get(userRef);
    const pendingTxnRefs = await findPendingWithdrawTransactionRefs(
      txn,
      data.userId,
      amount,
      id,
    );

    const gold = Number(userSnap.data()?.goldBalance) || 0;
    const dinar = Number(userSnap.data()?.dinarBalance) || 0;

    txn.update(userRef, {
      goldBalance: gold + amount,
      dinarBalance: dinar + amount,
    });
    txn.update(reqRef, {
      status: 'rejected',
      adminNote,
    });
    for (const ref of pendingTxnRefs) {
      txn.update(ref, {
        status: 'rejected',
        note: `طلب سحب مرفوض: ${adminNote}`,
      });
    }

    const txnRef = adminDb.collection('transactions').doc();
    txn.set(txnRef, {
      userId: data.userId,
      type: 'charge',
      goldAmount: amount,
      dinarAmount: amount,
      status: 'completed',
      note: 'استرداد طلب سحب مرفوض',
      createdAt: FieldValue.serverTimestamp(),
    });

    const notifRef = adminDb.collection('notifications').doc();
    txn.set(
      notifRef,
      withdrawRejectionNotification(data.userId, amount, adminNote),
    );
  });
  revalidatePath('/requests');
  revalidatePath('/transactions');
  if (userId) revalidatePath(`/users/${userId}`);
}

/// Fixes transactions still marked pending after their withdraw request was processed.
export async function syncWithdrawTransactionsWithRequests() {
  await requireAdmin();
  if (DEMO_MODE) {
    revalidatePath('/requests');
    revalidatePath('/transactions');
    return;
  }

  const [requestsSnap, transactionsSnap] = await Promise.all([
    adminDb.collection('withdrawRequests').get(),
    adminDb.collection('transactions').where('status', '==', 'pending').get(),
  ]);

  const processedRequests = requestsSnap.docs.filter((doc) => {
    const status = doc.data().status;
    return status === 'approved' || status === 'rejected';
  });

  let batch = adminDb.batch();
  let count = 0;

  for (const reqDoc of processedRequests) {
    const req = reqDoc.data();
    const userId = req.userId ?? '';
    const amount = Number(req.amount) || 0;
    const requestStatus = req.status as string;
    const newTxnStatus = requestStatus === 'approved' ? 'completed' : 'rejected';
    const note = requestStatus === 'approved' ? 'سحب معتمد' : 'طلب سحب مرفوض';

    const linked = transactionsSnap.docs.find(
      (doc) => doc.data().withdrawRequestId === reqDoc.id,
    );
    if (linked) {
      batch.update(linked.ref, { status: newTxnStatus, note });
      count += 1;
      continue;
    }

    const match = transactionsSnap.docs.find((doc) => {
      const d = doc.data();
      if (d.userId !== userId || d.type !== 'withdraw' || d.status !== 'pending') return false;
      const txnAmount = Math.abs(Number(d.goldAmount) || Number(d.dinarAmount) || 0);
      return txnAmount === amount;
    });

    if (match) {
      batch.update(match.ref, { status: newTxnStatus, note });
      count += 1;
    }
  }

  if (count > 0) await batch.commit();

  revalidatePath('/requests');
  revalidatePath('/transactions');
}

/// Updates global app settings used by the mobile app.
export async function updateAppSettings(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    await requireAdmin();

    const appVersion = String(formData.get('appVersion') ?? '').trim();
    const supportWhatsapp = String(formData.get('supportWhatsapp') ?? '').trim();
    const chargeRequestNumber = String(formData.get('chargeRequestNumber') ?? '').trim();
    const iosAppUrl = String(formData.get('iosAppUrl') ?? '').trim();
    const googlePlayAppUrl = String(formData.get('googlePlayAppUrl') ?? '').trim();

    if (!appVersion) return { error: 'أدخل إصدار التطبيق' };
    if (!supportWhatsapp) return { error: 'أدخل رقم واتساب الدعم' };
    if (!chargeRequestNumber) return { error: 'أدخل رقم طلبات الشحن' };
    if (iosAppUrl && !/^https?:\/\//i.test(iosAppUrl)) {
      return { error: 'رابط تطبيق iOS يجب أن يبدأ بـ http:// أو https://' };
    }
    if (googlePlayAppUrl && !/^https?:\/\//i.test(googlePlayAppUrl)) {
      return { error: 'رابط تطبيق Google Play يجب أن يبدأ بـ http:// أو https://' };
    }

    if (DEMO_MODE) {
      revalidatePath('/settings');
      return { error: null };
    }

    await adminDb.doc('settings/app').set(
      {
        appVersion,
        supportWhatsapp,
        chargeRequestNumber,
        iosAppUrl,
        googlePlayAppUrl,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    revalidatePath('/settings');
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل حفظ الإعدادات';
    return { error: message };
  }
}

/// Sends a notification to a specific user or broadcasts to all users.
export async function sendNotification(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get('title') ?? '');
  const body = String(formData.get('body') ?? '');
  const userId = String(formData.get('userId') ?? '').trim();

  if (DEMO_MODE) {
    revalidatePath('/notifications');
    return;
  }

  if (userId) {
    await adminDb.collection('notifications').add({
      userId,
      title,
      body,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    const users = await adminDb.collection('users').select().get();
    let batch = adminDb.batch();
    let count = 0;
    for (const doc of users.docs) {
      const ref = adminDb.collection('notifications').doc();
      batch.set(ref, {
        userId: doc.id,
        title,
        body,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      count += 1;
      if (count % 400 === 0) {
        await batch.commit();
        batch = adminDb.batch();
      }
    }
    await batch.commit();
  }
  revalidatePath('/notifications');
}
