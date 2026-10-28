export interface MetaSource {
  title: string;
  url: string;
  publishedOn?: string;
  type: 'gazette' | 'circular' | 'official-site' | 'news';
}

export interface DataMeta {
  schemaVersion: string;
  dataVersion: string;
  lastVerified: string;
  sources: MetaSource[];
  extractedBy?: string;
  reviewed?: boolean;
  notes?: string;
}

export interface PeriodManifestItem {
  id: string;
  from: string;
  to: string;
  file: string;
  label?: {
    bn: string;
    en: string;
  };
}

export interface IndexManifest {
  meta: DataMeta;
  latestPeriodId: string;
  periods: PeriodManifestItem[];
}

export interface SchemeDefinition {
  id: string;
  name: {
    bn: string;
    en: string;
  };
  shortDescription?: {
    bn: string;
    en: string;
  };
  termYears: number;
  payoutType: 'at_maturity' | 'monthly' | 'quarterly';
  payoutFrequency: string | null;
  eligibility: {
    pensionerOnly: boolean;
    buyerTags?: {
      bn: string[];
      en: string[];
    };
    notes?: {
      bn: string;
      en: string;
    };
  };
  purchaseLimits: {
    individual: {
      max: number | null;
      notes?: string;
    };
    joint: {
      max: number | null;
      notes?: string;
    };
    minPurchase: number | null;
    denominations?: number[];
  };
  rateTierThreshold: number | null;
  encashment: {
    allowedBeforeMaturity: boolean;
  };
}

export interface SchemesData {
  meta: DataMeta;
  schemes: SchemeDefinition[];
}

export interface TaxSourceBracket {
  upToInvestment?: number;
  above?: number;
  rate: number;
  appliesTo: string;
}

export interface TaxRule {
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceTax: TaxSourceBracket[];
  pensionerExemptUpTo: number;
  measuredOn: string;
  tinRelatedAdjustments?: string | null;
  notes?: {
    bn: string;
    en: string;
  };
}

export interface TaxData {
  meta: DataMeta;
  rules: TaxRule[];
}

export interface EarlyEncashmentRate {
  afterFullYears: number;
  rateAtOrBelowThreshold: number | null;
  rateAboveThreshold: number | null;
}

export interface SchemeRateInfo {
  rateAtOrBelowThreshold: number;
  rateAboveThreshold: number;
  payoutTablePerLakh?: {
    grossPerPayoutAtOrBelow?: number;
    grossPerPayoutAbove?: number;
    frequency?: string;
    atMaturityGrossTotalAtOrBelow?: number;
    atMaturityGrossTotalAbove?: number;
  } | null;
  earlyEncashment?: EarlyEncashmentRate[];
}

export interface RatePeriodData {
  meta: DataMeta;
  periodId: string;
  effectiveFrom: string;
  effectiveTo: string;
  currency: 'BDT';
  tierThreshold: number;
  tierMode: 'excess_only' | 'whole_amount';
  schemes: Record<string, SchemeRateInfo>;
}

export interface CalcInput {
  amount: number;
  purchaseDate: string; // ISO YYYY-MM-DD
  isPensioner: boolean;
}

export interface BreakdownStep {
  title: {
    bn: string;
    en: string;
  };
  detail: {
    bn: string;
    en: string;
  };
  amount?: number;
  rate?: number;
}

export interface EarlyEncashmentResult {
  afterFullYears: number;
  ratePercent: number | null;
  grossProfit: number | null;
  taxDeducted: number | null;
  netReceivable: number | null;
}

export interface PeriodicPayoutResult {
  frequency: 'monthly' | 'quarterly';
  grossPerPayout: number;
  taxPerPayout: number;
  netPerPayout: number;
  totalPayouts: number;
}

export interface SchemeResult {
  schemeId: string;
  scheme: SchemeDefinition;
  eligible: boolean;
  ineligibleReason?: {
    bn: string;
    en: string;
  };
  /** Amount the user asked for. */
  requestedAmount?: number;
  /** Amount actually purchasable in this scheme's denominations (≤ requested). */
  investableAmount?: number;
  grossProfit?: number;
  taxDeducted?: number;
  netProfit?: number;
  totalAtMaturity?: number;
  effectiveAnnualYield?: number;
  periodicPayout?: PeriodicPayoutResult;
  earlyEncashment?: EarlyEncashmentResult[];
  appliedRatePercent?: {
    tier1: number;
    tier2?: number;
    weightedAverage: number;
  };
  appliedTaxRatePercent?: number;
  warnings: string[];
  breakdown: BreakdownStep[];
}
