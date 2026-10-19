import type {
  CalcInput,
  SchemeDefinition,
  RatePeriodData,
  TaxData,
  SchemeResult,
  BreakdownStep,
  EarlyEncashmentResult,
  PeriodicPayoutResult,
  TaxRule,
} from './types';
import { formatCurrency, formatPercent } from './formatters';

/**
 * Resolves the applicable tax rule based on the purchase or payout date.
 */
export function resolveTaxRule(taxData: TaxData, dateIso: string): TaxRule {
  for (const rule of taxData.rules) {
    if (rule.effectiveFrom <= dateIso && (!rule.effectiveTo || rule.effectiveTo >= dateIso)) {
      return rule;
    }
  }
  // Default to the first (latest) rule if date precedes or follows
  return taxData.rules[0];
}

/**
 * Calculates rate and annual gross profit according to the tierMode.
 */
function calculateTierProfits(
  amount: number,
  threshold: number,
  tierMode: 'excess_only' | 'whole_amount',
  r1: number,
  r2: number
) {
  if (amount <= threshold) {
    const annualProfit = (amount * r1) / 100;
    return {
      tier1Amount: amount,
      tier2Amount: 0,
      annualProfit,
      weightedRate: r1,
      tier1Rate: r1,
      tier2Rate: r2,
    };
  }

  if (tierMode === 'whole_amount') {
    const annualProfit = (amount * r2) / 100;
    return {
      tier1Amount: 0,
      tier2Amount: amount,
      annualProfit,
      weightedRate: r2,
      tier1Rate: r1,
      tier2Rate: r2,
    };
  }

  // tierMode === 'excess_only'
  const tier1Amount = threshold;
  const tier2Amount = amount - threshold;
  const p1 = (tier1Amount * r1) / 100;
  const p2 = (tier2Amount * r2) / 100;
  const annualProfit = p1 + p2;
  const weightedRate = (annualProfit / amount) * 100;

  return {
    tier1Amount,
    tier2Amount,
    annualProfit,
    weightedRate,
    tier1Rate: r1,
    tier2Rate: r2,
  };
}

/**
 * Calculates result for a single scheme given input, rate period data, and tax data.
 */
