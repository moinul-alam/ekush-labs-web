import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PprDocument, PprManifest } from '../src/lib/ppr/search';
import {
  annotateText,
  citation,
  clauseParam,
  linkGlossary,
  linkRefs,
  parseClauseParam,
  provisionId,
  refLabel,
  refParam,
  refResolves,
} from '../src/lib/ppr/refs';

/**
 * Phase 4 benchmark: the reference graph the builder emits must be the graph the
 * client draws. A link is only ever rendered where `refs` has an edge, and the
 * glossary must link from the corpus' own definitions.
 */
const assetsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../hub/ppr/assets/ppr2025');
const documents: PprDocument[] = JSON.parse(
  readFileSync(resolve(assetsDir, 'documents.json'), 'utf-8'),
).documents;
const manifest: PprManifest = JSON.parse(readFileSync(resolve(assetsDir, 'index.json'), 'utf-8'));

const byId = new Map(documents.map((document) => [document.id, document]));
const rule2 = byId.get('ppr2025:rule:2')!;
const rule44 = byId.get('ppr2025:rule:44')!;

describe('PPR reference graph', () => {
  it('publishes the graph, the glossary and the content hash', () => {
    expect(manifest.contentHash).toMatch(/^sha256-[0-9a-f]+$/);
    expect(manifest.references.edges).toBeGreaterThan(0);
    expect(manifest.glossary.length).toBeGreaterThan(0);
    expect(documents.every((document) => Array.isArray(document.refs))).toBe(true);
    expect(documents.every((document) => Array.isArray(document.refsBy))).toBe(true);
  });

  it('backlinks are the inverse of refs', () => {
    for (const document of documents) {
      for (const ref of document.refs) {
        if (ref.kind === 'chapter') continue;
        const target = byId.get(provisionId(manifest, ref.kind, ref.number));
        if (!target) continue;
        expect(target.refsBy.map((entry) => entry.id)).toContain(document.id);
      }
    }
  });

  it('cites rule ২ back from rule ৪৪', () => {
    expect(rule2.refsBy.map((ref) => ref.id)).toContain('ppr2025:rule:44');
    expect(rule44.refs).toContainEqual(
      expect.objectContaining({ kind: 'rule', number: 2, label: 'বিধি ২' }),
    );
  });
});

describe('inline references', () => {
  it('links every provision the clause names', () => {
    const refs = linkRefs(rule2.text, manifest)
      .filter((token) => token.ref)
      .map((token) => `${token.ref!.kind}:${token.ref!.number}`);
    expect(refs).toContain('rule:48');
    expect(refs).toContain('chapter:5');
  });

  it('never invents an edge the graph does not have', () => {
    for (const document of documents) {
      const drawn = new Set(
        annotateText(document.text, manifest, [])
          .filter((token) => token.ref)
          .map((token) => `${token.ref!.kind}:${token.ref!.number}`),
      );
      const declared = new Set(document.refs.map((ref) => `${ref.kind}:${ref.number}`));
      for (const edge of drawn) {
        expect(declared.has(edge)).toBe(true);
      }
    }
  });

  it('leaves বিধিমালা alone', () => {
    expect(linkRefs('এই বিধিমালায় বলা হইয়াছে', manifest).every((token) => !token.ref)).toBe(true);
  });

  it('resolves chapter references through the manifest ordinals', () => {
    const token = linkRefs('পঞ্চম অধ্যায় অনুসারে', manifest).find((entry) => entry.ref);
    expect(token?.ref).toMatchObject({ kind: 'chapter', number: 5 });
    expect(token?.text).toBe('পঞ্চম অধ্যায়');
  });

  it('knows which targets this edition actually carries', () => {
    expect(refResolves({ kind: 'rule', number: 154, label: '' }, manifest)).toBe(true);
    expect(refResolves({ kind: 'rule', number: 155, label: '' }, manifest)).toBe(false);
    expect(refResolves({ kind: 'schedule', number: 3, label: '' }, manifest)).toBe(true);
    expect(refResolves({ kind: 'schedule', number: 14, label: '' }, manifest)).toBe(false);
    expect(refParam({ kind: 'schedule', number: 14, label: '' }, manifest)).toBeNull();
  });

  it('labels a reference in both languages', () => {
    const ref = { kind: 'chapter' as const, number: 5, label: 'পঞ্চম অধ্যায়' };
    expect(refLabel(ref, 'bn')).toBe('পঞ্চম অধ্যায়');
    expect(refLabel(ref, 'en')).toBe('Chapter 5');
  });
});

describe('glossary', () => {
  it('auto-links a headword inside clause text', () => {
    const linked = linkGlossary(rule2.text, manifest.glossary).filter((token) => token.term);
    expect(linked.length).toBeGreaterThan(0);
    expect(linked.map((token) => token.term!.term)).toContain('অনুমোদনকারী কর্তৃপক্ষ');
    const authority = linked.find((token) => token.term!.term === 'অনুমোদনকারী কর্তৃপক্ষ')!;
    expect(authority.text).toBe('অনুমোদনকারী কর্তৃপক্ষ');
  });

  it('links each term once', () => {
    const ids = linkGlossary(rule2.text, manifest.glossary)
      .filter((token) => token.term)
      .map((token) => token.term!.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives way to a reference that spans the same text', () => {
    const tokens = annotateText('বিধি ৪৮ মোতাবেক অনুমোদন', manifest, manifest.glossary);
    const ref = tokens.find((token) => token.ref);
    expect(ref?.ref).toMatchObject({ kind: 'rule', number: 48 });
    expect(ref?.term).toBeUndefined();
  });

  it('points every term at a rule that exists', () => {
    for (const term of manifest.glossary) {
      expect(byId.has(provisionId(manifest, term.source.kind, term.source.number))).toBe(true);
    }
  });
});

describe('permalink and citation', () => {
  it('round-trips a clause parameter', () => {
    expect(clauseParam('rule', 42)).toBe('rule-42');
    expect(parseClauseParam('rule-42')).toEqual({ kind: 'rule', number: 42 });
    expect(parseClauseParam('schedule-13')).toEqual({ kind: 'schedule', number: 13 });
    expect(parseClauseParam('chapter-9')).toEqual({ kind: 'chapter', number: 9 });
    expect(parseClauseParam('rule-42-extra')).toBeNull();
    expect(parseClauseParam('৪২')).toBeNull();
  });

  it('cites the gazette page and the provision number', () => {
    const rule42 = byId.get('ppr2025:rule:42')!;
    expect(citation(rule42, manifest, 'bn')).toBe(
      `${manifest.title}, বিধি ৪২ (গেজেট পৃষ্ঠা ${'৯৫৮৯'})`,
    );
    expect(citation(rule42, manifest, 'en')).toBe(
      `${manifest.titleEn}, Rule 42 (gazette page 9589)`,
    );
  });
});
