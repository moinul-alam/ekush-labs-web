import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type MiniSearch from 'minisearch';
import {
  createPprSearch,
  resolveDirect,
  searchProvisions,
  type PprDocument,
  type PprManifest,
} from '../src/lib/ppr/search';

/**
 * Phase 2 exit benchmark: a fixed query set must return the expected clause in
 * the top 3. Run with `npm test --workspace=apps/tools`.
 */
const assetsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../hub/ppr/assets/ppr2025');
const documents: PprDocument[] = JSON.parse(
  readFileSync(resolve(assetsDir, 'documents.json'), 'utf-8'),
).documents;
const manifest: PprManifest = JSON.parse(readFileSync(resolve(assetsDir, 'index.json'), 'utf-8'));

let index: MiniSearch<PprDocument>;

beforeAll(() => {
  index = createPprSearch(documents, manifest);
});

const RANKED_QUERIES: Array<{ query: string; expect: string; note?: string }> = [
  { query: 'OTM', expect: 'ppr2025:rule:78', note: 'alias: OTM -> উন্মুক্ত দরপত্র পদ্ধতি' },
  { query: 'ই-জিপি', expect: 'ppr2025:rule:150', note: 'alias: e-GP / ই-জিপি' },
  { query: 'পেশাগত অসদাচরণ', expect: 'ppr2025:rule:149' },
  { query: 'রহিতকরণ', expect: 'ppr2025:rule:154' },
  { query: 'কনসেশন', expect: 'ppr2025:rule:151' },
  { query: 'একক উৎস', expect: 'ppr2025:rule:131' },
  { query: 'বিনির্দেশ ও প্রাক্কলন কমিটি', expect: 'ppr2025:rule:9' },
  { query: 'মূল্যায়ন কমিটি', expect: 'ppr2025:rule:11' },
  { query: 'কোটেশন পদ্ধতি', expect: 'ppr2025:rule:91' },
  { query: 'বিপরীত নিলাম', expect: 'ppr2025:rule:95' },
  { query: 'আন্তর্জাতিক প্রতিযোগিতা', expect: 'ppr2025:rule:102' },
];

const DIRECT_QUERIES: Array<{ query: string; kind: string; number: number }> = [
  { query: '৪২', kind: 'rule', number: 42 },
  { query: '42', kind: 'rule', number: 42 },
  { query: 'rule 42', kind: 'rule', number: 42 },
  { query: 'বিধি ৪২', kind: 'rule', number: 42 },
  { query: 'বিধি ১৫০', kind: 'rule', number: 150 },
  { query: 'schedule III', kind: 'schedule', number: 3 },
  { query: 'তফসিল ২১', kind: 'schedule', number: 21 },
  { query: 'chapter 5', kind: 'chapter', number: 5 },
  { query: 'পঞ্চম অধ্যায়', kind: 'chapter', number: 5 },
];

describe('PPR search benchmark', () => {
  it('publishes the corpus the plan expects', () => {
    expect(documents).toHaveLength(171);
    expect(manifest.counts.rules).toBe(154);
    expect(manifest.counts.schedules).toBe(17);
  });

  it.each(RANKED_QUERIES)('returns $expect in the top 3 for "$query"', ({ query, expect: id }) => {
    const top = searchProvisions(index, manifest, query, 3).map((result) => result.id);
    expect(top).toContain(id);
  });

  it.each(DIRECT_QUERIES)(
    'resolves "$query" straight to $kind $number',
    ({ query, kind, number }) => {
      expect(resolveDirect(query, manifest.resolve)).toMatchObject({ kind, number });
    },
  );

  it('indexes digits in both scripts', () => {
    const ascii = searchProvisions(index, manifest, '118', 5).map((result) => result.id);
    const bengali = searchProvisions(index, manifest, '১১৮', 5).map((result) => result.id);
    expect(ascii).toContain('ppr2025:rule:118');
    expect(bengali).toContain('ppr2025:rule:118');
  });

  it('does not resolve a bare schedule number to a rule of the same number', () => {
    expect(resolveDirect('৩', manifest.resolve)).toMatchObject({ kind: 'rule', number: 3 });
    expect(resolveDirect('তফসিল ৩', manifest.resolve)).toMatchObject({
      kind: 'schedule',
      number: 3,
    });
  });
});