export function calculateSchemeResult(
  scheme: SchemeDefinition,
  rateData: RatePeriodData,
  taxData: TaxData,
  input: CalcInput
): SchemeResult {
  const { amount, purchaseDate, isPensioner } = input;
  const warnings: string[] = [];
  const breakdown: BreakdownStep[] = [];

  const schemeRate = rateData.schemes[scheme.id];
  if (!schemeRate) {
    return {
      schemeId: scheme.id,
      scheme,
      eligible: false,
      ineligibleReason: {
        bn: 'এই সময়ের জন্য স্কিমটির মুনাফার হারের তথ্য পাওয়া যায়নি।',
        en: 'Rate information not available for this period.',
      },
      warnings: ['No rate definition found for scheme in active period.'],
      breakdown: [],
    };
  }

  // 1. Eligibility Checks
  if (scheme.eligibility.pensionerOnly && !isPensioner) {
    return {
      schemeId: scheme.id,
      scheme,
      eligible: false,
      ineligibleReason: {
        bn: 'এই সঞ্চয়পত্রটি কেবল অবসরপ্রাপ্ত কর্মকর্তা ও কর্মচারীদের জন্য।',
        en: 'Exclusively available to retired government and public-sector personnel.',
      },
      warnings: [],
      breakdown: [],
    };
  }

  const minPurchase = scheme.purchaseLimits.minPurchase;
  if (minPurchase !== null && amount < minPurchase) {
    return {
      schemeId: scheme.id,
      scheme,
      eligible: false,
      ineligibleReason: {
        bn: `সর্বনিম্ন ক্রয়ের পরিমাণ ${formatCurrency(minPurchase, 'bn')}।`,
        en: `Below minimum investment of ${formatCurrency(minPurchase, 'en')}.`,
      },
      warnings: [],
      breakdown: [],
    };
  }

  const maxIndividual = scheme.purchaseLimits.individual.max;
  if (maxIndividual !== null && amount > maxIndividual) {
    return {
      schemeId: scheme.id,
      scheme,
      eligible: false,
      ineligibleReason: {
        bn: `সর্বোচ্চ একক বিনিয়োগ সীমা ${formatCurrency(maxIndividual, 'bn')} অতিক্রম করেছে।`,
        en: `Exceeds maximum individual ceiling of ${formatCurrency(maxIndividual, 'en')}.`,
      },
      warnings: [],
      breakdown: [],
    };
  }

  // 2. Rate and Profit Calculations
  const threshold = scheme.rateTierThreshold || rateData.tierThreshold || 750000;
  const tierMode = rateData.tierMode || 'excess_only';
  const r1 = schemeRate.rateAtOrBelowThreshold;
  const r2 = schemeRate.rateAboveThreshold;

  const tierCalc = calculateTierProfits(amount, threshold, tierMode, r1, r2);
  const termYears = scheme.termYears;
  const totalGrossProfit = tierCalc.annualProfit * termYears;

  // 3. Tax Calculation
  const taxRule = resolveTaxRule(taxData, purchaseDate);
  let taxRatePercent = 0;

  if (scheme.id === 'pensioner' && amount <= taxRule.pensionerExemptUpTo) {
    taxRatePercent = 0;
  } else if (amount <= 500000) {
    taxRatePercent = 5.0;
  } else {
    taxRatePercent = 10.0;
  }

  const taxDeducted = Math.round((totalGrossProfit * taxRatePercent) / 100);
  const netProfit = Math.round(totalGrossProfit - taxDeducted);
  const totalAtMaturity = amount + netProfit;

  // 4. Effective Annual Yield (% on net return)
  // Annualized return = (netProfit / (amount * termYears)) * 100
  const effectiveAnnualYield = amount > 0 ? (netProfit / (amount * termYears)) * 100 : 0;

  // 5. Periodic Payout (for monthly / quarterly schemes)
  let periodicPayout: PeriodicPayoutResult | undefined;
  if (scheme.payoutType === 'monthly') {
    const totalPayouts = termYears * 12;
    const grossPerPayout = tierCalc.annualProfit / 12;
    const taxPerPayout = (grossPerPayout * taxRatePercent) / 100;
    const netPerPayout = grossPerPayout - taxPerPayout;
    periodicPayout = {
      frequency: 'monthly',
      grossPerPayout: Math.round(grossPerPayout),
      taxPerPayout: Math.round(taxPerPayout),
      netPerPayout: Math.round(netPerPayout),
      totalPayouts,
    };
  } else if (scheme.payoutType === 'quarterly') {
    const totalPayouts = termYears * 4;
    const grossPerPayout = tierCalc.annualProfit / 4;
    const taxPerPayout = (grossPerPayout * taxRatePercent) / 100;
    const netPerPayout = grossPerPayout - taxPerPayout;
    periodicPayout = {
      frequency: 'quarterly',
      grossPerPayout: Math.round(grossPerPayout),
      taxPerPayout: Math.round(taxPerPayout),
      netPerPayout: Math.round(netPerPayout),
      totalPayouts,
    };
  }

  // 6. Early Encashment Calculations
  const earlyEncashment: EarlyEncashmentResult[] = [];
  if (schemeRate.earlyEncashment && schemeRate.earlyEncashment.length > 0) {
    for (const row of schemeRate.earlyEncashment) {
      const y = row.afterFullYears;
      if (y > termYears) continue;

      const yR1 = row.rateAtOrBelowThreshold ?? r1;
      const yR2 = row.rateAboveThreshold ?? r2;
      const yTier = calculateTierProfits(amount, threshold, tierMode, yR1, yR2);

      const entitledGrossProfit = Math.round(yTier.annualProfit * y);
      const entitledTax = Math.round((entitledGrossProfit * taxRatePercent) / 100);
      const entitledNetProfit = entitledGrossProfit - entitledTax;

      // Net receivable is principal (main) + entitled net profit
      const netReceivable = amount + entitledNetProfit;

      earlyEncashment.push({
        afterFullYears: y,
        ratePercent: yTier.weightedRate,
        grossProfit: entitledGrossProfit,
        taxDeducted: entitledTax,
        netReceivable,
      });
    }
  }

  // 7. Human-Readable Step-by-Step Breakdown
  breakdown.push({
    title: {
      bn: '১. বিনিয়োগ ও প্রযোজ্য মুনাফার স্তর (Tier)',
      en: '1. Investment & Rate Tier Slabs',
    },
    detail: {
      bn:
        tierCalc.tier2Amount > 0
          ? `প্রথম ${formatCurrency(threshold, 'bn')} এর ওপর ${formatPercent(r1, 'bn')} হারে এবং অতিরিক্ত ${formatCurrency(tierCalc.tier2Amount, 'bn')} এর ওপর ${formatPercent(r2, 'bn')} হারে গড় কার্যকর মুনাফার হার ${formatPercent(tierCalc.weightedRate, 'bn')}।`
          : `মোট বিনিয়োগ ${formatCurrency(amount, 'bn')} (৭.৫০ লক্ষ টাকার মধ্যে), যার ওপর প্রযোজ্য মুনাফার হার ${formatPercent(r1, 'bn')}।`,
      en:
        tierCalc.tier2Amount > 0
          ? `First ${formatCurrency(threshold, 'en')} at ${formatPercent(r1, 'en')} and excess ${formatCurrency(tierCalc.tier2Amount, 'en')} at ${formatPercent(r2, 'en')}. Weighted average rate is ${formatPercent(tierCalc.weightedRate, 'en')}.`
          : `Total investment ${formatCurrency(amount, 'en')} is within Tk 7.5 Lakh threshold; applicable interest rate is ${formatPercent(r1, 'en')}.`,
    },
    amount,
    rate: tierCalc.weightedRate,
  });

  breakdown.push({
    title: {
      bn: '২. মোট গ্রস মুনাফা হিসাব',
      en: '2. Gross Profit Calculation',
    },
    detail: {
      bn: `প্রতি বছর গ্রস মুনাফা ${formatCurrency(Math.round(tierCalc.annualProfit), 'bn')}। ${termYears} বছরের পূর্ণ মেয়াদে মোট গ্রস মুনাফা = ${formatCurrency(Math.round(totalGrossProfit), 'bn')}।`,
      en: `Annual gross profit is ${formatCurrency(Math.round(tierCalc.annualProfit), 'en')}. Over the full ${termYears}-year term, total gross profit is ${formatCurrency(Math.round(totalGrossProfit), 'en')}.`,
    },
    amount: Math.round(totalGrossProfit),
  });

  breakdown.push({
    title: {
      bn: '৩. উৎসে কর (Source Tax / TDS)',
      en: '3. Tax Deducted at Source (TDS)',
    },
    detail: {
      bn:
        taxRatePercent === 0
          ? `পেনশনার সঞ্চয়পত্রে ৫ লক্ষ টাকা পর্যন্ত বিনিয়োগের মুনাফায় কোনো উৎসে কর কাটা হয় না (০% কর)।`
          : `মোট বিনিয়োগ ${amount <= 500000 ? '৫ লক্ষ টাকার মধ্যে' : '৫ লক্ষ টাকার বেশি'} হওয়ায় সম্পূর্ণ অর্জিত মুনাফার ওপর ${formatPercent(taxRatePercent, 'bn')} হারে উৎসে কর কর্তন = ${formatCurrency(taxDeducted, 'bn')}।`,
      en:
        taxRatePercent === 0
          ? `Zero tax on Pensioner certificate for cumulative holdings up to Tk 5 Lakh (tax exempt).`
          : `Since total holding is ${amount <= 500000 ? '≤ Tk 5 Lakh' : '> Tk 5 Lakh'}, a ${formatPercent(taxRatePercent, 'en')} source tax applies to total interest = ${formatCurrency(taxDeducted, 'en')}.`,
    },
    amount: taxDeducted,
    rate: taxRatePercent,
  });

  if (periodicPayout) {
    const freqBn = periodicPayout.frequency === 'monthly' ? 'মাসিক' : 'ত্রৈমাসিক (প্রতি ৩ মাসে)';
    const freqEn = periodicPayout.frequency === 'monthly' ? 'monthly' : 'quarterly (every 3 months)';
    breakdown.push({
      title: {
        bn: `৪. নিয়মিত ${freqBn} প্রদেয় আয়`,
        en: `4. Regular ${freqEn} Net Income`,
      },
      detail: {
        bn: `প্রতি কিস্তিতে গ্রস মুনাফা ${formatCurrency(periodicPayout.grossPerPayout, 'bn')}, উৎসে কর ${formatCurrency(periodicPayout.taxPerPayout, 'bn')} বাদ দিয়ে হাতে নিট প্রাপ্য = ${formatCurrency(periodicPayout.netPerPayout, 'bn')}। মোট কিস্তি সংখ্যা: ${periodicPayout.totalPayouts} টি।`,
        en: `Each payout provides gross ${formatCurrency(periodicPayout.grossPerPayout, 'en')}, less tax ${formatCurrency(periodicPayout.taxPerPayout, 'en')} = net receivable ${formatCurrency(periodicPayout.netPerPayout, 'en')}. Total installments: ${periodicPayout.totalPayouts}.`,
      },
      amount: periodicPayout.netPerPayout,
    });
  }

  breakdown.push({
    title: {
      bn: periodicPayout ? '৫. মেয়াদপূর্তিতে মোট প্রাপ্তি ও ফলপ্রসূ লাভ' : '৪. মেয়াদপূর্তিতে মোট প্রাপ্তি ও লাভ',
      en: periodicPayout ? '5. Maturity Outcome & Net Yield' : '4. Maturity Outcome & Net Yield',
    },
    detail: {
      bn: `সর্বমোট নিট মুনাফা ${formatCurrency(netProfit, 'bn')} সহ মূলধন মিলিয়ে মোট প্রাপ্তি ${formatCurrency(totalAtMaturity, 'bn')}। বার্ষিক ফলপ্রসূ নিট রিটার্ন (Effective Yield) = ${formatPercent(effectiveAnnualYield, 'bn')}।`,
      en: `Total net profit earned is ${formatCurrency(netProfit, 'en')}, making total value with principal ${formatCurrency(totalAtMaturity, 'en')}. Effective annual net yield is ${formatPercent(effectiveAnnualYield, 'en')}.`,
    },
    amount: totalAtMaturity,
    rate: effectiveAnnualYield,
  });

  return {
    schemeId: scheme.id,
    scheme,
    eligible: true,
    grossProfit: Math.round(totalGrossProfit),
    taxDeducted,
    netProfit,
    totalAtMaturity,
    effectiveAnnualYield: Number(effectiveAnnualYield.toFixed(2)),
    periodicPayout,
    earlyEncashment,
    appliedRatePercent: {
      tier1: r1,
      tier2: tierCalc.tier2Amount > 0 ? r2 : undefined,
      weightedAverage: Number(tierCalc.weightedRate.toFixed(2)),
    },
    appliedTaxRatePercent: taxRatePercent,
    warnings,
    breakdown,
  };
}

