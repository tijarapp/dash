export const CHARGE_REASONS = [
  { value: 'wallet_top_up', label: 'شحن رصيد المحفظة' },
  { value: 'khair', label: 'شحن رصيد لشراء بطاقة بصمة خير' },
  { value: 'compensation', label: 'تعويض' },
  { value: 'reward', label: 'مكافأة' },
  { value: 'other', label: 'سبب آخر' },
] as const;

export function chargeReasonDetails(value: unknown, note: unknown) {
  const reason = CHARGE_REASONS.find((item) => item.value === value);
  if (!reason) throw new Error('اختر سبب شحن الرصيد');
  const details = typeof note === 'string' ? note.trim() : '';
  if (details.length > 500 || (reason.value === 'other' && !details))
    throw new Error('أدخل تفاصيل السبب (حتى 500 حرف)');
  return {
    chargeReason: reason.value,
    chargeReasonLabel: reason.label,
    chargeNote: details,
    reasonText: `${reason.label}${details ? ` — ${details}` : ''}`,
  };
}
