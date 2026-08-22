import type { WithdrawRow } from '@/lib/data';

export type WithdrawMethod = 'mastercard' | 'zaincash';

export function parseWithdrawMethod(value: unknown): WithdrawMethod {
  return value === 'zaincash' ? 'zaincash' : 'mastercard';
}

export function withdrawMethodLabel(method: WithdrawMethod): string {
  return method === 'zaincash' ? 'زين كاش' : 'ماستركارد';
}

export function withdrawAccountLabel(request: WithdrawRow): string {
  if (request.method === 'zaincash') {
    return request.holderName || '—';
  }
  return request.cardHolder || '—';
}

export function mapWithdrawDoc(
  id: string,
  d: Record<string, unknown>,
): Omit<WithdrawRow, 'createdAt'> {
  return {
    id,
    userId: String(d.userId ?? ''),
    amount: Number(d.amount) || 0,
    method: parseWithdrawMethod(d.method),
    cardHolder: String(d.cardHolder ?? ''),
    cardNumber: String(d.cardNumber ?? ''),
    swift: String(d.swift ?? ''),
    holderName: String(d.holderName ?? ''),
    phoneNumber: String(d.phoneNumber ?? ''),
    status: String(d.status ?? 'pending'),
    adminNote: d.adminNote != null ? String(d.adminNote) : null,
  };
}
