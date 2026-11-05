/** Prefixes for Iraqi local/international phone numbers stored in older profiles. */
export function phoneSearchPrefixes(input: string): string[] {
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/[\s().-]/g, '');
  if (!/^\+?\d{3,15}$/.test(normalized))
    throw new Error('أدخل رقم هاتف صالحاً (3 أرقام على الأقل)');
  const digits = normalized.replace(/^\+/, '');
  let national: string | undefined;
  if (digits.startsWith('00964')) national = digits.slice(5);
  else if (digits.startsWith('964')) national = digits.slice(3);
  else if (digits.startsWith('07')) national = digits.slice(1);
  else if (digits.startsWith('7')) national = digits;
  const prefixes = [normalized];
  if (national?.startsWith('7'))
    prefixes.push(
      `0${national}`,
      national,
      `+964${national}`,
      `964${national}`,
      `00964${national}`,
    );
  return [...new Set(prefixes)];
}
