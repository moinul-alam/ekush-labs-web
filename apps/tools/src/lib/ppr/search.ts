import MiniSearch, { type SearchResult } from 'minisearch';

/**
 * PPR search over the corpus the hub publishes.
 *
 * build_index.py emits `documents.json` (one document per provision) and
 * `index.json` (the alias table, the facet vocabulary and the L0 resolver).
 * This module builds MiniSearch from those documents and applies the Bengali
 * handling the plan calls for: NFC normalisation, ZWJ/ZWNJ stripping, digits
 * indexed in both Bengali and ASCII forms, alias expansion, and title > tags >
 * body boosting.
 */

export const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';
const ASCII_DIGITS = '0123456789';
const ZERO_WIDTH = /[\u200b\u200c\u200d\ufeff]/g;

/**
 * One edge of the cross-reference graph. `refs` are the provisions this
 * document names, `refsBy` the provisions that name it; both carry the label
 * exactly as the corpus spells it (`বিধি ৪৮`, `পঞ্চম অধ্যায়`).
 */
export interface PprRef {
  kind: 'rule' | 'schedule' | 'chapter';
  number: number;
  label: string;
  /** Set on `refsBy` entries: the citing provision's document id. */
  id?: string;
}

/**
 * One clause of a rule body, as the corpus splits it: `kind` says whether the
 * label is a numeral (`(১)`) or a letter (`(ক)`), and `text` still carries the
 * label the corpus drew in front of it.
 */
export interface PprSubRule {
  label: string;
  kind: 'number' | 'letter';
  text: string;
}

export interface PprDocument {
  id: string;
  kind: 'rule' | 'schedule';
  number: number;
  chapter: number | null;
  chapterOrdinal: string | null;
  part: string | null;
  title: string;
  text: string;
  snippet: string;
  tags: string;
  aliases: string[];
  facets: Record<string, Array<number | string>>;
  subRuleCount: number;
  subRules: PprSubRule[];
  page: number;
  pdfPage: number;
  refs: PprRef[];
  refsBy: PprRef[];
}

/** A term read off the rule the corpus itself titles সংজ্ঞার্থ. */
export interface PprGlossaryTerm {
  id: string;
  term: string;
  en: string | null;
  aliases: string[];
  definition: string;
  source: { kind: 'rule' | 'schedule'; number: number };
}

export interface PprReferences {
  edges: number;
  documents: number;
  backlinks: number;
  /** Targets the corpus cites but the edition does not carry (image-only pages). */
  dangling: Array<{ target: string; count: number }>;
}

export interface PprAlias {
  id: string;
  bn: string;
  en?: string | null;
  keyToken: string;
  terms: string[];
}

export interface PprFacetValue {
  id: string;
  bn: string;
  en?: string;
}

export interface PprFacet {
  id: string;
  labelBn: string;
  labelEn: string;
  kind: 'structural' | 'terms';
  values?: PprFacetValue[];
}

export interface PprResolveTarget {
  kind: 'rule' | 'schedule' | 'chapter';
  number: number;
  page: number;
  pdfPage: number;
}

export interface PprPart {
  label: string;
  title: string;
  page: number;
}

export interface PprManifestChapter {
  number: number;
  ordinal: string;
  headingMissing: boolean;
  page: number;
  pdfPage: number;
  ruleRange: [number, number];
  parts: PprPart[];
}

export interface PprSchedule {
  number: number;
  title: string;
  page: number;
  pdfPage: number;
}

export interface PprMissingSchedule {
  kind: string;
  what: string;
  pages: number[];
  note: string;
}

export interface PprManifest {
  schemaVersion: number;
  edition: string;
  title: string;
  titleEn: string;
  /** SHA-256 over the published documents — keys the offline cache. */
  contentHash: string;
  /** gazette page = pdf page + pageOffset (the edition's own printed footer offset). */
  pageOffset: number;
  pdfPages: number;
  files: { documents: string };
  /** Content hash per published file — the cache key and the `?v=` value. */
  hashes?: Record<string, string>;
  counts: Record<string, number>;
  chapters: PprManifestChapter[];
  schedules: PprSchedule[];
  missingSchedules: PprMissingSchedule[];
  aliases: PprAlias[];
  facets: PprFacet[];
  glossary: PprGlossaryTerm[];
  references: PprReferences;
  resolve: Record<string, PprResolveTarget>;
}

