export const CATEGORY_DURATION_MONTHS = 24; // Fallback for existing unconfigured records.

export function validateInvestmentPrice(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) {
    return 'أدخل سعر استثمار صحيحاً أكبر من صفر';
  }
  return null;
}

export function formatCategoryDuration(months: number = CATEGORY_DURATION_MONTHS): string {
  if (months === 1) return 'شهر واحد';
  if (months === 3) return '3 أشهر';
  if (months === 9) return '9 أشهر';
  if (months === 24) return 'سنتان';
  if (months === 12) return 'سنة واحدة';
  return `${months} شهراً`;
}


export const MONTHLY_PAYOUT_MODEL = 'monthly_capital_and_profit' as const;


export function validateMonthlyTerms(capital: number, months: number, total: number): string | null {
  const priceError = validateInvestmentPrice(capital);
  if (priceError) return priceError;
  if (!Number.isInteger(months) || months < 1 || months > 120) return 'المدة يجب أن تكون بين شهر و120 شهراً';
  if (!Number.isFinite(total) || total < capital) return 'الإجمالي المتوقع يجب أن يشمل رأس المال وألا يقل عنه';
  // Monetary values are stored at two decimal places; calculations use integer minor units.
  for (const value of [capital, total]) {
    const units = Math.round(value * 100);
    if (!Number.isSafeInteger(units) || Math.abs(value * 100 - units) > 0.00001) {
      return 'أدخل مبلغاً صالحاً بمنزلتين عشريتين كحد أقصى';
    }
  }
  return null;
}

export function buildMonthlySchedule(capital: number, months: number, total: number) {
  const error = validateMonthlyTerms(capital, months, total);
  if (error) throw new Error(error);
  const capitalUnits = Math.round(capital * 100);
  const profitUnits = Math.round(total * 100) - capitalUnits;
  const capitalBase = Math.floor(capitalUnits / months);
  const profitBase = Math.floor(profitUnits / months);
  return Array.from({ length: months }, (_, index) => {
    const last = index === months - 1;
    const principal = last ? capitalUnits - capitalBase * index : capitalBase;
    const profit = last ? profitUnits - profitBase * index : profitBase;
    return {
      month: index + 1,
      principal: principal / 100,
      expectedProfit: profit / 100,
      expectedPayment: (principal + profit) / 100,
      remainingCapital: last ? 0 : (capitalUnits - capitalBase * (index + 1)) / 100,
    };
  });
}

export function monthlyProfitRate(capital: number, months: number, total: number): number {
  return ((total - capital) / months / capital) * 100;
}

/** Keep the original UTC day anchor, clamping short months instead of overflowing. */
export function addCalendarMonths(start: Date, months: number): Date {
  const result = new Date(start);
  result.setUTCDate(1);
  result.setUTCMonth(start.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return result;
}


/** Admin enters net profit; stored totals include capital for existing consumers. */
export function monthlyTermsFromProfit(capital: number, months: number, profit: number) {
  const profitUnits = Math.round(profit * 100);
  if (!Number.isFinite(profit) || profit < 0 || !Number.isSafeInteger(profitUnits) ||
      Math.abs(profit * 100 - profitUnits) > 0.00001) {
    throw new Error('أدخل الربح المتوقع لكامل المدة بمنزلتين عشريتين كحد أقصى، ويمكن إدخال صفر');
  }
  const totalUnits = Math.round(capital * 100) + profitUnits;
  if (!Number.isSafeInteger(totalUnits)) throw new Error('إجمالي المبلغ أكبر من الحد المسموح');
  const expectedTotalReturn = totalUnits / 100;
  const error = validateMonthlyTerms(capital, months, expectedTotalReturn);
  if (error) throw new Error(error);
  return { minInvestment: capital, durationMonths: months, expectedTotalReturn };
}


/** The stored next date supports explicit rescheduling; older records use their calendar anchor. */
export function nextMonthlyPayoutDate(start: Date, month: number, nextDate?: Date): Date {
  if (nextDate && Number.isFinite(nextDate.getTime())) return nextDate;
  return addCalendarMonths(start, month);
}
