export const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Converts English digits (0-9) to Bengali digits (০-৯).
 */
export function toBanglaDigits(val: string | number): string {
  return String(val).replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)]);
}

/**
 * Converts Bengali digits to standard English digits.
 */
export function toEnglishDigits(val: string): string {
  return val.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/**
 * Strips formatting (commas, spaces, letters) and parses an amount from either English or Bengali digits.
 */
export function parseLocalizedAmount(input: string): number {
  if (!input) return 0;
  const enStr = toEnglishDigits(input).replace(/[^0-9]/g, '');
  if (!enStr) return 0;
  const num = parseInt(enStr, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number with South Asian grouping (lakh / crore commas):
 * e.g., 1234567 -> "12,34,567" (or "১২,৩৪,৫৬৭" in Bengali).
 */
export function formatLakhCrore(amount: number, lang: 'bn' | 'en' = 'bn'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return lang === 'bn' ? '০' : '0';

  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absStr = Math.abs(rounded).toString();

  let formatted = absStr;
  if (absStr.length > 3) {
    const last3 = absStr.substring(absStr.length - 3);
    const leading = absStr.substring(0, absStr.length - 3);
    const withCommas = leading.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = `${withCommas},${last3}`;
  }

  if (isNegative) formatted = `-${formatted}`;

  if (lang === 'bn') {
    return toBanglaDigits(formatted);
  }
  return formatted;
}

/**
 * Formats currency with currency symbol ৳ and optional suffix.
 */
export function formatCurrency(
  amount: number,
  lang: 'bn' | 'en' = 'bn',
  includeSymbol: boolean = true
): string {
  const formatted = formatLakhCrore(amount, lang);
  if (!includeSymbol) return formatted;
  return `৳ ${formatted}`;
}

/**
 * Formats a percentage value (e.g. 11.93 -> "11.93%" or "১১.৯৩%").
 */
export function formatPercent(
  num: number | null | undefined,
  lang: 'bn' | 'en' = 'bn',
  decimals: number = 2
): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  const fixed = num.toFixed(decimals);
  const withDigits = lang === 'bn' ? toBanglaDigits(fixed) : fixed;
  return `${withDigits}%`;
}

/**
 * Converts a large currency amount into a friendly human-readable words representation:
 * e.g. 750000 -> "৭ লক্ষ ৫০ হাজার টাকা" / "7.5 Lakh Taka"
 *      10000000 -> "১ কোটি টাকা" / "1 Crore Taka"
 */
export function formatNumberInWords(amount: number, lang: 'bn' | 'en' = 'bn'): string {
  if (!amount || amount <= 0) return '';

  const crore = Math.floor(amount / 10000000);
  const remCrore = amount % 10000000;
  const lakh = Math.floor(remCrore / 100000);
  const remLakh = remCrore % 100000;
  const thousand = Math.floor(remLakh / 1000);
  const remThousand = remLakh % 1000;

  if (lang === 'bn') {
    const parts: string[] = [];
    if (crore > 0) parts.push(`${toBanglaDigits(crore)} কোটি`);
    if (lakh > 0) parts.push(`${toBanglaDigits(lakh)} লক্ষ`);
    if (thousand > 0) parts.push(`${toBanglaDigits(thousand)} হাজার`);
    if (remThousand > 0) parts.push(`${toBanglaDigits(remThousand)}`);
    return parts.length > 0 ? `${parts.join(' ')} টাকা` : '';
  }

  // English words representation
  const parts: string[] = [];
  if (crore > 0) parts.push(`${crore} Crore`);
  if (lakh > 0) parts.push(`${lakh} Lakh`);
  if (thousand > 0) parts.push(`${thousand} Thousand`);
  if (remThousand > 0) parts.push(`${remThousand}`);
  return parts.length > 0 ? `${parts.join(' ')} Taka` : '';
}

/**
 * Formats ISO YYYY-MM-DD date into localized date string.
 */
export function formatDate(isoDate: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return isoDate;

  if (lang === 'bn') {
    const monthName = BN_MONTHS[month] || '';
    return `${toBanglaDigits(day)} ${monthName} ${toBanglaDigits(year)}`;
  }

  const monthName = EN_MONTHS[month] || '';
  return `${day} ${monthName} ${year}`;
}
