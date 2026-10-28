import { describe, it, expect } from 'vitest';
import {
  calculateSchemeResult,
  calculateAllSchemes,
  rankSchemes,
} from '../src/lib/savings-certificate/calculator';
import {
  toBanglaDigits,
  toEnglishDigits,
  parseLocalizedAmount,
  formatLakhCrore,
  formatCurrency,
  formatPercent,
  formatNumberInWords,
} from '../src/lib/savings-certificate/formatters';
import type {
  SchemeDefinition,
  RatePeriodData,
  TaxData,
  CalcInput,
} from '../src/lib/savings-certificate/types';

// Mock test data matching official rates
const mockSchemes: SchemeDefinition[] = [
  {
    id: 'family',
    name: { bn: 'পরিবার সঞ্চয়পত্র', en: 'Family Savings Certificate' },
    termYears: 5,
    payoutType: 'monthly',
    payoutFrequency: 'monthly',
    eligibility: { pensionerOnly: false },
    purchaseLimits: {
      individual: { max: 4500000 },
      joint: { max: null },
      minPurchase: 10000,
    },
    rateTierThreshold: 750000,
    encashment: { allowedBeforeMaturity: true },
  },
  {
    id: 'pensioner',
    name: { bn: 'পেনশনার সঞ্চয়পত্র', en: 'Pensioner Savings Certificate' },
    termYears: 5,
    payoutType: 'quarterly',
    payoutFrequency: 'quarterly',
    eligibility: { pensionerOnly: true },
    purchaseLimits: {
      individual: { max: 5000000 },
      joint: { max: null },
      minPurchase: 50000,
    },
    rateTierThreshold: 750000,
    encashment: { allowedBeforeMaturity: true },
  },
  {
    id: 'profit_3month',
    name: { bn: '৩ মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র', en: '3-Month Profit-Bearing Savings Certificate' },
    termYears: 3,
    payoutType: 'quarterly',
    payoutFrequency: 'quarterly',
    eligibility: { pensionerOnly: false },
    purchaseLimits: {
      individual: { max: 3000000 },
      joint: { max: 6000000 },
      minPurchase: 100000,
    },
    rateTierThreshold: 750000,
    encashment: { allowedBeforeMaturity: true },
  },
  {
    id: 'bangladesh_5yr',
    name: { bn: '৫ বছর মেয়াদী বাংলাদেশ সঞ্চয়পত্র', en: '5-Year Bangladesh Savings Certificate' },
    termYears: 5,
    payoutType: 'at_maturity',
    payoutFrequency: null,
    eligibility: { pensionerOnly: false },
    purchaseLimits: {
      individual: { max: 3000000 },
      joint: { max: 6000000 },
      minPurchase: 10,
    },
    rateTierThreshold: 750000,
    encashment: { allowedBeforeMaturity: true },
  },
];

const mockRates: RatePeriodData = {
  meta: {
    schemaVersion: '1.0.0',
    dataVersion: '2026-07-01.1',
    lastVerified: '2026-10-19',
    sources: [{ title: 'Official', url: 'https://nationalsavings.gov.bd', type: 'official-site' }],
  },
  periodId: '2026-H2',
  effectiveFrom: '2026-07-01',
  effectiveTo: '2026-12-31',
  currency: 'BDT',
  tierThreshold: 750000,
  tierMode: 'excess_only',
  schemes: {
    family: {
      rateAtOrBelowThreshold: 11.93,
      rateAboveThreshold: 11.80,
      earlyEncashment: [
        { afterFullYears: 1, rateAtOrBelowThreshold: 9.81, rateAboveThreshold: 9.72 },
        { afterFullYears: 2, rateAtOrBelowThreshold: 10.29, rateAboveThreshold: 10.19 },
        { afterFullYears: 3, rateAtOrBelowThreshold: 10.80, rateAboveThreshold: 10.70 },
        { afterFullYears: 4, rateAtOrBelowThreshold: 11.35, rateAboveThreshold: 11.23 },
        { afterFullYears: 5, rateAtOrBelowThreshold: 11.93, rateAboveThreshold: 11.80 },
      ],
    },
    pensioner: {
      rateAtOrBelowThreshold: 11.98,
      rateAboveThreshold: 11.80,
      earlyEncashment: [
        { afterFullYears: 1, rateAtOrBelowThreshold: 9.84, rateAboveThreshold: 9.72 },
        { afterFullYears: 2, rateAtOrBelowThreshold: 10.32, rateAboveThreshold: 10.19 },
        { afterFullYears: 3, rateAtOrBelowThreshold: 10.84, rateAboveThreshold: 10.70 },
        { afterFullYears: 4, rateAtOrBelowThreshold: 11.39, rateAboveThreshold: 11.23 },
        { afterFullYears: 5, rateAtOrBelowThreshold: 11.98, rateAboveThreshold: 11.80 },
      ],
    },
    profit_3month: {
      rateAtOrBelowThreshold: 11.82,
      rateAboveThreshold: 11.77,
      earlyEncashment: [
        { afterFullYears: 1, rateAtOrBelowThreshold: 10.65, rateAboveThreshold: 10.60 },
        { afterFullYears: 2, rateAtOrBelowThreshold: 11.22, rateAboveThreshold: 11.16 },
        { afterFullYears: 3, rateAtOrBelowThreshold: 11.82, rateAboveThreshold: 11.77 },
      ],
    },
    bangladesh_5yr: {
      rateAtOrBelowThreshold: 11.83,
      rateAboveThreshold: 11.80,
      earlyEncashment: [
        { afterFullYears: 1, rateAtOrBelowThreshold: 9.74, rateAboveThreshold: 9.72 },
        { afterFullYears: 2, rateAtOrBelowThreshold: 10.21, rateAboveThreshold: 10.19 },
        { afterFullYears: 3, rateAtOrBelowThreshold: 10.72, rateAboveThreshold: 10.70 },
        { afterFullYears: 4, rateAtOrBelowThreshold: 11.26, rateAboveThreshold: 11.23 },
        { afterFullYears: 5, rateAtOrBelowThreshold: 11.83, rateAboveThreshold: 11.80 },
      ],
    },
  },
};

