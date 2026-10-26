import {
  BENGALI_DIGITS,
  type PprDocument,
  type PprGlossaryTerm,
  type PprManifest,
  type PprRef,
} from './search';

/**
 * Phase 4 reading aids over the corpus: the cross-reference graph (`refs` /
 * `refsBy`), the glossary, and the citation/permalink forms the clause view
 * needs.
 *
 * The reference patterns mirror build_index.py exactly — same words, same
 * chapter ordinals read from the manifest — so a link is only ever drawn where
 * the graph has an edge. Nothing about PPR 2025 is hardcoded: the chapter
 * vocabulary comes from `manifest.chapters`, and every label is used as the
 * corpus spells it.
 */

/** A run of clause text, optionally carrying the provision or glossary term it names. */
export interface PprTextToken {
  text: string;
  ref?: PprRef;
  term?: PprGlossaryTerm;
}

export type PprClauseKind = 'rule' | 'schedule' | 'chapter';

const RULE_REF = /বিধি\s*([০-৯]+)/g;
const SCHEDULE_REF = /তফসিল\s*([০-৯]+)/g;

const EN_KINDS: Record<PprClauseKind, string> = {
  rule: 'Rule',
  schedule: 'Schedule',
  chapter: 'Chapter',
};
const BN_KINDS: Record<PprClauseKind, string> = {
  rule: 'বিধি',
  schedule: 'তফসিল',
  chapter: 'অধ্যায়',
};

export function toBengaliDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)]);
}

function fromBengaliDigits(text: string): number {
  return Number(
    [...text].map((char) => (BENGALI_DIGITS.includes(char) ? BENGALI_DIGITS.indexOf(char) : char)).join(''),
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** `${edition}:${kind}:${number}`, the provision id every document carries. */
export function provisionId(manifest: PprManifest, kind: PprClauseKind, number: number): string {
  return `${manifest.edition}:${kind}:${number}`;
}

/** Does the edition actually carry the provision a reference points at? */
export function refResolves(ref: PprRef, manifest: PprManifest): boolean {
  if (ref.kind === 'rule') {
    return ref.number >= 1 && ref.number <= (manifest.counts.rules ?? 0);
  }
  if (ref.kind === 'schedule') {
    return manifest.schedules.some((schedule) => schedule.number === ref.number);
  }
  return manifest.chapters.some((chapter) => chapter.number === ref.number);
}

/** `rule-42` — the value carried in the `?clause=` permalink. */
export function clauseParam(kind: PprClauseKind, number: number): string {
  return `${kind}-${number}`;
}

export function parseClauseParam(value: string): { kind: PprClauseKind; number: number } | null {
  const match = /^(rule|schedule|chapter)-(\d+)$/.exec(value);
  if (!match) return null;
  return { kind: match[1] as PprClauseKind, number: Number(match[2]) };
}

/** The permalink to a reference, or null when the target is not in this edition. */
export function refParam(ref: PprRef, manifest: PprManifest): string | null {
  return refResolves(ref, manifest) ? clauseParam(ref.kind, ref.number) : null;
}

/** The corpus spells it in Bengali; English builds it from the kind and number. */
export function refLabel(ref: PprRef, lang: 'bn' | 'en'): string {
  if (lang === 'bn') return ref.label;
  return `${EN_KINDS[ref.kind]} ${ref.number}`;
}

export function provisionLabel(document: PprDocument, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    return `${BN_KINDS[document.kind]} ${toBengaliDigits(document.number)}`;
  }
  return `${EN_KINDS[document.kind]} ${document.number}`;
}

/** The line a reader pastes into a note, a memo or a court submission. */
export function citation(document: PprDocument, manifest: PprManifest, lang: 'bn' | 'en'): string {
  const title = lang === 'bn' ? manifest.title : manifest.titleEn;
  const label = provisionLabel(document, lang);
  const page =
    lang === 'bn'
      ? `গেজেট পৃষ্ঠা ${toBengaliDigits(document.page)}`
      : `gazette page ${document.page}`;
  return `${title}, ${label} (${page})`;
}

interface Span {
  start: number;
  end: number;
  ref?: PprRef;
  term?: PprGlossaryTerm;
}

/** Cut `text` at the spans, keeping everything in between as plain runs. */
function toTokens(text: string, spans: Span[]): PprTextToken[] {
  const tokens: PprTextToken[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) tokens.push({ text: text.slice(cursor, span.start) });
    tokens.push({
      text: text.slice(span.start, span.end),
      ...(span.ref ? { ref: span.ref } : {}),
      ...(span.term ? { term: span.term } : {}),
    });
    cursor = span.end;
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor) });
  return tokens;
}

