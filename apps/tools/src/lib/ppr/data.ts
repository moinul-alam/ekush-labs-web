import type { PprDocument, PprManifest } from './search';

/**
 * The corpus and the gazette PDF are shared assets that live on the hub; the
 * tools app only reads them over the network (the hub's `_headers` allow
 * cross-origin GET). Nothing is mirrored into this app.
 *
 * Both URLs default to the published hub. They can be pointed at a local copy
 * of `apps/hub` instead — which is how the app is developed before the corpus
 * is published — by setting `PUBLIC_PPR_ASSETS_BASE_URL` and `PUBLIC_PPR_PDF_URL`.
 * Serve the local hub with CORS, since the app fetches it cross-origin:
 *
 *   npx http-server apps/hub -p 8788 --cors
 *
 * and put the two overrides in `apps/tools/.env.development` (git-ignored, so
 * production keeps the defaults below).
 */
export const PPR_ASSETS_BASE_URL =
  import.meta.env.PUBLIC_PPR_ASSETS_BASE_URL || 'https://hub.ekushlabs.com/ppr/assets/ppr2025';
export const PPR_PDF_URL =
  import.meta.env.PUBLIC_PPR_PDF_URL || 'https://hub.ekushlabs.com/ppr/PPR2025.pdf';

/**
 * Where a payload came from — the UI says so rather than pretending a cached
 * read is a live one.
 */
export type PprSource = 'network' | 'cache';

const CACHE_PREFIX = 'ppr-corpus';
const META_CACHE = `${CACHE_PREFIX}:meta`;

function cacheStorage(): CacheStorage | null {
  try {
    return typeof caches === 'undefined' ? null : caches;
  } catch {
    return null;
  }
}

/**
 * Loads the two published files over the network and keeps a copy in the Cache
 * Storage, so a later visit works without one.
 *
 * `documents.json` is requested with `?v=<contentHash>` — the hash the manifest
 * carries for it — which is the versioning the prize-bond pipeline uses: a new
 * corpus is a new URL, so the HTTP cache can be trusted and the stale copy is
 * never served. The offline cache is keyed the same way and old corpora are
 * dropped as soon as a new one lands.
 */
export class PprDataStore {
  private manifest: PprManifest | null = null;
  private documents: PprDocument[] | null = null;
  private lastSource: PprSource = 'network';

  private get documentsUrl(): string | null {
    if (!this.manifest) return null;
    const hash = this.manifest.hashes?.[this.manifest.files.documents];
    const file = this.manifest.files.documents;
    return hash
      ? `${PPR_ASSETS_BASE_URL}/${file}?v=${hash}`
      : `${PPR_ASSETS_BASE_URL}/${file}`;
  }

  public get source(): PprSource {
    return this.lastSource;
  }

  private async cacheRead<T>(cacheName: string, url: string): Promise<T | null> {
    const storage = cacheStorage();
    if (!storage) return null;
    try {
      const response = await (await storage.open(cacheName)).match(url);
      return response ? ((await response.json()) as T) : null;
    } catch {
      return null;
    }
  }

  private async cacheWrite(cacheName: string, url: string, payload: unknown): Promise<void> {
    const storage = cacheStorage();
    if (!storage) return;
    try {
      const cache = await storage.open(cacheName);
      await cache.put(
        url,
        new Response(JSON.stringify(payload), {
          headers: { 'content-type': 'application/json' },
        }),
      );
    } catch {
      // Private mode, a full quota, no Cache Storage — none of it is fatal.
    }
  }

  /** Drop every corpus cache but the one the current content hash names. */
  private async pruneCorpusCaches(keep: string): Promise<void> {
    const storage = cacheStorage();
    if (!storage) return;
    try {
      const keys = await storage.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(`${CACHE_PREFIX}:`) && key !== keep && key !== META_CACHE)
          .map((key) => storage.delete(key)),
      );
    } catch {
      // Nothing to prune if the storage is unavailable.
    }
  }

  /** Network first, cache second: the newest corpus when online, a usable one when not. */
  private async load<T>(url: string, cacheName: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as T;
      void this.cacheWrite(cacheName, url, payload);
      return payload;
    } catch (error) {
      const cached = await this.cacheRead<T>(cacheName, url);
      if (cached) {
        this.lastSource = 'cache';
        return cached;
      }
      throw error;
    }
  }

  public async fetchManifest(): Promise<PprManifest> {
    if (!this.manifest) {
      this.manifest = await this.load<PprManifest>(`${PPR_ASSETS_BASE_URL}/index.json`, META_CACHE);
    }
    return this.manifest;
  }

  public async fetchDocuments(): Promise<PprDocument[]> {
    if (!this.documents) {
      await this.fetchManifest();
      const cacheName = `${CACHE_PREFIX}:${this.manifest!.contentHash}`;
      const payload = await this.load<{ documents: PprDocument[] }>(this.documentsUrl!, cacheName);
      this.documents = payload.documents;
      void this.pruneCorpusCaches(cacheName);
    }
    return this.documents;
  }
}
