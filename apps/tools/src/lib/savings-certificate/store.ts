import type {
  IndexManifest,
  SchemesData,
  TaxData,
  RatePeriodData,
  PeriodManifestItem,
} from './types';

export const SAVINGS_DATA_BASE_URL = 'https://hub.ekushlabs.com/savings-certificate/assets';
export const LOCAL_FALLBACK_BASE_URL = '/savings-certificate/assets';

export class SavingsDataStore {
  private baseUrl: string;
  private fallbackUrl: string;
  private indexManifest: IndexManifest | null = null;
  private schemesData: SchemesData | null = null;
  private taxData: TaxData | null = null;
  private rateCache: Map<string, RatePeriodData> = new Map();

  constructor(
    baseUrl: string = SAVINGS_DATA_BASE_URL,
    fallbackUrl: string = LOCAL_FALLBACK_BASE_URL
  ) {
    this.baseUrl = baseUrl;
    this.fallbackUrl = fallbackUrl;
  }

  private async fetchWithFallback<T>(relativePath: string): Promise<T> {
    const urlsToTry = [
      `${this.baseUrl}/${relativePath}`,
      `${this.fallbackUrl}/${relativePath}`,
    ];

    let lastError: Error | null = null;
    for (const url of urlsToTry) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          return (await res.json()) as T;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw new Error(
      `Failed to load resource '${relativePath}'. ${lastError ? lastError.message : 'HTTP status error.'}`
    );
  }

  public async fetchIndex(): Promise<IndexManifest> {
    if (this.indexManifest) return this.indexManifest;
    this.indexManifest = await this.fetchWithFallback<IndexManifest>('index.json');
    return this.indexManifest;
  }

  public async fetchSchemes(): Promise<SchemesData> {
    if (this.schemesData) return this.schemesData;
    this.schemesData = await this.fetchWithFallback<SchemesData>('schemes.json');
    return this.schemesData;
  }

  public async fetchTax(): Promise<TaxData> {
    if (this.taxData) return this.taxData;
    this.taxData = await this.fetchWithFallback<TaxData>('tax.json');
    return this.taxData;
  }

  public async fetchRatePeriod(itemOrId: string | PeriodManifestItem): Promise<RatePeriodData> {
    const index = await this.fetchIndex();
    let item: PeriodManifestItem | undefined;

    if (typeof itemOrId === 'string') {
      item = index.periods.find((p) => p.id === itemOrId);
    } else {
      item = itemOrId;
    }

    if (!item) {
      throw new Error(`Period '${itemOrId}' not found in index manifest.`);
    }

    if (this.rateCache.has(item.id)) {
      return this.rateCache.get(item.id)!;
    }

    const data = await this.fetchWithFallback<RatePeriodData>(item.file);
    this.rateCache.set(item.id, data);
    return data;
  }

  /**
   * Resolves the matching period item for a given ISO date string (YYYY-MM-DD).
   * If not found, returns null and nearest available period.
   */
  public resolvePeriodForDate(
    dateIso: string,
    index: IndexManifest
  ): { period: PeriodManifestItem | null; nearest: PeriodManifestItem; isOutOfRange: boolean } {
    const sorted = [...index.periods].sort((a, b) => b.from.localeCompare(a.from));

    for (const p of sorted) {
      if (dateIso >= p.from && dateIso <= p.to) {
        return { period: p, nearest: p, isOutOfRange: false };
      }
    }

    // Out of range: find nearest period
    // If date is newer than newest period:
    if (dateIso > sorted[0].to) {
      return { period: null, nearest: sorted[0], isOutOfRange: true };
    }

    // If date is older than oldest period:
    const oldest = sorted[sorted.length - 1];
    return { period: null, nearest: oldest, isOutOfRange: true };
  }

  public getCachedIndex(): IndexManifest | null {
    return this.indexManifest;
  }

  public getCachedSchemes(): SchemesData | null {
    return this.schemesData;
  }

  public getCachedTax(): TaxData | null {
    return this.taxData;
  }
}
