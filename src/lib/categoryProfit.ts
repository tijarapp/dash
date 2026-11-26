export const CATEGORY_DURATION_MONTHS = 24; // Fallback for existing unconfigured records.

/** Profit for the whole duration, as a percentage of the invested capital. */
export const MIN_PROFIT_PERCENT = 1;
export const MAX_PROFIT_PERCENT = 100;
export const PROFIT_PERCENT_STEP = 0.5;

export function validateInvestmentPrice(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) {
    return 'أدخل سعر استثمار صحيحاً أكبر من صفر';
  }
  return null;
}

export function validateProfitPercent(value: number): string | null {
  if (!Number.isFinite(value) || value < MIN_PROFIT_PERCENT || value > MAX_PROFIT_PERCENT) {
    return `نسبة الربح يجب أن تكون بين ${MIN_PROFIT_PERCENT}% و${MAX_PROFIT_PERCENT}%`;
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

/**
 * Profit (minor units) earned through `month` at a constant percentage.
 * Mirrors `profitUnitsThrough` in the claim Cloud Function so the preview
 * matches what investors actually receive while the rate is unchanged.
 */
function profitUnitsThrough(capitalUnits: number, months: number, percent: number, month: number): number {
  return Math.round((capitalUnits * (percent * month)) / (100 * months));
}

/** Admin picks a percentage; the stored total keeps capital + profit for existing consumers. */
export function monthlyTermsFromPercent(capital: number, months: number, percent: number) {
  const percentError = validateProfitPercent(percent);
  if (percentError) throw new Error(percentError);
  const priceError = validateInvestmentPrice(capital);
  if (priceError) throw new Error(priceError);
  if (!Number.isInteger(months) || months < 1 || months > 120) throw new Error('المدة يجب أن تكون بين شهر و120 شهراً');
  const capitalUnits = Math.round(capital * 100);
  const totalUnits = capitalUnits + profitUnitsThrough(capitalUnits, months, percent, months);
  if (!Number.isSafeInteger(totalUnits)) throw new Error('إجمالي المبلغ أكبر من الحد المسموح');
  const expectedTotalReturn = totalUnits / 100;
  const error = validateMonthlyTerms(capital, months, expectedTotalReturn);
  if (error) throw new Error(error);
  return { minInvestment: capital, durationMonths: months, profitPercent: percent, expectedTotalReturn };
}

/** Projected monthly claims at a constant percentage. */
export function buildMonthlySchedule(capital: number, months: number, percent: number) {
  monthlyTermsFromPercent(capital, months, percent);
  const capitalUnits = Math.round(capital * 100);
  const capitalBase = Math.floor(capitalUnits / months);
  return Array.from({ length: months }, (_, index) => {
    const last = index === months - 1;
    const principal = last ? capitalUnits - capitalBase * index : capitalBase;
    const profit = profitUnitsThrough(capitalUnits, months, percent, index + 1) -
      profitUnitsThrough(capitalUnits, months, percent, index);
    return {
      month: index + 1,
      principal: principal / 100,
      expectedProfit: profit / 100,
      expectedPayment: (principal + profit) / 100,
      remainingCapital: last ? 0 : (capitalUnits - capitalBase * (index + 1)) / 100,
    };
  });
}

/** Snaps a percentage to the slider's step and allowed range. */
export function clampProfitPercent(percent: number): number {
  if (!Number.isFinite(percent)) return MIN_PROFIT_PERCENT;
  const stepped = Math.round(percent / PROFIT_PERCENT_STEP) * PROFIT_PERCENT_STEP;
  return Math.min(MAX_PROFIT_PERCENT, Math.max(MIN_PROFIT_PERCENT, stepped));
}

/** Percentage for categories saved before the slider: derived from their stored total. */
export function percentFromTotal(capital: number, total: number | undefined): number {
  if (!Number.isFinite(capital) || capital <= 0 || total === undefined || !Number.isFinite(total)) return MIN_PROFIT_PERCENT;
  return clampProfitPercent(((total - capital) / capital) * 100);
}


/** Free (trial) investment: no capital is paid or returned, only a fixed monthly return. */
export const FREE_PAYOUT_MODEL = 'free_monthly_return' as const;

export function freeTermsFromMonthlyReturn(monthlyReturn: number, months: number) {
  if (!Number.isFinite(monthlyReturn) || monthlyReturn <= 0) throw new Error('أدخل عائداً شهرياً أكبر من صفر');
  const units = Math.round(monthlyReturn * 100);
  if (!Number.isSafeInteger(units) || Math.abs(monthlyReturn * 100 - units) > 0.00001) {
    throw new Error('أدخل مبلغاً صالحاً بمنزلتين عشريتين كحد أقصى');
  }
  if (!Number.isInteger(months) || months < 1 || months > 120) throw new Error('المدة يجب أن تكون بين شهر و120 شهراً');
  const total = Math.round(units * months) / 100;
  if (!Number.isSafeInteger(Math.round(total * 100))) throw new Error('إجمالي المبلغ أكبر من الحد المسموح');
  return { monthlyReturn, durationMonths: months, expectedTotalReturn: total };
}
