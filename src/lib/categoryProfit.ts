/** Daily profit must recover capital between 6 and 10 months. */
export const MIN_DAILY_PROFIT_RATE = 0.33; // capital / 300 days
export const MAX_DAILY_PROFIT_RATE = 0.55; // capital / 180 days
export const DEFAULT_DAILY_PROFIT_RATE = 0.45;
export const CATEGORY_DURATION_MONTHS = 24;

export function clampDailyProfitRate(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DAILY_PROFIT_RATE;
  return Math.min(MAX_DAILY_PROFIT_RATE, Math.max(MIN_DAILY_PROFIT_RATE, value));
}

export function validateDailyProfitRate(value: number): string | null {
  if (!Number.isFinite(value)) return 'أدخل نسبة ربح يومي صحيحة';
  if (value < MIN_DAILY_PROFIT_RATE) {
    return `نسبة الربح أقل من الحد الأدنى (${MIN_DAILY_PROFIT_RATE}%)`;
  }
  if (value > MAX_DAILY_PROFIT_RATE) {
    return `نسبة الربح أعلى من الحد الأقصى (${MAX_DAILY_PROFIT_RATE}%)`;
  }
  return null;
}

export function validateInvestmentPrice(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) {
    return 'أدخل سعر استثمار صحيحاً أكبر من صفر';
  }
  return null;
}

export function formatCategoryDuration(months: number = CATEGORY_DURATION_MONTHS): string {
  if (months === 24) return 'سنتان';
  if (months === 12) return 'سنة واحدة';
  return `${months} شهراً`;
}
