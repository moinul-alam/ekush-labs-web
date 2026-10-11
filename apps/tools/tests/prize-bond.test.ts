import { describe, it, expect } from 'vitest';
import { banglaToEnglishDigits, englishToBanglaDigits, parseTextInput, expandRange } from '../src/lib/prize-bond/parse-input';
import { checkBonds } from '../src/lib/prize-bond/matcher';
import type { WinItem } from '../src/lib/prize-bond/draw-store';

describe('Prize Bond Input Parsing', () => {
  it('converts Bengali digits to English digits accurately', () => {
    expect(banglaToEnglishDigits('০১২৩৪৫৬৭৮৯')).toBe('0123456789');
    expect(banglaToEnglishDigits('ক ০৮০৬৯৬৪')).toBe('ক 0806964');
  });

  it('converts English digits to Bengali digits accurately', () => {
    expect(englishToBanglaDigits('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
  });

  it('parses comma, space, newline separated values and pads short numbers', () => {
    const raw = '0806964, 144370\n০৩০৭৯৭৩ ; 0922432   ক-0578366';
    const result = parseTextInput(raw);

    expect(result.validNumbers).toContain('0806964');
    expect(result.validNumbers).toContain('0144370'); // padded to 7 digits
    expect(result.validNumbers).toContain('0307973');
    expect(result.validNumbers).toContain('0922432');
    expect(result.validNumbers).toContain('0578366');
    expect(result.validNumbers.length).toBe(5);
  });

  it('deduplicates repetitive inputs and counts duplicates', () => {
    const raw = '0806964, 0806964, 0806964, ০৮০৬৯৬৪';
    const result = parseTextInput(raw);

    expect(result.validNumbers).toEqual(['0806964']);
    expect(result.duplicateCount).toBe(3);
  });

  it('identifies and collects ignored invalid tokens', () => {
    const raw = '0806964, 12345678901, abcde';
    const result = parseTextInput(raw);

    expect(result.validNumbers).toEqual(['0806964']);
    expect(result.ignoredEntries.length).toBe(2);
  });
});

describe('Range Expansion', () => {
  it('expands sequential ranges correctly', () => {
    const result = expandRange('0001000', '0001005');
    expect(result.numbers.length).toBe(6);
    expect(result.numbers[0]).toBe('0001000');
    expect(result.numbers[5]).toBe('0001005');
  });

  it('rejects inverted range (from > to)', () => {
    const result = expandRange('0002000', '0001000');
    expect(result.error).toBeDefined();
    expect(result.numbers.length).toBe(0);
  });

  it('enforces maximum range cap', () => {
    const result = expandRange('0000000', '0300000', 200000);
    expect(result.error).toContain('exceeds the maximum limit');
  });
});

describe('Matcher Algorithm', () => {
  const mockIndex = new Map<string, WinItem[]>();
  mockIndex.set('0806964', [
    {
      drawId: '117',
      drawNumber: 117,
      date: '2024-10-31',
      tier: 1,
      amount: 600000,
      claimableUntil: '2026-10-28',
      isExpired: false,
    },
    {
      drawId: '116',
      drawNumber: 116,
      date: '2024-07-31',
      tier: 2,
      amount: 325000,
      claimableUntil: '2026-07-28',
      isExpired: false,
    },
  ]);

  mockIndex.set('0999999', [
    {
      drawId: '100',
      drawNumber: 100,
      date: '2020-01-31',
      tier: 5,
      amount: 10000,
      claimableUntil: '2022-01-31',
      isExpired: true,
    },
  ]);

  it('detects multiple wins across draws for a single bond', () => {
    const result = checkBonds(['0806964', '0000001'], mockIndex);

    expect(result.totalChecked).toBe(2);
    expect(result.totalWinnersCount).toBe(1);
    expect(result.totalPrizeAmount).toBe(925000);
    expect(result.matches[0].bondNumber).toBe('0806964');
    expect(result.matches[0].wins.length).toBe(2);
    expect(result.matches[0].hasExpiredOnly).toBe(false);
  });

  it('marks expired wins appropriately', () => {
    const result = checkBonds(['0999999'], mockIndex);

    expect(result.totalWinnersCount).toBe(1);
    expect(result.matches[0].hasExpiredOnly).toBe(true);
  });

  it('returns clean zero state when no bonds match', () => {
    const result = checkBonds(['0000001', '0000002'], mockIndex);

    expect(result.totalChecked).toBe(2);
    expect(result.totalWinnersCount).toBe(0);
    expect(result.totalPrizeAmount).toBe(0);
    expect(result.matches.length).toBe(0);
  });
});