/**
 * Calculates results for all schemes.
 */
export function calculateAllSchemes(
  schemes: SchemeDefinition[],
  rateData: RatePeriodData,
  taxData: TaxData,
  input: CalcInput
): SchemeResult[] {
  return schemes.map((scheme) => calculateSchemeResult(scheme, rateData, taxData, input));
}

export type SortCriterion = 'net' | 'yield' | 'income' | 'term';

/**
 * Sorts scheme results according to selected criterion.
 * Eligible schemes always appear BEFORE ineligible schemes.
 */
export function rankSchemes(results: SchemeResult[], criterion: SortCriterion = 'net'): SchemeResult[] {
  const eligible = results.filter((r) => r.eligible);
  const ineligible = results.filter((r) => !r.eligible);

  eligible.sort((a, b) => {
    switch (criterion) {
      case 'yield':
        return (b.effectiveAnnualYield ?? 0) - (a.effectiveAnnualYield ?? 0);
      case 'income': {
        const incA = a.periodicPayout ? a.periodicPayout.netPerPayout : 0;
        const incB = b.periodicPayout ? b.periodicPayout.netPerPayout : 0;
        return incB - incA;
      }
      case 'term':
        return a.scheme.termYears - b.scheme.termYears;
      case 'net':
      default:
        return (b.netProfit ?? 0) - (a.netProfit ?? 0);
    }
  });

  return [...eligible, ...ineligible];
}