/** The chapter vocabulary is edition data, so the pattern is built from it. */
function chapterPattern(manifest: PprManifest): RegExp | null {
  const ordinals = manifest.chapters.map((chapter) => chapter.ordinal).filter(Boolean);
  if (!ordinals.length) return null;
  return new RegExp(`(${ordinals.map(escapeRegExp).join('|')})\\s*অধ্যায়`, 'g');
}

/**
 * Every provision the clause names, in reading order. Overlaps are dropped in
 * favour of the earlier, longer match, so a run is never cut twice.
 */
function refSpans(text: string, manifest: PprManifest): Span[] {
  const found: Span[] = [];

  for (const match of text.matchAll(RULE_REF)) {
    found.push({
      start: match.index,
      end: match.index + match[0].length,
      ref: { kind: 'rule', number: fromBengaliDigits(match[1]), label: match[0] },
    });
  }
  for (const match of text.matchAll(SCHEDULE_REF)) {
    found.push({
      start: match.index,
      end: match.index + match[0].length,
      ref: { kind: 'schedule', number: fromBengaliDigits(match[1]), label: match[0] },
    });
  }

  const chapters = chapterPattern(manifest);
  if (chapters) {
    const byOrdinal = new Map(manifest.chapters.map((chapter) => [chapter.ordinal, chapter.number]));
    for (const match of text.matchAll(chapters)) {
      const number = byOrdinal.get(match[1]);
      if (number === undefined) continue;
      found.push({
        start: match.index,
        end: match.index + match[0].length,
        ref: { kind: 'chapter', number, label: match[0] },
      });
    }
  }

  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Span[] = [];
  let cursor = -1;
  for (const span of found) {
    if (span.start < cursor) continue;
    kept.push(span);
    cursor = span.end;
  }
  return kept;
}

/** Split clause text at every provision it cites, so the UI can link them. */
export function linkRefs(text: string, manifest: PprManifest): PprTextToken[] {
  return toTokens(text, refSpans(text, manifest));
}

/**
 * Split clause text at glossary terms. Longest term first, and one link per
 * term, so a definition that quotes its own headword stays readable.
 */
export function linkGlossary(text: string, glossary: PprGlossaryTerm[]): PprTextToken[] {
  const keys = glossary
    .flatMap((term) => [term.term, ...term.aliases].map((key) => ({ key, term })))
    .filter((entry) => entry.key.length > 1)
    .sort((a, b) => b.key.length - a.key.length);

  const spans: Span[] = [];
  const linked = new Set<string>();
  let index = 0;
  while (index < text.length) {
    const hit = keys.find(({ key, term }) => !linked.has(term.id) && text.startsWith(key, index));
    if (!hit) {
      index += 1;
      continue;
    }
    spans.push({ start: index, end: index + hit.key.length, term: hit.term });
    linked.add(hit.term.id);
    index += hit.key.length;
  }
  return toTokens(text, spans);
}

/**
 * Refs win over glossary terms: a citation's `বিধি ৪৮` must link to the rule,
 * not to a headword that happens to contain the same letters. Glossary terms
 * are only sought in the plain runs between refs.
 */
export function annotateText(
  text: string,
  manifest: PprManifest,
  glossary: PprGlossaryTerm[],
): PprTextToken[] {
  return linkRefs(text, manifest).flatMap((token) =>
    token.ref ? [token] : linkGlossary(token.text, glossary),
  );
}
