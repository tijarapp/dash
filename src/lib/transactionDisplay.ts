import type { TransactionRow } from './data';

export function transactionAmount(transaction: TransactionRow): number {
  return transaction.paymentMethod === 'points'
    ? (transaction.amount ?? 0)
    : transaction.dinarAmount;
}

export const khairTransactionLabels: Record<string, string> = {
  khair_purchase: 'شراء بطاقة بصمة خير',
  khair_refund: 'استرداد بصمة خير',
  khair_points_grant: 'إضافة نقاط بصمة خير',
};
