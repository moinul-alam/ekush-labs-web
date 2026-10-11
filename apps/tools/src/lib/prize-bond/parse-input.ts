/**
 * Bangla digit to English digit conversion mapping
 */
const BANGLA_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/**
 * Converts all Bengali digits in a string to English digits.
 */
export function banglaToEnglishDigits(str: string): string {
  return str.replace(/[০-৯]/g, (d) => BANGLA_DIGITS[d] || d);
}

/**
 * Converts English digits to Bengali digits.
 */
export function englishToBanglaDigits(str: string | number): string {
  const strVal = String(str);
  const DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return strVal.replace(/[0-9]/g, (d) => DIGITS[parseInt(d, 10)] || d);
}

export interface ParseResult {
  validNumbers: string[]; // Deduplicated 7-digit strings (e.g. "0806964")
  ignoredEntries: Array<{ raw: string; reason: string }>;
  duplicateCount: number;
}

/**
 * Cleans and tokenizes text input (separated by comma, semicolon, space, newline, tab, Bangla comma, etc.).
 * Normalizes digits, strips zero-width chars and BOM, validates 7-digit length, and deduplicates.
 */
export function parseTextInput(rawText: string): ParseResult {
  if (!rawText || !rawText.trim()) {
    return { validNumbers: [], ignoredEntries: [], duplicateCount: 0 };
  }

  // Strip zero-width characters (ZWNJ, ZWJ, BOM, NBSP)
  const sanitized = rawText
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    // Replace separators: commas, bangla comma (। / ,), semicolons, colons, newlines, tabs
    .replace(/[,;।|:\n\r\t]/g, ' ');

  // Tokenize by whitespace
  const tokens = sanitized.split(/\s+/).filter(Boolean);

  const seen = new Set<string>();
  const validNumbers: string[] = [];
  const ignoredEntries: Array<{ raw: string; reason: string }> = [];
  let duplicateCount = 0;

  for (const token of tokens) {
    const rawClean = token.trim();
    if (!rawClean) continue;

    // Convert any Bengali digits to English
    const converted = banglaToEnglishDigits(rawClean);

    // Strip optional Bangla series prefix if the user typed e.g. "ক 0123456" or "ক-0123456"
    // Match key in Bangladesh Bank is the 7-digit number
    const numericPart = converted.replace(/^[^\d]+/, '').replace(/[^\d]+$/, '');

    // Check if numericPart is pure digits
    if (!/^\d+$/.test(numericPart)) {
      ignoredEntries.push({ raw: rawClean, reason: 'Invalid characters / অকার্যকর অক্ষর' });
      continue;
    }

    // Must be up to 7 digits. If fewer than 7 digits, zero-pad to 7 digits
    if (numericPart.length > 7) {
      ignoredEntries.push({ raw: rawClean, reason: 'Length exceeds 7 digits / ৭ ডিজিটের বেশি' });
      continue;
    }

    const padded = numericPart.padStart(7, '0');

    if (seen.has(padded)) {
      duplicateCount++;
    } else {
      seen.add(padded);
      validNumbers.push(padded);
    }
  }

  return {
    validNumbers,
    ignoredEntries,
    duplicateCount,
  };
}

export interface RangeResult {
  numbers: string[];
  count: number;
  error?: string;
}

const MAX_RANGE_LIMIT = 200000;

/**
 * Expands numeric range [from, to] into 7-digit strings with bounds checks.
 */
export function expandRange(rawFrom: string, rawTo: string, limit: number = MAX_RANGE_LIMIT): RangeResult {
  const cleanFrom = banglaToEnglishDigits(rawFrom.trim()).replace(/\D/g, '');
  const cleanTo = banglaToEnglishDigits(rawTo.trim()).replace(/\D/g, '');

  if (!cleanFrom || !cleanTo) {
    return { numbers: [], count: 0, error: 'Both From and To values are required.' };
  }

  const fromNum = parseInt(cleanFrom, 10);
  const toNum = parseInt(cleanTo, 10);

  if (isNaN(fromNum) || isNaN(toNum)) {
    return { numbers: [], count: 0, error: 'Invalid numeric boundaries.' };
  }

  if (fromNum > toNum) {
    return { numbers: [], count: 0, error: '"From" number cannot be greater than "To" number.' };
  }

  const totalCount = toNum - fromNum + 1;

  if (totalCount > limit) {
    return {
      numbers: [],
      count: totalCount,
      error: `Range of ${totalCount.toLocaleString()} exceeds the maximum limit of ${limit.toLocaleString()} numbers.`,
    };
  }

  const numbers: string[] = [];
  for (let i = fromNum; i <= toNum; i++) {
    numbers.push(i.toString().padStart(7, '0'));
  }

  return { numbers, count: totalCount };
}