export interface PprResult extends SearchResult {
  id: string;
  kind: 'rule' | 'schedule';
  number: number;
  chapter: number | null;
  chapterOrdinal: string | null;
  part: string | null;
  title: string;
  snippet: string;
  subRuleCount: number;
  page: number;
  pdfPage: number;
  aliases: string[];
  facets: Record<string, Array<number | string>>;
}

/** NFC, ZWJ/ZWNJ and other zero-width marks dropped, whitespace collapsed. */
export function normalizeText(text: string): string {
  return text.normalize('NFC').replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim();
}

/**
 * Matching form: lowercased, everything but letters, digits and combining marks
 * removed. Marks have to survive so 'বিধি' keeps its vowel signs - this must
 * fold exactly like build_index.py's fold_key(), which keys the resolver.
 */
export function foldKey(text: string): string {
  return normalizeText(text).toLowerCase().replace(/[^\p{L}\p{N}\p{M}]/gu, '');
}

/** The token with its digits also in the other script, e.g. ৪২ <-> 42. */
export function digitVariants(token: string): string[] {
  let ascii = '';
  let bengali = '';
  for (const char of token) {
    const asciiIndex = ASCII_DIGITS.indexOf(char);
    const bengaliIndex = BENGALI_DIGITS.indexOf(char);
    if (asciiIndex >= 0) {
      ascii += char;
      bengali += BENGALI_DIGITS[asciiIndex];
    } else if (bengaliIndex >= 0) {
      ascii += ASCII_DIGITS[bengaliIndex];
      bengali += char;
    } else {
      ascii += char;
      bengali += char;
    }
  }
  return ascii === bengali ? [ascii] : [ascii, bengali];
}

/** Append the key token of every alias group the query spells out. */
export function expandAliases(query: string, aliases: PprAlias[]): string {
  const folded = foldKey(query);
  if (!folded) {
    return query;
  }
  const extra: string[] = [];
  for (const alias of aliases) {
    const spellings = [alias.keyToken, alias.bn, ...alias.terms].map(foldKey);
    if (spellings.some((spelling) => spelling && folded.includes(spelling))) {
      extra.push(alias.keyToken);
    }
  }
  return extra.length ? `${query} ${extra.join(' ')}` : query;
}

/** L0: a bare number, `rule 42`, `বিধি ৪২`, `schedule III` resolves straight to a page. */
export function resolveDirect(
  query: string,
  resolve: Record<string, PprResolveTarget>,
): PprResolveTarget | null {
  return resolve[foldKey(query)] ?? null;
}

function aliasIndex(aliases: PprAlias[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const alias of aliases) {
    for (const spelling of [alias.keyToken, alias.bn, ...alias.terms]) {
      index.set(foldKey(spelling), alias.keyToken);
    }
  }
  return index;
}

const STORED_FIELDS = [
  'id',
  'kind',
  'number',
  'chapter',
  'chapterOrdinal',
  'part',
  'title',
  'snippet',
  'subRuleCount',
  'page',
  'pdfPage',
  'aliases',
  'facets',
];

export function createPprSearch(documents: PprDocument[], manifest: PprManifest): MiniSearch<PprDocument> {
  const terms = aliasIndex(manifest.aliases);
  const index = new MiniSearch<PprDocument>({
    fields: ['title', 'tags', 'text'],
    storeFields: STORED_FIELDS,
    tokenize: (text) => normalizeText(text).split(/[\s\p{P}\p{S}]+/u).filter(Boolean),
    processTerm: (term) => {
      const base = normalizeText(term).toLowerCase();
      const variants = new Set<string>([base, ...digitVariants(base)]);
      const keyToken = terms.get(foldKey(base));
      if (keyToken) {
        variants.add(keyToken);
      }
      return [...variants];
    },
    searchOptions: {
      boost: { title: 3, tags: 2, text: 1 },
      prefix: true,
      combineWith: 'OR',
    },
  });
  index.addAll(documents);
  return index;
}

/** Alias expansion plus MiniSearch, as the UI will call it. */
export function searchProvisions(
  index: MiniSearch<PprDocument>,
  manifest: PprManifest,
  query: string,
  limit = 12,
): PprResult[] {
  const expanded = expandAliases(query, manifest.aliases);
  return index.search(expanded, { limit }) as unknown as PprResult[];
}
