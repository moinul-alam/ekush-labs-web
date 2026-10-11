export interface PrizeBondRules {
  schemaVersion: number;
  denomination: number;
  currency: string;
  numberFormat: {
    digits: number;
    hasSeries: boolean;
    noteBn?: string;
    noteEn?: string;
  };
  matchKey: string;
  tiers: Array<{
    tier: number;
    labelBn: string;
    labelEn: string;
    amount: number;
    countPerSeries: number;
  }>;
  totalPrizesPerSeries: number;
  tax: {
    ratePercent: number;
    noteBn: string;
    noteEn: string;
  };
  claim: {
    validityMonths: number;
    officialSourceUrl: string;
    stepsBn: string[];
    stepsEn: string[];
    documents: string[];
  };
  lastVerified: string;
}

export interface DrawManifestItem {
  id: string;
  drawNumber: number;
  date: string;
  file: string;
  version: string;
  totalWinners: number;
  claimableUntil: string;
}

export interface DrawManifest {
  schemaVersion: number;
  generatedAt: string;
  latestDraw: number;
  draws: DrawManifestItem[];
}

export interface DrawData {
  schemaVersion: number;
  id: string;
  drawNumber: number;
  date: string;
  source: {
    name: string;
    url: string;
    pdf?: string;
    extractedAt: string;
  };
  tiers: Array<{
    tier: number;
    amount: number;
    expectedCount: number;
    numbers: string[];
  }>;
}

export interface WinItem {
  drawId: string;
  drawNumber: number;
  date: string;
  tier: number;
  amount: number;
  claimableUntil: string;
  isExpired: boolean;
}

/**
 * Base URL for prize bond draw assets.
 * Hosted publicly at https://hub.ekushlabs.com/bond/assets
 */
export const BOND_DATA_BASE_URL = 'https://hub.ekushlabs.com/bond/assets';

export class DrawStore {
  private baseUrl: string;
  private manifest: DrawManifest | null = null;
  private rules: PrizeBondRules | null = null;
  private drawCache: Map<string, DrawData> = new Map();
  // Map of 7-digit bond number -> Array of wins
  private index: Map<string, WinItem[]> = new Map();

  constructor(baseUrl: string = BOND_DATA_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async fetchRules(): Promise<PrizeBondRules> {
    if (this.rules) return this.rules;
    const res = await fetch(`${this.baseUrl}/rules.json`);
    if (!res.ok) throw new Error(`Failed to load rules: ${res.statusText}`);
    this.rules = await res.json();
    return this.rules!;
  }

  public async fetchManifest(): Promise<DrawManifest> {
    if (this.manifest) return this.manifest;
    const res = await fetch(`${this.baseUrl}/index.json?_t=${Date.now()}`);
    if (!res.ok) throw new Error(`Failed to load index manifest: ${res.statusText}`);
    this.manifest = await res.json();
    return this.manifest!;
  }

  public async fetchDraw(item: DrawManifestItem): Promise<DrawData> {
    if (this.drawCache.has(item.id)) {
      return this.drawCache.get(item.id)!;
    }
    const url = `${this.baseUrl}/${item.file}?v=${item.version}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load draw #${item.drawNumber}`);
    const data: DrawData = await res.json();
    this.drawCache.set(item.id, data);
    return data;
  }

  public async loadSelectedDraws(
    drawIds: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    const manifest = await this.fetchManifest();
    await this.fetchRules();

    const targets = manifest.draws.filter((d) => drawIds.includes(d.id));
    let completed = 0;

    for (const item of targets) {
      if (!this.drawCache.has(item.id)) {
        await this.fetchDraw(item);
      }
      completed++;
      if (onProgress) onProgress(completed, targets.length);
    }

    this.rebuildIndex(drawIds);
  }

  public rebuildIndex(selectedDrawIds: string[]): void {
    this.index.clear();
    const nowStr = new Date().toISOString().split('T')[0];

    for (const [id, draw] of this.drawCache.entries()) {
      if (!selectedDrawIds.includes(id)) continue;

      const manifestItem = this.manifest?.draws.find((d) => d.id === id);
      const claimableUntil = manifestItem?.claimableUntil || '';
      const isExpired = claimableUntil ? claimableUntil < nowStr : false;

      for (const tier of draw.tiers) {
        for (const num of tier.numbers) {
          const win: WinItem = {
            drawId: draw.id,
            drawNumber: draw.drawNumber,
            date: draw.date,
            tier: tier.tier,
            amount: tier.amount,
            claimableUntil,
            isExpired,
          };

          const existing = this.index.get(num) || [];
          existing.push(win);
          this.index.set(num, existing);
        }
      }
    }
  }

  public getIndex(): Map<string, WinItem[]> {
    return this.index;
  }

  public getRules(): PrizeBondRules | null {
    return this.rules;
  }

  public getManifest(): DrawManifest | null {
    return this.manifest;
  }
}