const mockTax: TaxData = {
  meta: {
    schemaVersion: '1.0.0',
    dataVersion: '2026-07-01.1',
    lastVerified: '2026-10-19',
    sources: [{ title: 'NBR', url: 'https://nbr.gov.bd', type: 'gazette' }],
  },
  rules: [
    {
      effectiveFrom: '2023-07-01',
      effectiveTo: null,
      sourceTax: [
        { upToInvestment: 500000, rate: 5.0, appliesTo: 'whole_profit' },
        { above: 500000, rate: 10.0, appliesTo: 'whole_profit' },
      ],
      pensionerExemptUpTo: 500000,
      measuredOn: 'holder_total',
    },
  ],
};

describe('Savings Certificate Golden Worked Examples', () => {
  it('calculates 1 Lakh Family Certificate correctly (Official worked example)', () => {
    const input: CalcInput = { amount: 100000, purchaseDate: '2026-08-01', isPensioner: false };
    const family = mockSchemes.find((s) => s.id === 'family')!;
    const res = calculateSchemeResult(family, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    // Gross annual = 100,000 * 11.93% = 11,930 Tk
    // 5-year gross = 59,650 Tk
    expect(res.grossProfit).toBe(59650);
    // 5% tax on ≤ 5 Lakh: 59,650 * 0.05 = 2,982.5 -> 2,983 Tk
    expect(res.taxDeducted).toBe(2983);
    // Net profit = 59,650 - 2,983 = 56,667 Tk
    expect(res.netProfit).toBe(56667);
    // Monthly payout: 11,930 / 12 = 994 Tk gross, ~50 Tk tax = 944 Tk net
    expect(res.periodicPayout?.grossPerPayout).toBe(994);
    expect(res.periodicPayout?.netPerPayout).toBe(944);
    expect(res.effectiveAnnualYield).toBeCloseTo(11.33, 1);
  });

  it('calculates 1 Lakh Pensioner Certificate with 0% tax exemption', () => {
    const input: CalcInput = { amount: 100000, purchaseDate: '2026-08-01', isPensioner: true };
    const pensioner = mockSchemes.find((s) => s.id === 'pensioner')!;
    const res = calculateSchemeResult(pensioner, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    // 100,000 * 11.98% * 5 = 59,900 Tk gross
    expect(res.grossProfit).toBe(59900);
    // 0% tax for pensioner <= 500,000
    expect(res.taxDeducted).toBe(0);
    expect(res.netProfit).toBe(59900);
    // Quarterly payout: 11,980 / 4 = 2,995 Tk net
    expect(res.periodicPayout?.netPerPayout).toBe(2995);
    expect(res.effectiveAnnualYield).toBe(11.98);
  });

  it('calculates 1 Lakh 3-Month Profit-Bearing Certificate correctly', () => {
    const input: CalcInput = { amount: 100000, purchaseDate: '2026-08-01', isPensioner: false };
    const scheme = mockSchemes.find((s) => s.id === 'profit_3month')!;
    const res = calculateSchemeResult(scheme, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    // Term = 3 years. Annual gross = 11,820 Tk. Total gross = 35,460 Tk.
    expect(res.grossProfit).toBe(35460);
    // 5% tax = 1,773 Tk. Net = 33,687 Tk.
    expect(res.taxDeducted).toBe(1773);
    expect(res.netProfit).toBe(33687);
    // Quarterly: 2,955 gross, 148 tax, 2,807 net
    expect(res.periodicPayout?.grossPerPayout).toBe(2955);
    expect(res.periodicPayout?.netPerPayout).toBe(2807);
  });

  it('calculates 1 Lakh 5-Year Bangladesh Certificate (At Maturity)', () => {
    const input: CalcInput = { amount: 100000, purchaseDate: '2026-08-01', isPensioner: false };
    const scheme = mockSchemes.find((s) => s.id === 'bangladesh_5yr')!;
    const res = calculateSchemeResult(scheme, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    // 100,000 * 11.83% * 5 = 59,150 Tk gross
    expect(res.grossProfit).toBe(59150);
    // 5% tax = 2,958 Tk. Net = 56,192 Tk
    expect(res.taxDeducted).toBe(2958);
    expect(res.netProfit).toBe(56192);
    expect(res.totalAtMaturity).toBe(156192);
    expect(res.periodicPayout).toBeUndefined();
  });
});

describe('Tier Boundaries (7,50,000 Threshold)', () => {
  it('applies tier 1 rate strictly at or below 7,50,000', () => {
    const input: CalcInput = { amount: 750000, purchaseDate: '2026-08-01', isPensioner: false };
    const family = mockSchemes.find((s) => s.id === 'family')!;
    const res = calculateSchemeResult(family, mockRates, mockTax, input);

    expect(res.appliedRatePercent?.weightedAverage).toBe(11.93);
    // 750,000 > 500,000 so tax is 10%
    expect(res.appliedTaxRatePercent).toBe(10);
  });

  it('applies excess_only rate for 1 Taka above threshold (7,50,001)', () => {
    const input: CalcInput = { amount: 750001, purchaseDate: '2026-08-01', isPensioner: false };
    const family = mockSchemes.find((s) => s.id === 'family')!;
    const res = calculateSchemeResult(family, mockRates, mockTax, input);

    expect(res.appliedRatePercent?.tier1).toBe(11.93);
    expect(res.appliedRatePercent?.tier2).toBe(11.80);
    // Weighted rate will be just slightly below 11.93
    expect(res.appliedRatePercent?.weightedAverage).toBeCloseTo(11.93, 2);
  });

  it('calculates excess_only accurately for 10 Lakh (7.5L at 11.93% + 2.5L at 11.80%)', () => {
    const input: CalcInput = { amount: 1000000, purchaseDate: '2026-08-01', isPensioner: false };
    const family = mockSchemes.find((s) => s.id === 'family')!;
    const res = calculateSchemeResult(family, mockRates, mockTax, input);

    // 750,000 * 0.1193 = 89,475
    // 250,000 * 0.1180 = 29,500
    // Annual gross = 118,975 Tk
    // 5-year gross = 594,875 Tk
    expect(res.grossProfit).toBe(594875);
    // 10% tax = 59,488 Tk
    expect(res.taxDeducted).toBe(59488);
    expect(res.netProfit).toBe(535387);
  });

  it('supports whole_amount mode when configured', () => {
    const wholeAmountRates: RatePeriodData = {
      ...mockRates,
      tierMode: 'whole_amount',
    };
    const input: CalcInput = { amount: 1000000, purchaseDate: '2026-08-01', isPensioner: false };
    const family = mockSchemes.find((s) => s.id === 'family')!;
    const res = calculateSchemeResult(family, wholeAmountRates, mockTax, input);

    // Entire 10 Lakh at 11.80%
    // Annual gross = 118,000 Tk; 5-year = 590,000 Tk
    expect(res.grossProfit).toBe(590000);
    expect(res.appliedRatePercent?.weightedAverage).toBe(11.80);
  });
});

describe('Tax Boundaries (5,00,000 Threshold & Pensioner Exemption)', () => {
  it('charges 5% tax at exactly 5,00,000 for non-pensioner', () => {
    const input: CalcInput = { amount: 500000, purchaseDate: '2026-08-01', isPensioner: false };
    const scheme = mockSchemes.find((s) => s.id === 'bangladesh_5yr')!;
    const res = calculateSchemeResult(scheme, mockRates, mockTax, input);

    expect(res.appliedTaxRatePercent).toBe(5);
  });

  it('charges 10% tax for 1 Taka above 5,00,000 (5,00,001)', () => {
    const input: CalcInput = { amount: 500001, purchaseDate: '2026-08-01', isPensioner: false };
    const scheme = mockSchemes.find((s) => s.id === 'bangladesh_5yr')!;
    const res = calculateSchemeResult(scheme, mockRates, mockTax, input);

    expect(res.appliedTaxRatePercent).toBe(10);
  });

  it('exempts pensioner certificate up to 5,00,000, but charges 10% above 5,00,000', () => {
    const p1: CalcInput = { amount: 500000, purchaseDate: '2026-08-01', isPensioner: true };
    const p2: CalcInput = { amount: 600000, purchaseDate: '2026-08-01', isPensioner: true };
    const pensioner = mockSchemes.find((s) => s.id === 'pensioner')!;

    const res1 = calculateSchemeResult(pensioner, mockRates, mockTax, p1);
    expect(res1.appliedTaxRatePercent).toBe(0);
    expect(res1.taxDeducted).toBe(0);

    const res2 = calculateSchemeResult(pensioner, mockRates, mockTax, p2);
    expect(res2.appliedTaxRatePercent).toBe(10);
    expect(res2.taxDeducted).toBeGreaterThan(0);
  });
});

describe('Ceilings and Eligibility Enforcement', () => {
  it('marks pensioner scheme ineligible when isPensioner is false', () => {
    const input: CalcInput = { amount: 200000, purchaseDate: '2026-08-01', isPensioner: false };
    const pensioner = mockSchemes.find((s) => s.id === 'pensioner')!;
    const res = calculateSchemeResult(pensioner, mockRates, mockTax, input);

    expect(res.eligible).toBe(false);
    expect(res.ineligibleReason?.bn).toContain('অবসরপ্রাপ্ত');
  });

  it('marks scheme ineligible if amount exceeds individual ceiling', () => {
    const input: CalcInput = { amount: 3500000, purchaseDate: '2026-08-01', isPensioner: false };
    // 3-Month Profit scheme has max 30 Lakh individual ceiling
    const scheme = mockSchemes.find((s) => s.id === 'profit_3month')!;
    const res = calculateSchemeResult(scheme, mockRates, mockTax, input);

    expect(res.eligible).toBe(false);
    expect(res.ineligibleReason?.bn).toContain('সর্বোচ্চ');
  });

  it('marks scheme ineligible if amount is below minimum purchase', () => {
    const input: CalcInput = { amount: 50000, purchaseDate: '2026-08-01', isPensioner: false };
    // 3-Month Profit scheme has min 1 Lakh
    const scheme = mockSchemes.find((s) => s.id === 'profit_3month')!;
    const res = calculateSchemeResult(scheme, mockRates, mockTax, input);

    expect(res.eligible).toBe(false);
    expect(res.ineligibleReason?.bn).toContain('সর্বনিম্ন');
  });
});

describe('Denomination / Investable Amount', () => {
  const withDenoms = (id: string, denominations: number[]): SchemeDefinition => {
    const base = mockSchemes.find((s) => s.id === id)!;
    return { ...base, purchaseLimits: { ...base.purchaseLimits, denominations } };
  };

  const family = withDenoms('family', [10000, 20000, 50000, 100000, 200000, 500000, 1000000]);
  const pensioner = withDenoms('pensioner', [50000, 100000, 200000, 500000, 1000000]);
  const bangladesh = withDenoms('bangladesh_5yr', [
    10, 50, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000,
  ]);

  it('trims a non-multiple amount down to the nearest investable amount (356,800 → 350,000 for Family)', () => {
    const input: CalcInput = { amount: 356800, purchaseDate: '2026-08-01', isPensioner: false };
    const res = calculateSchemeResult(family, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    expect(res.requestedAmount).toBe(356800);
    expect(res.investableAmount).toBe(350000);
  });

  it('bases the calculations on the investable amount, not the requested amount', () => {
    const trimmed: CalcInput = { amount: 356800, purchaseDate: '2026-08-01', isPensioner: false };
    const exact: CalcInput = { amount: 350000, purchaseDate: '2026-08-01', isPensioner: false };
    const resTrimmed = calculateSchemeResult(family, mockRates, mockTax, trimmed);
    const resExact = calculateSchemeResult(family, mockRates, mockTax, exact);

    expect(resTrimmed.netProfit).toBe(resExact.netProfit);
    expect(resTrimmed.totalAtMaturity).toBe(resExact.totalAtMaturity);
  });

  it('keeps an exact multiple unchanged (360,000 Family)', () => {
    const input: CalcInput = { amount: 360000, purchaseDate: '2026-08-01', isPensioner: false };
    const res = calculateSchemeResult(family, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    expect(res.investableAmount).toBe(360000);
  });

  it('trims to the 50,000 step for Pensioner (125,000 → 100,000)', () => {
    const input: CalcInput = { amount: 125000, purchaseDate: '2026-08-01', isPensioner: true };
    const res = calculateSchemeResult(pensioner, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    expect(res.investableAmount).toBe(100000);
  });

  it('keeps 356,800 for the 5-Year Bangladesh scheme (sold in multiples of 10)', () => {
    const input: CalcInput = { amount: 356800, purchaseDate: '2026-08-01', isPensioner: false };
    const res = calculateSchemeResult(bangladesh, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    expect(res.investableAmount).toBe(356800);
  });

  it('leaves the amount untouched when a scheme defines no denominations', () => {
    const input: CalcInput = { amount: 356800, purchaseDate: '2026-08-01', isPensioner: false };
    const noDenoms = mockSchemes.find((s) => s.id === 'family')!;
    const res = calculateSchemeResult(noDenoms, mockRates, mockTax, input);

    expect(res.eligible).toBe(true);
    expect(res.investableAmount).toBe(356800);
  });
});

describe('Early Encashment Schedule', () => {
  it('generates non-empty early encashment schedule with net receivable', () => {
    const input: CalcInput = { amount: 500000, purchaseDate: '2026-08-01', isPensioner: false };
    const family = mockSchemes.find((s) => s.id === 'family')!;
    const res = calculateSchemeResult(family, mockRates, mockTax, input);

    expect(res.earlyEncashment).toBeDefined();
    expect(res.earlyEncashment?.length).toBe(5);
    // Year 1 should have lower rate than year 5
    const yr1 = res.earlyEncashment![0];
    const yr5 = res.earlyEncashment![4];
    expect(yr1.ratePercent).toBe(9.81);
    expect(yr5.ratePercent).toBe(11.93);
    // Net receivable should be valid number
    expect(yr1.netReceivable).toBeGreaterThan(0);
  });
});

describe('Ranking and Ineligible Placement', () => {
  it('places ineligible schemes strictly at the bottom regardless of sorting', () => {
    const input: CalcInput = { amount: 200000, purchaseDate: '2026-08-01', isPensioner: false };
    const all = calculateAllSchemes(mockSchemes, mockRates, mockTax, input);
    const ranked = rankSchemes(all, 'net');

    const last = ranked[ranked.length - 1];
    expect(last.schemeId).toBe('pensioner');
    expect(last.eligible).toBe(false);
  });
});

describe('Formatting & Localization Utilities', () => {
  it('converts Bengali and English digits bidirectionally', () => {
    expect(toBanglaDigits('1234567890')).toBe('১২৩৪৫৬৭৮৯০');
    expect(toEnglishDigits('১২৩৪৫৬৭৮৯০')).toBe('1234567890');
  });

  it('parses localized amounts with mixed digits, commas, and spaces', () => {
    expect(parseLocalizedAmount('৫,০০,০০০')).toBe(500000);
    expect(parseLocalizedAmount('7,50,000')).toBe(750000);
    expect(parseLocalizedAmount('১০ লক্ষ')).toBe(10);
  });

  it('formats with South Asian lakh and crore comma separation', () => {
    expect(formatLakhCrore(1234567, 'en')).toBe('12,34,567');
    expect(formatLakhCrore(1234567, 'bn')).toBe('১২,৩৪,৫৬৭');
    expect(formatLakhCrore(10000000, 'bn')).toBe('১,০০,০০,০০০');
  });

  it('formats numbers into human readable words', () => {
    expect(formatNumberInWords(500000, 'bn')).toBe('৫ লক্ষ টাকা');
    expect(formatNumberInWords(750000, 'bn')).toBe('৭ লক্ষ ৫০ হাজার টাকা');
    expect(formatNumberInWords(10000000, 'bn')).toBe('১ কোটি টাকা');
    expect(formatNumberInWords(500000, 'en')).toBe('5 Lakh Taka');
  });

  it('formats percentages with localized digits', () => {
    expect(formatPercent(11.93, 'bn')).toBe('১১.৯৩%');
    expect(formatPercent(11.93, 'en')).toBe('11.93%');
  });
});
