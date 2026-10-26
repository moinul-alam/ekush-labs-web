# PPR 2025 Study Tool — Plan

**Status:** Phase 2 done — search index (L0 + L1) complete, next is Phase 3 application
**Target:** `tools.ekushlabs.com/ppr-2025-study`
**Data source:** `apps/hub/ppr/PPR2025.pdf` (10.64 MB, 271 pages)
**Tracker:** [progress-status.md](file:///c:/App/ekush-labs-web/progress-status.md)

---

## 1. Goal

Let a government officer land on one page, search in plain terms, and get: the ranked clause, its full text, its citation, and the exact page of the original PDF — fast enough and trustworthy enough to cite in an office note.

Non-goal for v1: free-text generated answers. Legal documents get extractive answers with citations only.

---

## 2. Locked decisions

| Decision | Choice | Reason |
|---|---|---|
| Text route | **Decode the legacy fonts** (Route B) | Keeps text and page anchors in one lineage; reusable for future editions |
| Corpus language | Bengali official text only | Single authoritative source |
| Search depth | L0 resolver + L1 lexical (MiniSearch) | Highest value, lowest risk |
| Hosting | Static on `apps/hub` + Astro page in `apps/tools` | Matches existing backendless pattern |
| Page anchors | From the original PDF | Verifiable by the user against the printed footer |
| v1 differentiators | Cross-reference graph, citation permalinks, glossary autolink | Practitioner value |
| QA oracle | Web version (`tendertradinginc.com`, PPR 2025 in dropdown) + internal validation | Independent plaintext without making it the source of truth |

---

## 3. Findings (verified in the pipeline, not estimated)

Measured by `scripts/extract.py` on the real file: 271 pages, 15,031 spans.

- The PDF is **not scanned** — it has a text layer, but most Bengali is encoded in **legacy Bangladeshi fonts** (`NikoshBAN`, `Nikosh`, `SutonnyMJ`) whose ToUnicode CMaps omit every Bengali letter. Those glyphs extract as `U+FFFD`.
- **31 font objects reduce to 8 legacy objects**: `Nikosh` ×2, `NikoshBAN` ×3, `SutonnyMJ` ×2, `SutonnyMJ,Bold` ×1.
- **Codes are object-local.** Glyph names follow `uniF0NN`, but `NN` is assigned per font object in that object's own glyph order, so the same code means different letters in different objects. Measured by outline comparison between two objects of one family: NikoshBAN 2 of 236 shared codes agree, Nikosh 3 of 140, SutonnyMJ 0 of 36.
- The embedded fonts are **subsetted** — each object still declares 1278 glyph slots but only the used ones have outlines (`Nikosh@171` 167, `NikoshBAN@175` 254, `NikoshBAN@651` 236) — and their cmaps expose only the PUA range with **zero Unicode entries**. Shape-based labelling is unavoidable.
- The real labelling unit is a **glyph shape**: Nikosh 188 distinct, NikoshBAN 268, SutonnyMJ 133. Of those, 456 (Nikosh + NikoshBAN) need a Unicode label; SutonnyMJ decodes from its ToUnicode. **All 456 are labelled as of 0.3, with 0 unmatched.**
- 94 glyph positions in `NikoshBAN@175` hit a glyph the cmap gives **no code** for, so they have no `(object, code)` site. They are named by their drawing alone (`~<shape id>` tokens) and counted in the census; all 94 draw nothing and merge into the blank shape, so they cost no extra review row.
- Spans name a font with the subset tag stripped, so a page that mounts two subsets of one family is ambiguous. One such pair exists (`NikoshBAN` 175 and 331 on 39 pages); the advance widths in the spans settle it — 331 is mounted but draws nothing.
- `scripts/reference_fonts/` holds `Nikosh.ttf` and `NikoshBAN.ttf` — **Unicode editions** of both faces (525 cmap entries, 94 Bengali codepoints, 708 GSUB ligature rules over `abvs, blwf, blws, half, haln, init, pres, pstf, psts, rphf, vatu`). They name the legacy shapes by drawing, and their ligature rules supply the logical-order Unicode for conjuncts, half forms, reph, vowel ligatures and য-ফলা. Also: raw outlines do not compare across the two fonts — the match needs `normalised_shape_key` (translation and uniform scaling removed, quantised to 1/1000 em) before it is exact.
- **Page offset is exact:** `gazette page = PDF index + 9559`, 0 footer mismatches on all 271 pages. No bookmarks, no page labels, no TOC structure in the file.
- **SutonnyMJ is readable today** — its ToUnicode is complete, so `resolved` is the standard SutonnyMJ/Bijoy ASCII string (`evsjv‡`k †M‡RU …` → `বাংলাদেশ গেজেট …`). It uses **pre-base vowel reordering** and ligature glyphs, so it needs a reorder step plus a SutonnyMJ→Unicode table, not a shape table.
- Acronyms extract cleanly: `ITT` ×49, `RFP` ×15, `HOPE` ×9, `EOI` ×8, `RFQ` ×5, `TEC` ×5. **`OTM` appears exactly once** — the alias table is required, not optional.

Character census (439,245 glyph positions):

| Content | Glyph positions | Share |
|---|---|---|
| Latin / digits (`CambriaMath`, `TimesNewRoman`, `Arial`, `Calibri`, `Cambria`) | 89,741 | 20.4% |
| Legacy fonts, mapped by ToUnicode (digits, punctuation, all of SutonnyMJ) | 171,113 | 39.0% |
| Legacy fonts, no ToUnicode (renders `U+FFFD`) | 177,669 | 40.5% |
| Unicode Bengali (`ShonarBangla`, `Kalpurush`, `NirmalaUI`, `Vrinda`) | 261 | 0.1% |
| `Symbol` / `Wingdings` | 353 | 0.1% |

An earlier spike quoted 214,787 chars and "3 legacy families, one table per family". **Both are superseded** — the total is not reproducible with the installed toolchain and the per-family table does not hold.

**Residual risk:** visual→logical reordering. If it is wrong, search silently degrades while looking correct. The validation harness (§7) exists specifically to catch this.

---

## 4. Repository layout

```
apps/hub/ppr/
  PPR2025.pdf                  # source of truth for page anchors + visual reference
  editions.json                # edition registry: offset, source PDF, supersedes
  source/ppr2025/              # canonical, git-audited corpus
    provisions/                # one file per chapter; human-reviewable diffs
    overrides/                 # manual corrections on top of auto-extraction
  schema/                      # JSON Schemas: edition, provision, index, refs
  scripts/
    ppr_common.py              # edition + family config, FontResolver, shape_id, code_key
    glyph_tables/
      families.json            # font name -> family / kind
      objects.json             # font object -> code -> shape id
      shapes/nikosh.json       # shape id -> Unicode + confidence/source/candidates
      shapes/nikoshban.json
      sutonnymj.json           # SutonnyMJ/Bijoy ASCII -> Unicode (no shapes)
    reference_fonts/            # Nikosh.ttf, NikoshBAN.ttf - Unicode editions: the shape + GSUB oracle
    extract.py                 # pdf -> per-page, per-span stream
    glyph_inventory.py         # font object + code -> shape; renders the review sheet (drafts pre-filled)
    label_shapes.py            # shape -> Unicode, by normalised-shape match + GSUB readings
    decode_legacy.py           # font object + code -> Unicode (data-driven)
    reorder.py                 # visual order -> logical order
    structure.py               # chapter / rule / sub-rule segmentation
    build_index.py             # provisions + MiniSearch + refs + glossary
    validate.py                # corpus QA harness
  build/                       # intermediate output, gitignored
  assets/                      # deployed to hub.ekushlabs.com/ppr/assets/
```

Tables are keyed so that a new font object only adds a `objects.json` block plus, at most, new shapes — nothing is hardcoded in `decode_legacy.py`.

The PDF stays in `hub`, never in `tools` — it is a shared asset, and Cloudflare egress is free.

---

## 5. Multi-edition design

Nothing about PPR 2025 may be hardcoded. Adding PPR 2028 must mean **one edition record plus new source files**.

- `editions.json` holds one record per edition: `id`, title, effective date, gazette date, source PDF, **page offset**, language, `supersedes`.
- `page_offset` lives in the edition record (PPR 2025 = `9559`), not in code.
- Provisions are foreign-keyed to `edition_id`. A provision ID is `ppr2025:42/3`.
- Glyph tables are keyed by **font object**, with a per-family **shape → Unicode** layer. Stored as versioned data. If a future edition ships in a Unicode format, no decoder is involved at all.

---

## 6. Phases

### Phase 0 — Text recovery (the critical path)

| # | Task | Exit criteria |
|---|---|---|
| 0.1 | Extract raw per-page, per-span stream (font object, code, page) | **Done** — 271 pages, 15,031 spans, offset `+9559` |
| 0.2 | Per-object code→shape inventory (outline hash) + rendered review sheet | **Done** — 8 legacy objects mapped, 589 shapes enumerated, 456 need a label, 39/39 ambiguous pages confirmed by advance width, 94 codeless glyphs captured by shape |
| 0.3 | Auto-label shapes against a reference Bengali font, plus frequency and oracle cross-checks | **Done** — all 456 shapes labelled, 0 unmatched; exact 68.7%/68.3%, ligature 8.6%/8.9%, ambiguous 4.5%/6.0%, blank 18.1%/16.7%; 335,883 glyph positions decode with 0 unknown |
| 0.4 | Human review of the tables | **Done** — `review_sheet.html` reviewed and accepted; the 0.3 drafts stand, no row changed by hand |
| 0.5 | Reorder visual → logical (required for SutonnyMJ pre-base vowels and ligatures) | **Done** — `reorder.py` run over all 15,031 spans (9,220 decoded); 515,361 visual → 510,504 logical chars; 0 hasanta left wrong; the fixed known-string list passes 10/10. SutonnyMJ still passes through (571 spans) pending its Unicode table — measured to be page furniture only, so no corpus text depends on it (see `progress-status.md` open question 4) |
| 0.6 | Validation harness | **Done** — `validate.py` runs checks 1, 2, 4, 5 (all pass) and reports 3 and 6 as skipped with a reason: 3 needs the rule segmentation Phase 1 produces, 6 is the external oracle |

### Phase 1 — Structure and corpus

| # | Task | Exit criteria |
|---|---|---|
| 1.1 | `structure.py` — segment chapters, parts, rules, sub-rules; page anchors; browse TOC; canonical corpus | **Done** — 9 chapters, 40 parts, 154 rules (series 1–154, no gaps), 17 schedules; both PDF index and printed gazette page per item; corpus committed to `apps/hub/ppr/source/ppr2025/`. Exit met: output byte-identical across two runs, and sampled clauses (rules 1, 3, 22–24, 149, 151–154) match the independent web edition exactly. `validate.py` check 3 now passes; check 4 tightened to *carries a provision* |

### Phase 2 — Search index (L0 + L1)

- L0 resolver: `৪২`, `42`, `rule 42`, `বিধি ৪২`, `schedule III` → direct jump.
- L1 MiniSearch build with Bengali handling: NFC normalization, ZWJ/ZWNJ stripping, **digits indexed in both Bengali and ASCII forms**, field boosting (title > tags > body).
- Alias table: `OTM ↔ ওটিএম ↔ উন্মুক্ত দরপত্র পদ্ধতি`, `e-GP ↔ ই-জিপি`, `দরপত্র ↔ টেন্ডার`.
- Facets: chapter, procurement method, unit.

**Exit:** a fixed benchmark query set (including the OTM case) returns the expected clause in the top 3.

**Done.** MiniSearch is JavaScript-only, so the Python builder emits **data**, not an index:
`build_index.py` writes `assets/ppr2025/documents.json` (171 provisions) and
`assets/ppr2025/index.json` (chapter/schedule tables, the **900-key** L0 resolver, the alias and
facet tables, a content hash). The client builds MiniSearch from those documents in
`apps/tools/src/lib/ppr/search.ts`, and `apps/tools/tests/ppr-search.test.ts` runs the fixed
benchmark over the shipped assets: **55/55 pass**, every ranked query in the top 3, `OTM` → rule ৭৮.
Rules own the bare numerals; schedules and chapters must be named (`তফসিল ৩`, `chapter 5`) because
their numbers collide with rules of the same number. Alias and facet vocabulary are edition data
(`source/ppr2025/aliases.json`, `facets.json`), not code. Refs/glossary deferred to Phase 4.

### Phase 3 — Application

- Landing: search box, chapter-wise browse, original PDF.
- Results: grouped by chapter with counts, short overview rows, page reference on each row.
- Clause detail: full text, citation line, copy-as-citation button, permalink.
- PDF jump: self-hosted **pdf.js** viewer with `?page=` and match highlighting. Not `#page=` fragments — unreliable in iframes and on mobile.

**Exit:** search → clause → correct PDF page, on desktop and mobile.

### Phase 4 — v1 differentiators

- Cross-reference graph: parse `refs` / `refs_by`, make every "subject to Rule X" clickable.
- Glossary: build from PPR's own definitions, auto-link terms in clause text.
- PWA/offline cache via content-hashed manifest, following the `bond` pattern.

---

## 7. Validation harness

`validate.py` must fail the build on any of:

1. Ungrammatical output — any residual control characters or unidentified glyphs.
2. Missing expected Bengali keywords (`বিধি`, `অধ্যায়`, `তফসিল`) at plausible frequency.
3. Broken rule numbering — the sequence of rules must be continuous with no gaps.
4. Unclaimed pages — every gazette page must be covered by at least one provision.
5. Reordering failures — a fixed list of known strings must decode exactly.
6. Oracle divergence above a set threshold against the web version.

Checks 1–5 are internal and offline. The oracle is a cross-check, never the source.

`validate.py` (0.6) implements 1, 2, 5 now, plus check 4 in its Phase-0 form — *every gazette page
carries text*; Phase 1 tightens that to *carries a provision*. Check 3 needs the rule boundaries
`structure.py` produces, so it is reported as skipped rather than quietly passed. Two counted,
classified groups are reported by check 1 without failing it — 108 `U+FFFD` in Unicode-Bengali
spans and 353 Symbol/Wingdings private-use codepoints; their disposition is open in
[progress-status.md](file:///c:/App/ekush-labs-web/progress-status.md) §"Open questions".

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Visual→logical reordering wrong | **High** | Validation checks 2, 5, 6; human review of sampled clauses |
| Glyph labeling errors | High | Render-based review sheet; frequency and oracle checks |
| Acronym coverage (`OTM` ×1) | Medium | Alias table required in Phase 2, not optional |
| Edition drift / amendments | Medium | Versioned corpus; pin source hash in manifest; show effective date in the UI |
| Legal | Low | Unofficial-reference disclaimer; never claim to be the gazette |

---

## 9. Progress log

| Date | Phase | Note |
|---|---|---|
| — | — | Plan agreed. Spike complete: legacy-font diagnosis, page offset `+9559` verified on all 271 pages. |
| 2026-10-26 | 0.1 | `extract.py` + `ppr_common.py` implemented and run. 271 pages, 15,031 spans, offset `+9559` with 0 footer mismatches. Corrected §3: 8 legacy font objects, object-local codes, shape-based labelling, SutonnyMJ pre-base reordering; retired the 214,787-char figure. Tracking moved to [progress-status.md](file:///c:/App/ekush-labs-web/progress-status.md). |
| 2026-10-26 | 0.2 | `glyph_inventory.py` implemented and run. All 8 legacy objects mapped to `objects.json`; 589 distinct shapes enumerated (456 need a label); `shapes/nikosh.json` and `shapes/nikoshban.json` drafted empty; `review_sheet.html` renders every shape as SVG for review. Streams now carry the font object per span. Corrected §3: NikoshBAN is 268 shapes in use, not 288 — `NikoshBAN@331` is mounted on 39 pages but draws nothing, and the subset tag needed to tell it from `@175` is not in the span. Also: 94 glyph positions have no cmap code, so `extract.py` names them by their drawing alone (`~<shape id>`) and the census counts them; all 94 are blank, so they merge into the blank shape and no shape is left unreviewable. |
| 2026-10-26 | 0.3 | `label_shapes.py` implemented and run. All 456 Nikosh + NikoshBAN shapes labelled, **0 unmatched**; 335,883 glyph positions decode with **0 unknown**. Matching compares `normalised_shape_key` (translation and uniform scaling removed) against the reference font's cmap and, decisively, against its **GSUB rules read as the Unicode they spell** — which supplies logical-order text for conjuncts, half forms, reph, vowel ligatures and য-ফলা, recursively, with no hand-written conjunct table. 49 rows are genuinely ambiguous (Assamese twins ৰ/ৱ, Bengali-vs-ASCII digits) and stay at 0.6 confidence with every candidate kept for 0.4. Corrected §3: the embedded fonts **are** subsetted (167/254/236 of 1278 glyphs drawn) and the reference fonts are Unicode editions with GSUB, not the same programs plus a cmap. |
| 2026-10-26 | 0.4 | Review sheet made a confirmation pass: it opens with the 0.3 drafts pre-filled, a badge per row saying how the reading was reached, candidate chips for the drawings the reference uses twice, and doubtful rows (the 49 ambiguous ones) ordered first with a counter that runs down as they are cleared. `label_shapes.py` runs first and its tables are read, not overwritten — a re-run of `glyph_inventory.py` preserves every label. Reviewed and accepted by the user: the drafts stood as drafted, nothing needed clearing by hand. |
| 2026-10-26 | 0.5 | `reorder.py` implemented and run over the whole stream: 15,031 spans (9,220 decoded, 5,811 passed through), 515,361 visual → 510,504 logical characters, **0 hasanta left wrong**, and the fixed known-string list (§7 check 5) passes **10/10** (নির্মাণ, সম্পর্কিত, যন্ত্রপাতি, কার্যকর, প্রতিষ্ঠানের, ঊর্ধ্বমুখ, লোকবল, কোনো, বিধিমালার, সংশ্লিষ্ট) with no leftover visual spelling. The whole rewrite is one fixed-point rule — a hasanta not followed by a consonant swaps with the letter before it, which inherits into conjuncts and nests the way the reference's GSUB does — plus a pending pre-base-matra move and a reph insert. Outputs `build/<edition>.text.jsonl` (both `visual` and `logical` per span) and `build/<edition>.reorder.json`. Gazetted pages 9560/9561/9564/9570 read as coherent Bengali. SutonnyMJ still passes through (571 spans) until its Unicode table lands. |
| 2026-10-26 | 0.6 | `validate.py` implemented and run: checks 1 (residual characters), 2 (expected keywords), 4 (page coverage) and 5 (known strings) **pass**, 0 fail; it exits non-zero if one fails, so the harness can gate a build. Check 1 scans every span and finds no control, surrogate or unassigned codepoint, and reports rather than hides the two classified groups it counts — 108 `U+FFFD` in Unicode-Bengali spans (`kalpurush` 82, `shonarbangla` 26, where the source PDF has no glyph either) and 353 private-use codepoints in `symbol` spans (Symbol/Wingdings' own encoding). Check 2 measures বিধি 507, অধ্যায় 30, তফসিল 231 against floors set far below. Check 4 confirms 271/271 gazette pages (9559–9829) carry text — the Phase-0 form of the criterion, to be tightened to "carries a provision" in Phase 1. Check 5 re-reads the built artifact for the fixed list. Checks 3 and 6 report as **skipped with a reason**, not as passes: 3 needs the rule boundaries `structure.py` will produce — measured on a page-joined read the main rule series runs 1–154 with no gaps, so the check has something real to assert once segmentation exists — and 6 is the external oracle. Phase 0 closed. |
| 2026-10-26 | 1.1 | `structure.py` implemented and run. Dedupe of the overprinted text layer drops 3,384 spans (15,031 → 11,647); rules are **aligned** greedily to the next-due number rather than matched, resolving the series to **1–154 with no gaps** and leaving 17 rejected candidates (`উদাহরণ ১।`, schedule table rows). Result: **9 chapters, 40 parts, 154 rules, 17 schedules**, page anchors for the PDF index and the printed gazette page. Defects are recorded, not dropped: chapter 2's heading is a `U+FFFD` ghost (synthesised and flagged), 24 image-only pages (9758–9762, 9782–9800) carry no text layer, and schedules ৬/১৪/১৫/১৬ fall on them. A chapter heading between two rule markers now **cuts** the rule above it, so `নবম অধ্যায় বিবিধ` no longer bleeds into rule ১৫০. Exit met: `ppr2025.structure.json` is byte-identical across two runs, and sampled clauses match the independent `procurementbd.com` edition exactly (rules 1, 3, 22–24, 149, 151–154). `validate.py` check 3 flips to **pass** and check 4 tightens to *carries a provision* (247 provision + 24 image = 271 pages); harness now pass 5 / fail 0 / skip 1. Canonical corpus written to `apps/hub/ppr/source/ppr2025/`. |
| 2026-10-26 | 2.1 | Search index built. `build_index.py` emits **data**, not an index (MiniSearch is JS-only): `assets/ppr2025/documents.json` (171 documents — 154 rules + 17 schedules, each with title/tags/text and page anchors) and `assets/ppr2025/index.json` (chapter + schedule tables, the **900-key** L0 resolver, the alias and facet tables, a content hash). The client builds MiniSearch from those documents in `apps/tools/src/lib/ppr/search.ts` with the Bengali handling §6 calls for — NFC + ZWJ/ZWNJ stripping, digits indexed in both scripts, `title > tags > body` boosting, alias expansion. Rules own the bare numerals; schedules and chapters must be named (`তফসিল ৩`, `chapter 5`) because their numbers collide with rules. One correction to §6: Python's `\W` drops Bengali combining marks (category `Mc`), which folds `বিধি` to `বধ` and breaks `বিধি ৪২`; both `fold_key` and `foldKey` now keep `\p{L}`/`\p{N}`/`\p{M}`. Exit met: `apps/tools/tests/ppr-search.test.ts` runs the fixed benchmark over the shipped assets — **55/55 pass**, every ranked query in the top 3, **`OTM` → rule ৭৮** included. Alias/facet vocabulary is edition data (`source/ppr2025/aliases.json`, `facets.json`), nothing hardcoded. Refs/glossary deferred to Phase 4. |
| 2026-10-26 | 3 | Application built in `apps/tools`. `StudyApp.svelte` is the island: chapter cards (ordinal, rule range, parts, page, "no heading" badge), a schedule grid, and the four image-only schedules listed separately; search resolves L0 first so `৪২`/`42`/`rule 42`/`বিধি ৪২` give a "jump straight to" card, then MiniSearch hits **grouped by chapter** with a page on every row; the clause view carries the full text, a citation line with copy-as-citation, a permalink and the PDF-page button. `PdfViewer.svelte` uses **pdf.js over the hub-hosted PDF** and opens a page by `?page=` — not `#page=`, which mobile and iframes drop — rendering the text layer with matches highlighted; the header shows the printed gazette number (`pdf page + pageOffset`). The view is the URL (`?clause/?chapter/?q/?page/?pdfq`), so links are shareable and restorable. Exit met: search → clause → correct gazette page, desktop and mobile (single column to `sm`, `sm:grid-cols-2 lg:grid-cols-3` above). |
| 2026-10-26 | 4 | v1 differentiators. **Cross-reference graph**: `build_index.py` now emits `refs`/`refsBy` per document (169 edges, 102 citing, 80 backlinks, 7 dangling) and `refs.ts` linkifies every `বিধি N`/`তফসিল N`/ordinal chapter in clause text, with "Refers to" and "Cited by" panels; refs the edition does not carry (image-only schedules/chapters) render disabled with a reason rather than vanishing. **Glossary**: 63 terms read off whichever rule the corpus itself titles সংজ্ঞার্থ, auto-linked in clause text — refs win on overlap, so a citation's `বিধি ৪২` links to the rule and not a headword — with a popover and a jump to the defining rule. **Offline cache** follows the `bond` pattern: `documents.json?v=<contentHash>` kept in Cache Storage keyed by that hash, network-first/cache-second, stale corpora pruned, and the UI marks a cache-served read. Wiring: bn + en pages with FAQ JSON-LD, `tools.ppr.*` i18n keys, Navbar entry, landing-page card. Verified: `vitest` **70/70**, `npm run build` clean with both routes prerendered. |
