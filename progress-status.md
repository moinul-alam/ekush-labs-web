# PPR Study Tool — Progress Status

Operational tracker for [ppr-plan.md](file:///c:/App/ekush-labs-web/ppr-plan.md).
Task-level detail, commands, artifacts and blockers live here; the plan keeps the milestone log.

- **Current phase:** Phase 3 — Application **complete** (3.1 landing/chapter browse, 3.2 search → clause
  → PDF jump) and Phase 4 — v1 differentiators **complete** (4.1 cross-reference graph, 4.2 glossary,
  4.3 offline cache). All plan phases are done; the tool ships at `tools.ekushlabs.com/ppr-2025-study`.
- **Last updated:** 2026-10-26
- **Working dir for all commands:** `apps/hub/ppr/scripts` (pipeline) / `apps/tools` (app)

---

## Task board

| # | Task | Status | Evidence |
|---|---|---|---|
| 0.1 | `extract.py` — raw per-page / per-span stream | **Done** | 271 pages, 15,031 spans, 0 footer mismatches, offset `+9559`; each span now carries its font object |
| 0.2 | Glyph inventory + review sheet | **Done** | 8/8 legacy objects mapped; 589 distinct shapes (456 need a label); 39/39 collision pages confirmed; 94 codeless glyphs labelled by shape; `review_sheet.html` built |
| 0.3 | `label_shapes.py` — auto-label glyph tables | **Done** | 456/456 shapes labelled, **0 unmatched**; 335,883 Nikosh + NikoshBAN glyph positions decode, **0 unknown** |
| 0.4 | Human review of tables | **Done** | `review_sheet.html` reviewed and accepted by the user; the 0.3 drafts stand, no row changed by hand |
| 0.5 | `reorder.py` visual → logical | **Done** | 15,031 spans (9,220 decoded, 5,811 passed through); 515,361 visual → 510,504 logical chars; **0 hasanta violations**; known strings **10/10** pass |
| 0.6 | `validate.py` harness | **Done** | checks 1, 2, 4, 5 **pass**, 0 fail; 3 and 6 skipped with a reason (need Phase 1 rule segmentation / the external oracle) |
| 1.1 | `structure.py` — chapters / parts / rules / sub-rules | **Done** | 9 chapters, 40 parts, **154 rules (series 1–154, no gaps)**, 17 schedules; TOC + canonical corpus committed to `source/ppr2025/`; output byte-identical across two runs |
| 2.1 | `build_index.py` + client search + benchmark | **Done** | `documents.json` 171 docs (154 rules + 17 schedules), `index.json` 900 resolver keys + 15 alias groups + 3 facets; MiniSearch benchmark **55/55 pass**, expected clause in the top 3 for every ranked query incl. `OTM` → rule 78 |
| 3.1 | Landing: search box, chapter browse, schedules | **Done** | `StudyApp.svelte` — chapter cards (rule range, parts, page), schedule grid, "missing" notice for the 4 image-only schedules, search box with L0 direct-jump card |
| 3.2 | Clause detail + PDF jump | **Done** | Clause view: full text, gazette page/sub-rules badges, citation + copy-as-citation, permalink, results grouped by chapter; `PdfViewer.svelte` (pdf.js from the hub) opens `?page=` with in-page match highlighting; `?clause/?chapter/?q/?page/?pdfq` round-trip |
| 4.1 | Cross-reference graph | **Done** | `refs.ts` links every `বিধি N`/`তফসিল N`/ordinal chapter in clause text; "Refers to" + "Cited by" panels; 169 edges / 102 citing / 80 backlinks / 7 dangling (image-only schedules), unresolved refs shown disabled |
| 4.2 | Glossary | **Done** | 63 terms read off the corpus's own সংজ্ঞার্থ rule; auto-linked in clause text (refs win on overlap); popover with definition and a jump to the defining rule; "Terms defined here" panel |
| 4.3 | Offline cache (bond pattern) | **Done** | `data.ts` fetches `documents.json?v=<contentHash>`, keeps it in Cache Storage keyed by the hash, network-first/cache-second, prunes stale corpora; the UI marks a cached read |
| 4.4 | Wiring + verification | **Done** | `ppr-2025-study.astro` (+ `en/`), i18n keys, Navbar entry, ToolsPage card; `vitest` **70/70** pass; `astro build` clean, both routes prerendered |


---

## Artifacts on disk

| Path | What | Served? |
|---|---|---|
| `apps/hub/ppr/editions.json` | Edition registry (page offset, source PDF, supersedes) | yes (future) |
| `apps/hub/ppr/scripts/ppr_common.py` | Shared helpers: edition/family config, `FontResolver` (code + shape + outline + `normalised_shape_key`), `shape_id`, `font_object_key` | no |
| `apps/hub/ppr/scripts/extract.py` | Phase 0.1 extractor | no |
| `apps/hub/ppr/scripts/glyph_inventory.py` | Phase 0.2 inventory + attribution check + review sheet | no |
| `apps/hub/ppr/scripts/label_shapes.py` | Phase 0.3 shape labeller: normalised shape key + reference cmap/GSUB | no |
| `apps/hub/ppr/scripts/reorder.py` | Phase 0.5 visual → logical rewriter (pre-base matras, reph, half-form hasanta) | no |
| `apps/hub/ppr/scripts/validate.py` | Phase 0.6 / 1.1 QA harness: the plan §7 checks, run offline | no |
| `apps/hub/ppr/scripts/structure.py` | Phase 1.1 segmenter: chapters, parts, rules, sub-rules, page anchors, TOC, canonical corpus | no |
| `apps/hub/ppr/scripts/glyph_tables/families.json` | Font-name → family/kind classification, `referenceFont` per family | no |
| `apps/hub/ppr/scripts/glyph_tables/objects.json` | Font object → code → shape id (the decode key) | no |
| `apps/hub/ppr/scripts/glyph_tables/shapes/nikosh.json` | Shape id → Unicode + confidence/source/candidates, 188 rows, drafted by 0.3 | no |
| `apps/hub/ppr/scripts/glyph_tables/shapes/nikoshban.json` | Shape id → Unicode + confidence/source/candidates, 268 rows, drafted by 0.3 | no |
| `apps/hub/ppr/scripts/reference_fonts/Nikosh.ttf`, `NikoshBAN.ttf` | Unicode editions of both faces (94 Bengali codepoints, 708 GSUB ligature rules) — the 0.3 oracle | no |
| `apps/hub/ppr/build/ppr2025.stream.jsonl` | 15,031 span records (page, gazette page, font, **object**, family, codes, resolved) | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.inventory.json` | Font objects, per-family code frequency, auto table, footer check | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.shapes.json` | Shape census: sites, frequency, attribution check | no (gitignored) |
| `apps/hub/ppr/build/review_sheet.html` | Rendered shapes, most frequent first, exports `<family>.json` | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.labels.json` | Phase 0.3 labelling report: tier shares, top readings, garbage check | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.text.jsonl` | Phase 0.5 reordered text: one record per span (`p`,`g`,`f`,`o`,`fam`,`visual`,`logical`) | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.reorder.json` | Phase 0.5 report: counts, known-string checks, hasanta violations | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.validation.json` | Phase 0.6 QA report: every plan §7 check, its status and detail | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.structure.json` | Phase 1.1 report: chapters, parts, rules, sub-rules, schedules, defects, rejected markers | no (gitignored) |
| `apps/hub/ppr/build/ppr2025.toc.json` | Phase 1.1 browse table of contents (chapters + schedules with page anchors) | no (gitignored) |
| `apps/hub/ppr/source/ppr2025/index.json` | Canonical corpus index: chapter list + TOC (served) | yes (future) |
| `apps/hub/ppr/source/ppr2025/provisions/chapter-NN.json` | Canonical corpus, one file per chapter (rules, sub-rules, page anchors) | yes (future) |
| `apps/hub/ppr/source/ppr2025/provisions/schedules.json` | Canonical corpus: schedule headings + the four recoverable-missing ones | yes (future) |
| `apps/hub/ppr/source/ppr2025/aliases.json` | Edition-data alias table (15 groups: `otm`, `egp`, `tender`, …) — the acronym coverage the plan flags | yes (future) |
| `apps/hub/ppr/source/ppr2025/facets.json` | Edition-data facet vocabulary (`chapter` structural; `method`, `unit` term-driven) | yes (future) |
| `apps/hub/ppr/scripts/build_index.py` | Phase 2.1 builder: corpus → `documents.json` + `index.json` (resolver, aliases, facets) | no |
| `apps/hub/ppr/assets/ppr2025/documents.json` | 171 provision documents (154 rules + 17 schedules) with title/tags/text, page anchors, `refs`/`refsBy` | yes (served) |
| `apps/hub/ppr/assets/ppr2025/index.json` | Search manifest: counts, chapter/schedule tables, L0 resolver (900 keys), alias + facet tables, glossary (63 terms), reference counts, `contentHash`, `pageOffset`, `pdfPages` | yes (served) |
| `apps/tools/src/lib/ppr/search.ts` | Client search: Bengali normalisation, digit-script variants, alias expansion, MiniSearch build, L0 resolver, corpus types | bundled |
| `apps/tools/src/lib/ppr/refs.ts` | Phase 4 reading aids: reference/glossary span linking (`annotateText`), citation, permalink params, `refResolves` | bundled |
| `apps/tools/src/lib/ppr/data.ts` | Corpus loader: `?v=<hash>` fetch + Cache Storage offline copy (network-first, cache-second, stale-pruning) | bundled |
| `apps/tools/src/components/ppr/StudyApp.svelte` | Phase 3/4 study island: search, chapter browse, clause detail, refs/glossary panels, URL state | bundled |
| `apps/tools/src/components/ppr/PdfViewer.svelte` | pdf.js gazette viewer: `?page=`, zoom, keyboard nav, in-page match highlight | bundled |
| `apps/tools/src/pages/ppr-2025-study.astro`, `en/ppr-2025-study.astro` | Tool pages (bn + en) with FAQ JSON-LD | served |
| `apps/tools/tests/ppr-search.test.ts` | Phase 2 exit benchmark (vitest) over the emitted assets | no |
| `apps/tools/tests/ppr-refs.test.ts` | Phase 4 benchmark (vitest): backlink inverse, ref/glossary linking, citation, permalink round-trip | no |

`apps/hub/ppr/build/` and `__pycache__/` are gitignored.

---

## How to run

```powershell
cd apps/hub/ppr/scripts
python extract.py                 # defaults to --edition ppr2025
python extract.py --edition ppr2025
python glyph_inventory.py         # needs extract.py to have run first
python label_shapes.py            # needs glyph_inventory.py to have run first
python glyph_inventory.py         # re-run to render review_sheet.html with those drafts
python reorder.py                 # needs extract.py + the glyph tables to have run first
python validate.py                # needs reorder.py to have run first
python structure.py               # needs reorder.py to have run first; writes the corpus + TOC
python build_index.py             # needs structure.py to have run first; writes assets/<edition>/
```

The benchmark runs from the repo root:

```powershell
npm test --workspace=apps/tools   # PPR search + refs + the other tool test suites
```

The app builds and serves from `apps/tools`:

```powershell
cd apps/tools
npm run dev                       # /ppr-2025-study and /en/ppr-2025-study
npm run build                     # production build (cloudflare adapter)
```

The corpus and the PDF are read from the hub, and `apps/hub/ppr/assets/` is not published yet
(the PDF is, the JSON is not), so **`npm run dev` needs a local hub** until it is. Serve one with
CORS — the app fetches it cross-origin and a plain static server sends no
`Access-Control-Allow-Origin`:

```powershell
npx http-server apps/hub -p 8788 --cors    # from the repo root, in a second terminal
```

`apps/tools/.env.development` (git-ignored) points the two URLs at it via
`PUBLIC_PPR_ASSETS_BASE_URL` / `PUBLIC_PPR_PDF_URL`; without that file `src/lib/ppr/data.ts`
falls back to the published hub. `astro build` loads `.env` / `.env.production`, never
`.env.development`, so a production build keeps the published URLs — verified by grepping
`dist/_astro/*.js`: 2 hits on `hub.ekushlabs.com/ppr`, 0 on `localhost:8788`.

Requires `pymupdf` (1.28.5) and `fonttools` (4.65.0), Python 3.14.

---

## Verified results of Phase 0.1

```
Pages            : 271
Spans            : 15031
Footer mismatch  : 0   (page offset 9559)
Font objects     : 31   (39 duplicate-name cases)
```

Character census (glyph positions from `get_texttrace`, 439,245 total):

| Content | Glyph positions | Share |
|---|---|---|
| Latin / digits (`CambriaMath`, `TimesNewRoman`, `Arial`, `Calibri`, `Cambria`) | 89,741 | 20.4% |
| Legacy fonts, mapped by ToUnicode (digits, punctuation, all of SutonnyMJ) | 171,113 | 39.0% |
| Legacy fonts, **no ToUnicode** (renders U+FFFD) | 177,669 | 40.5% |
| Unicode Bengali (`ShonarBangla`, `Kalpurush`, `NirmalaUI`, `Vrinda`) | 261 | 0.1% |
| `Symbol` / `Wingdings` | 353 | 0.1% |
| Unicode Bengali fonts, **no glyph** (renders U+FFFD) | 108 | 0.0% |

The duplicate-name count was 0 until 0.2 — see correction 7.

---

## Verified results of Phase 0.2

```
Legacy objects   : 8
Attribution      : 39/39 collision pages confirmed by advance width
Shapes needing a Unicode label: 456
```

| Family | Objects | Codes (sites) | Shapes in use | Glyphs |
|---|---|---|---|---|
| Nikosh | 2 | 307 | **188** | 16,214 |
| NikoshBAN | 3 | 515 | **268** | 319,669 |
| SutonnyMJ | 3 | 135 | 133 (not shape-labelled) | 12,899 |

589 distinct drawings across the three families; 456 of them (Nikosh + NikoshBAN) need a
Unicode label. Every one of the 8 legacy objects is in `objects.json`, including
`NikoshBAN@331`, which turns out to be mounted on 39 pages but used by no span — see
correction 7.

### Glyphs with no code

94 glyph positions in NikoshBAN@175 hit a glyph the cmap gives no code for. They have no
`(object, code)` site, so they are named by their drawing alone: `extract.py` emits a
`~<shape id>` token for them and `glyph_inventory.py` counts them in the census. All 94 draw
nothing, so they collapse into the blank shape `97d170e155` (correction 8) and the sheet
renders them the same as the coded blank at `NikoshBAN@175:05`. The row is therefore not
lost, and the fingerprinted-key approach has no blind spot left.

### The decode key is now data

`objects.json` holds `font object → code → shape id`; `shapes/<family>.json` holds
`shape id → Unicode` (empty until reviewed). A new font object needs a new `objects.json`
block and, at most, new shape rows — nothing in code. The same drawing reached through two
objects is one row in the sheet; one code in two objects is two rows.

### Attribution check

Spans carry the font name with the subset tag stripped, so on a page that mounts two
subsets of one family the choice is a guess. `glyph_inventory.py` checks it against the
per-character advance width in the span: 39 of 39 collision pages agree with the choice
`extract.py` made (last-listed wins). 716 spans match their object at ≥90% of characters;
no span matches the unused object.

### Review sheet

`build/review_sheet.html` — one card per shape, drawn as inline SVG from the embedded
outlines. Each card shows the shape id, its occurrence count and every `object:code` site that
reaches it, takes the Unicode, and carries a **badge** saying how the 0.3 draft reached the
reading it opens with (exact / ligature / ambiguous / unmatched / blank) plus **chips** for
every candidate reading of that drawing, one click to fill the field.

Rows are ordered **doubtful first** — ambiguous, then unmatched, then ligature, then exact,
then blank — and by frequency within a tier, so 0.4 meets the 49 forced choices before the 407
settled ones. Edits are kept in `localStorage`; a badge flips to `edited` as soon as a field no
longer holds the draft, and the section's export button counts down the doubtful rows left.
Each family exports a `<family>.json` in the `shapes/` shape, blank row included.

The drafts are read from `glyph_tables/shapes/*.json`, so the sheet opens empty if 0.3 has not
run yet — the two steps stay independent.

---

## Verified results of Phase 0.3

```
Nikosh      188 shapes    16,214 glyph positions
NikoshBAN   268 shapes   319,669 glyph positions
Unmatched shapes: 0        Unmatched glyph positions: 0
```

| Tier | `source` | Confidence | Nikosh rows / glyphs | NikoshBAN rows / glyphs |
|---|---|---|---|---|
| exact | `shape-match` | 1.0 | 83 / 11,141 (68.7%) | 92 / 218,338 (68.3%) |
| ligature | `shape-match-ligature` | 0.9 | 90 / 1,400 (8.6%) | 140 / 28,508 (8.9%) |
| ambiguous | `shape-match-ambiguous` | 0.6 | 14 / 730 (4.5%) | 35 / 19,347 (6.0%) |
| blank | `blank` | 0.9 | 1 / 2,943 (18.1%) | 1 / 53,476 (16.7%) |
| unmatched | — | — | 0 / 0 | 0 / 0 |

Every row of the review sheet now carries a drafted reading; the sheet is left with nothing
unreachable.

### How a shape is named

Raw outlines do not compare across the two fonts — the legacy glyph is the same letterform
drawn at a different size and origin, and `shape_id` rounds raw coordinates, so it finds
almost nothing. `normalised_shape_key` removes translation and uniform scaling first
(quantised to 1/1000 em) and **then the match is exact**: e.g. `8048d450f7` in the reference
table names the legacy shape of the same id.

The reference font is read twice:

- **its cmap**, drawing by drawing. This names every base letter and matra — the `exact` tier.
- **its GSUB rules**, each rewritten as the Unicode the rule spells. A conjunct is one glyph
  in a legacy font but a sequence in the reference, and the reference carries that conjunct as
  its own ligature glyph, so the same drawing match names it — and names it in **logical
  order**, because that is how the rules are written. Components are themselves often
  ligatures (half forms) and a context-specific drawing is a one-for-one substitution of the
  letter it draws, so both rule kinds are followed recursively to a fixed point (12 rounds).
  This is the `ligature` tier: 230 rows, 29,908 glyph positions, incl. reph (`rphf`),
  vowel ligatures (`vatu`), য-ফলা (`psts`) and conjunctions like ক্ত/ক্ষ/ন্ত্র (`pres`).

### Ambiguity left ambiguous, on purpose

49 rows resolve to a drawing the reference uses for two things:

- **the Assamese twin of a Bengali letter** — ৰ is drawn as র, ৱ as ব (0x09F0, 0x09F1);
- **Bengali vs ASCII digits** — ১ and 1 are the same drawing.

These get confidence 0.6, the chosen reading picked by `reading_rank` (non-Assamese first, then
in-block, then shortest/lowest) and **every candidate kept** in `candidates` for 0.4. One row
to look at by hand: the reph reading tabulated from `pres` stores `র` + hasanta (`\u09b0\u09cd`),
which is right, but it is the one reph that did not come from `rphf`.

### End-to-end check

Decoding the whole stream through the new tables: **335,883 Nikosh + NikoshBAN glyph positions
decoded, 0 unknown** (no `~` or `=` token left unresolved, no shape with an empty reading).
The labelling report's `garbageReadings` is empty for both families — no control, surrogate or
private-use codepoint reached a reading. Spot-checked pages 60/61 read as coherent Bengali
(e.g. `দক্ষতা িনরূপণােথর্`).

---

## Verified results of Phase 0.5

```
Spans            : 15031  (9220 decoded, 5811 passed through)
Characters       : 515361 visual -> 510504 logical
Hasanta left wrong: 0
Known strings    : 10/10 pass
```

| Known string (visual) | Logical | Seen |
|---|---|---|
| `িনমর্াণ` | নির্মাণ | 17 |
| `সম্পিকর্ত` | সম্পর্কিত | 30 |
| `যন্তর্পািত` | যন্ত্রপাতি | 30 |
| `কাযর্কর` | কার্যকর | 12 |
| `পর্িতষ্ঠােনর` | প্রতিষ্ঠানের | 34 |
| `ঊধব্র্মুখ` | ঊর্ধ্বমুখ | 1 |
| `েলাকবল` | লোকবল | 5 |
| `েকােনা` | কোনো | 458 |
| `িবধিমালার` | বিধিমালার | 41 |
| `সংিশ্লষ্ট` | সংশ্লিষ্ট | 189 |

Every known form is gone from the output — 0 leftover visual spellings. Writes
`build/<edition>.text.jsonl` (one record per span, carrying both the raw `visual` and the
`logical` string) and `build/<edition>.reorder.json`; the script exits 1 if any check fails.

### What the rewrite is

One fixed-point rule plus two session-local moves, all read off real tokens, not guessed:

- **Half-form hasanta.** A hasanta not followed by a consonant swaps with the letter before it
  (`র`+`্`+`চ` → `্র`+`চ`), and this **inherits into conjuncts** — `পর্`→`প্র`, `নয্`→`ন্য`,
  `দব্`→`দ্ব`, `ন্তর্`→`ন্ত্র`, `যন্তর্পািত`→`যন্ত্রপাতি`. It repeats to a fixed point because the
  reference nests ligatures (e.g. `বর্য্` needs two passes: `ব`+`র্` is itself a ligature).
- **Pre-base matras** (`ি ে ৈ`, and the `ে` inside `ো`/`ৌ`) are painted *before* their
  consonant cluster; a matra+consonant ligature stored matra-first (`িট`) is emitted
  consonant-first (`টি`). The matra is held pending until its base cluster is emitted.
- **Reph** `র্` is painted *after* its base consonant and is inserted before the last consonant
  already emitted (`সম্পিকর্ত` → `স` `ম্প` `ি` `ক` `র্` `ত` → `সম্পর্কিত`).

### End-to-end check

Dumped the concatenated `logical` text of gazette pages 9560, 9561, 9564 and 9570 and read it:
coherent Bengali — e.g. page 9564 reads `...অর্পিত ক্রয়কার্য (Delegated procurement)...`,
`প্রাকযোগ্যতা`, `পণ্যসরবরাহ`; page 9570 reads rule ৭ `দরপত্রের মূল্য নির্ধারণে অনুসরণীয় বিধান`,
`গন্তব্যস্থলে`, `বিধিমালায়`, `পণ্যসম্পাদন`, `পূর্বোক্ত উত্তর`.

### Known limitation

**SutonnyMJ spans pass through unchanged — but none of them reach the corpus (571 spans).**
Its readings are the SutonnyMJ/Bijoy ASCII string, not shape-labelled Unicode, so its pre-base
vowels are still stored before their consonant until the SutonnyMJ→Unicode table lands. The
other passthrough spans are non-reorderable by nature: other 4,797, `symbol` 353, `shonarbangla`
41, `kalpurush` 36, `nirmala` 9, `vrinda` 4.

The 571 spans are 12,899 characters (2.5% of the stream, from `reorder.py`), drawn on all 271
pages by three objects — xref 159 (382 spans), 647 (182), 163 `SutonnyMJ,Bold` (7). They are
page furniture, and `structure.py` removes them: the masthead, the running header, the printed
page label and the price footer, all matched by `HEADER_RE` / `PAGE_LABEL_RE` / `PRICE_RE`.

Eleven of the 571 escape those regexes, in three groups: **8 on the cover** (pdf page 0 — the
registration line `†iwR÷vW© bs wW G-1`, the publication line, `iweevi, 28, 2025`, and the cover
reference numbers `13`, `28`, `388-`, none of which match the `(\d{4})` label pattern); **2 printing
colophons** on pdf page 270 (`মোহাম্মদ আবু ইউসুফ… কর্তৃক মুদ্রিত।` and `মোঃ নরজুল ইসলাম… কর্তৃক
প্রকাশিত।`); and **1 running-header variant** on pdf page 152, `evsjv‡`k †M‡RU, AwZwi³, †m‡Þ¤^i 28
2025 9711`, which `HEADER_RE` misses because it reads `28 2025` without the comma the pattern
requires. All eleven still stay out of the corpus: the cover and the colophons fall outside rule
bounds, and the page-152 header sits *after* `body_end` — that page opens the schedules, and schedule
bodies begin at their own marker, so it is excluded too. Rule 154 ends on its own sentence, not the
colophon.

Measured: the canonical corpus and the shipped assets contain **zero** SutonnyMJ lookalike
characters (`† ‡ ¤ ÷ ³ Þ æ …`), and zero non-Bengali script leakage. The only non-Bengali mark
anywhere is `±` (U+00B1) ×2 in chapter 4 — `দরদাতা ±৫% বা ৯৫.০০ লক্ষ টাকা…` — a genuine
plus-minus sign. So this limitation costs the shipped tool nothing; see open question 4.

The page-152 miss is a latent gap rather than a live one: it is harmless only because no rule body
crosses that page. A rule spanning it would pick the header up. Worth tightening `HEADER_RE` if the
pipeline is ever re-run over a different edition.

---

## Verified results of Phase 0.6

```
1  residual characters   pass   hard: none
                               flagged: privateUse 353 (symbol), replacement 108
                                        (kalpurush 82, shonarbangla 26)
2  expected keywords     pass   বিধি 507, অধ্যায় 30, তফসিল 231
3  rule numbering        skip   needs rule boundaries from structure.py (Phase 1)
4  page coverage         pass   271/271 gazette pages carry text
5  known strings         pass   10/10
6  oracle divergence     skip   external, run by hand
```

Passed 4, failed 0, skipped 2. Exits 1 if any check fails, so the harness can gate a build.

### What each check is

- **1 residual characters** — every span's `logical` text is scanned codepoint by codepoint.
  A control, surrogate or unassigned codepoint fails the build. The two classified kinds are
  counted and attributed to their family instead of hidden: **353 private-use** codepoints, all
  in the `symbol` family (Symbol/Wingdings' own encoding — the census's "Symbol / Wingdings"
  category), and **108 `U+FFFD`**, all in Unicode-Bengali families (`kalpurush` 82,
  `shonarbangla` 26) where the source font has no glyph. The second group is [open
  question 3](#open-questions); the check reports it rather than failing on it, and flipping
  that to a hard failure is a one-line change if the decision goes the other way.
- **2 expected keywords** — the regulation's own vocabulary must survive decoding at plausible
  frequency. Floors sit far below the measured counts (বিধি 507 / 30 / 231) so the check
  catches a collapse, not corpus drift.
- **4 page coverage** — the gazette pages present in the text must be exactly the edition's
  range, `pageOffset` to `pageOffset + pdfPages - 1` (9559–9829), with none missing and none
  outside. This is the Phase-0 form of the plan's check; Phase 1 narrows "carries text" to
  "carries a provision".
- **5 known strings** — the fixed list lives in `reorder.py`, and `validate.py` re-reads the
  built `text.jsonl` for it, so the check is on the artifact, not on the rewrite function.

### Why 3 and 6 reported as skipped in Phase 0

Neither was passable in Phase 0, and a silent skip would read as a pass:

- **3 rule numbering** needed rule boundaries, which `structure.py` (Phase 1) now produces — it
  **passes** as of Phase 1 (see below). Hand-extracting markers from the span stream is not
  reliable enough to gate a build: some pages carry a duplicated text layer and some rule numbers
  are split across spans (`৭` and `১` apart where `৭১।` is meant).
- **6 oracle divergence** is the external cross-check, run by hand.

---

## Verified results of Phase 1

```
Spans            : 15031 -> deduped 11647 (3384 overprints dropped)
Chapters         : 9
Parts            : 40
Rules            : 154  series 1..154  contiguous=True
Schedules        : 17  present [1..5, 7..13, 17..21]
Image-only pages : 24  [9758..9762, 9782..9800]
```

The plan's Phase 1 exit is met: the provision count is **stable across two consecutive runs**
(the SHA-256 of `ppr2025.structure.json` is byte-identical), and a sampled set of clauses
**matches the oracle exactly** (below).

| Chapter | Ordinal | Page | Rules |
|---|---|---|---|
| 1 | প্রথম | 9559 | 1–3 |
| 2 | দ্বিতীয় | 9566 | 4–21 *(heading missing)* |
| 3 | তৃতীয় | 9577 | 22–77 |
| 4 | চতুর্থ | 9631 | 78–109 |
| 5 | পঞ্চম | 9654 | 110–123 |
| 6 | ষষ্ঠ | 9675 | 124–148 |
| 7 | সপ্তম | 9701 | 149 |
| 8 | অষ্টম | 9706 | 150 |
| 9 | নবম | 9706 | 151–154 |

### How the segmentation is decided

- **Dedupe first.** The text layer draws part of the document twice at identical boxes. Key
  `(page, box, visual, font object)` drops **3,384** overprints, leaving **11,647** spans.
- **Stream order is reading order.** After dedupe, `get_texttrace`'s emission order is correct.
  Spans are multi-line runs, so re-sorting by box top moves a rule's marker after its body; the
  corpus is the stream order, pages in numeric order.
- **Rules are aligned, not matched.** `উদাহরণ ১।` and a schedule table's `২। বিনিয়োগ` row also
  look like rule markers. Candidate markers are walked in order and accepted only when the number
  is the next due, which resolves the series to **1..154 with no gaps** and leaves **17** rejected
  candidates in the body text.
- **Chapter headings** (`প্রথম অধ্যায়`) are matched with a lookahead so cross-references
  (`প্রথম অধ্যায়ের`, `সপ্তম অধ্যায় অনুসারে`) do not create phantom chapters. A heading that falls
  between two rule markers ends the rule above it, so `নবম অধ্যায় বিবিধ` no longer bleeds into
  rule ১৫০.
- **Page furniture** is stripped before matching: the SutonnyMJ running header (Bijoy-ASCII),
  the printed page label `(৯৫৫৯)` and the price footer `মূল্য : টাকা …`, plus the four block
  separators the fonts draw (`\uf0be`, `∑` = U+2211, `\uf0d8`, `\uf0b7`).

### Recorded defects, not silent drops

- **`missingHeading`** — the দ্বিতীয় অধ্যায় heading has no glyph in the file; only a `U+FFFD`
  ghost survives. Its boundary is synthesized at the top of page 9566 and flagged, so its rules
  (4–21) are not misfiled into chapter one.
- **`imageOnlyPages`** — **24** pages carry nothing but the running header (9758–9762,
  9782–9800): scanned images with no text layer.
- **`missingSchedule`** — schedules ৬, ১৪, ১৫, ১৬ fall on those image pages, so their headings are
  unrecoverable. 17 of 21 schedules are present.

### Oracle cross-check (plan §7 check 6, run by hand)

Sampled against the independent web edition at `procurementbd.com` (PPR-25 chapter pages) and
matched **exactly**, text and titles alike:

| Rule | Oracle | Corpus | Match |
|---|---|---|---|
| 1 | সংক্ষিপ্ত শিরোনাম ও প্রবর্তন | same title | ✓ |
| 3 | আইন এর ধারা ৩(২) অনুযায়ী … এই বিধিমালা প্রযোজ্য হইবে। | identical body | ✓ |
| 22 | ক্রয়সংক্রান্ত আইন, ইত্যাদি সাধারণের প্রাপ্যতা | same title | ✓ |
| 23 | যোগাযোগের ধরন | same title | ✓ |
| 24 | ক্রয়কৌশল (Procurement strategy) প্রণয়ন এবং ক্রয়পদ্ধতি নির্বাচন | same title | ✓ |
| 149 | পেশাগত অসদাচরণ, অপরাধ, চুক্তি বাতিল, ইত্যাদি | same title; sub-clauses `(১)(ক)…(ঘ)`, `(২)(ক)…(ঙ)`, `(৩)` identical | ✓ |
| 151–154 | কনসেশন … / ক্রয় ইউনিট বা শাখা গঠন … / পরিবীক্ষণ … / রহিতকরণ ও হেফাজত | same titles; rule 154 body identical | ✓ |

The oracle's own TOC independently confirms the chapter rule-ranges (১–৩, ৪–২১, ২২–৭৭, ৭৮–১০৯,
১১০–১২৩, ১২৪–১৪৮, ১৪৯, ১৫১–১৫৪) and the total **154 rules / 21 schedules**.

### Harness after Phase 1

`validate.py` check 3 now reads `build/ppr2025.structure.json` and **passes**; check 4 is tightened
from *carries text* to *carries a provision* — the **247** provision pages plus the **24** recorded
image pages partition the edition's 271 pages exactly, and a page that is furniture-only but not
recorded is a failure.

```
1  residual characters   pass   hard: none
2  expected keywords     pass   বিধি 507, অধ্যায় 30, তফসিল 231
3  rule numbering        pass   rules 1..154, contiguous, chapters partition the series
4  page coverage         pass   247 provision + 24 image = 271 pages, none missing
5  known strings         pass   10/10
6  oracle divergence     skip   external, run by hand (sampled above)
```

Passed 5, failed 0, skipped 1.

---

## Verified results of Phase 2

```
Documents        : 171   (154 rules + 17 schedules)
Chapters         : 9
Alias groups     : 15    (rules tagged: 79)
Facets           : chapter, method, unit  (documents tagged: 166)
Resolve keys     : 900
Benchmark        : 55/55 pass  (vitest, apps/tools)
```

The plan's Phase 2 exit is met: every query in the fixed benchmark set returns the expected clause
in the **top 3**, the `OTM` case included.

### Where the work is split

MiniSearch is JavaScript-only, so the Python builder cannot produce its index. The split is:

- **`build_index.py` emits data** — `assets/ppr2025/documents.json` (one document per provision) and
  `assets/ppr2025/index.json` (counts, chapter/schedule tables, the L0 resolver, the alias + facet
  tables, and a content hash of the documents).
- **the client builds the index** — `apps/tools/src/lib/ppr/search.ts` constructs MiniSearch from
  those documents, and applies the Bengali handling the plan asks for.
- **the benchmark reads the same assets** — `apps/tools/tests/ppr-search.test.ts` proves the exit
  criterion over what actually ships.

The alias and facet vocabularies are **edition data** (`source/ppr2025/aliases.json`,
`facets.json`), not code: adding an edition means new data files, nothing in the builder.

### Bengali handling

- **Normalisation** — NFC, then ZWJ/ZWNJ and the other zero-width marks are dropped, whitespace
  collapsed, before anything is indexed or matched.
- **Key folding** — a query and its corpus counterpart must land on one key, so `fold_key`/`foldKey`
  lowercase and strip everything but **letters, digits and combining marks**. The marks matter:
  Bengali vowel signs are category `Mc`, and dropping them folds `বিধি` to `বধ`, which would stop
  `বিধি ৪২` matching. Python's `\W` does drop them; both sides now keep `\p{L}`/`\p{N}`/`\p{M}`
  so they fold identically.
- **Digits in both scripts** — `processTerm` indexes every token with its digits rendered in the
  other script, so `118` and `১১৮` reach the same rule.
- **Boosting** — `title > tags > body` (3 : 2 : 1); acronyms reach a rule through the `tags` field,
  which is why `OTM` finds rule ৭৮.

### L0 resolver

A folded key → jump target (`kind`, `number`, `page`, `pdfPage`). Rules own the **bare numerals**
(`42`, `৪২`); a schedule or chapter must be **named** (`তফসিল ৩`, `schedule III`, `chapter 5`,
`পঞ্চম অধ্যায়`) because its number is ambiguous with a rule of the same number. Both number scripts
and the chapter's Bengali ordinal are registered, giving **900** keys.

### The benchmark set

| Kind | Cases | What it pins |
|---|---|---|
| Ranked | 11 | alias hits (`OTM`→৭৮, `ই-জিপি`→১৫০), distinctive titles (রহিতকরণ→১৫৪, কনসেশন→১৫১, কোটেশন→৯১, বিপরীত নিলাম→৯৫) — each must be in the top 3 |
| Direct | 9 | `৪২`/`42`/`rule 42`/`বিধি ৪২`→rule 42, `বিধি ১৫০`→150, `schedule III`/`তফসিল ২১`→schedule, `chapter 5`/`পঞ্চম অধ্যায়`→chapter 5 |
| Guard | 2 | digit scripts both reach rule ১১৮; a bare `৩` is a **rule**, `তফসিল ৩` is a **schedule** |

---

## Verified results of Phase 3 and 4

```
Routes           : /ppr-2025-study, /en/ppr-2025-study  (both prerendered)
Tests            : 70/70 pass  (ppr-search 23, ppr-refs 15, savings 21, prize-bond 11)
Ref graph        : 169 edges, 102 citing docs, 80 backlinks, 7 dangling
Glossary         : 63 terms, all sourced from the corpus's own সংজ্ঞার্থ rule
contentHash      : sha256-59129314d528   (keys the offline cache)
```

The plan's Phase 3 exit is met: a search leads to a clause and to the correct gazette page, on
desktop and mobile; the layout is single-column up to `sm` and the chapter/result grids are
`sm:grid-cols-2 lg:grid-cols-3`.

### What the island does

- **Landing** — one card per chapter (ordinal, rule range, part count, page, and a "no heading"
  badge on chapter 2), then a schedule grid; the four image-only schedules are listed separately
  so nothing is silently missing.
- **Search** — the L0 resolver is checked first, so `৪২`, `42`, `rule 42` and `বিধি ৪২` produce a
  "jump straight to" card; below it, MiniSearch hits are grouped by chapter (schedules last),
  each row carrying its page.
- **Clause detail** — the full text with every citation and glossary term linkified, a citation
  line (`মূল বিধিমালা, বিধি ৪২ (গেজেট পৃষ্ঠা ৯৫৮৯)`) with copy-as-citation, a permalink, and a
  PDF-page button; "Refers to" / "Cited by" panels and a "Terms defined here" list follow.
- **PDF jump** — `PdfViewer.svelte` loads the hub-hosted `PPR2025.pdf` with pdf.js, renders the
  page plus its text layer, and highlights matches. Page navigation is by `?page=` query, and the
  header shows the gazette number (`pdf page + pageOffset`).
- **URL state** — `?clause=`, `?chapter=`, `?q=`, `?page=`, `?pdfq=`. The view is the URL, so a
  link can be shared and restored; paging inside the viewer writes `?page=` back.

### Why refs win over glossary terms

`annotateText` cuts the text at cross-references first and only looks for glossary terms in the
**plain runs between them**. A citation's `বিধি ৪২` must link to the rule, not to a headword that
happens to share the letters; `linkGlossary` also links each term once, longest term first, so a
definition quoting its own headword stays readable.

### Dangling references are shown, not hidden

Seven references point at targets this edition does not carry — schedules 14, 15 and chapters
that fall on the 24 image-only pages. `refResolves` fails those links, the button is `disabled`
with a title saying the provision is not in this edition, and they are never silently dropped.

### The offline cache follows the bond pattern

`PprDataStore` requests `documents.json?v=<contentHash from the manifest>` and stores the payload
in Cache Storage under `ppr-corpus:<contentHash>`. Reads are network-first, cache-second. When a
new `contentHash` arrives, every other `ppr-corpus:*` cache is deleted, so the stale copy is
never served. The toolbar marks a cache-served read ("সংরক্ষিত কপি থেকে") rather than passing it
off as live. No service worker is involved — this is the same `?v=` + manifest scheme the
prize-bond pipeline uses.

### Wiring

`apps/tools/src/pages/ppr-2025-study.astro` and `en/ppr-2025-study.astro` (BaseLayout + FAQ
JSON-LD + the island at `client:load`); `tools.ppr.*` keys in `packages/ui/src/i18n/ui.ts`; a
Navbar "other tools" entry; a card on the tools landing page.

---

## Corrections to the plan (found while implementing)

These override the corresponding statements in `ppr-plan.md` §3 and §5.

### 1. There are **8 legacy font objects**, not 3 families

`Nikosh` ×2 (xref 171, 655), `NikoshBAN` ×3 (175, 331, 651), `SutonnyMJ` ×2 (159, 647), `SutonnyMJ,Bold` ×1 (163).

### 2. Codes are **object-local**, so one table per family is wrong

Glyph names follow `uniF0NN`, but `NN` is assigned **per font object**, in that object's own glyph order. Measured by comparing glyph outlines for the same code across two objects of one family:

| Family | Objects | Shared codes | Same outline |
|---|---|---|---|
| NikoshBAN | 175, 651 | 236 | 2 |
| Nikosh | 171, 655 | 140 | 3 |
| SutonnyMJ | 159, 647 | 36 | 0 |

Example: `NikoshBAN` code `02` in xref 175 and code `03` in xref 651 are the *same* glyph. So the decode unit is **(font object, code) → glyph shape → Unicode**, not `(family, code)`.

### 3. The labeling unit is a **glyph shape**

Distinct glyph outlines per family — this is the real review workload, not the ~470 code slots:

| Family | Distinct shapes | Shapes needing a label |
|---|---|---|
| Nikosh | 188 | 188 |
| NikoshBAN | 268 | 268 |
| SutonnyMJ | 133 | none (readable via ToUnicode) |

The NikoshBAN figure was 288 in the pre-0.2 spike; 268 is the measured count of shapes the
text actually uses. See correction 7.

### 4. SutonnyMJ is readable today, and is **not** a pure substitution

SutonnyMJ's ToUnicode is complete, so `resolved` is already the standard **SutonnyMJ/Bijoy ASCII** string. Verified:

```
evsjv‡`k †M‡RU, AwZwi³, †m‡Þ¤^i 28, 2025
→ বাংলাদেশ গেজেট, অতিরিক্ত, সেপ্টেম্বর ২৮, ২০২৫
```

It uses **pre-base vowel reordering** (`ে`, `ি` are stored before their consonant) and ligature glyphs (`³` = ক্ত, `Þ` = প্ট). So `reorder.py` is required, and SutonnyMJ needs a SutonnyMJ→Unicode table rather than a shape table.

### 5. Embedded fonts are subsetted in effect, and their cmaps carry no Unicode

Each legacy object still *declares* 1278 glyph slots, but only the glyphs actually used have
outlines — `Nikosh@171` 167 of 1278, `NikoshBAN@175` 254, `NikoshBAN@651` 236; the rest are
emptied, and the subset tags (`ZELPWB`, `WBFANC`, `SNALTH`) say as much. Non-empty glyphs
therefore equals distinct shapes (167 for `Nikosh@171`). The cmap exposes only the PUA range in
use and carries **no Unicode entries** — checked all 8 objects, 0 Bengali codepoints. Shape-based
labelling is therefore unavoidable.

### 6. The old `214,787 chars` figure is not reproducible

The verified total is **439,245 glyph positions / 430,470 `get_text` characters**. Stop quoting 214,787.

### 7. One NikoshBAN object is mounted but unused, and spans name fonts ambiguously

xref 331 (`NikoshBAN` subset `GTJPCB`) sits in the resources of 39 pages, each of which also
mounts xref 175 (`WBFANC`) under the same base name. A span carries only `NikoshBAN`, so the
subset tag is the only thing that could tell them apart and it is not preserved.

Checked against the per-character advance widths in the spans: 716 spans fit xref 175 at
≥90% of characters, none fit xref 331. So 175 is what those pages draw with, `extract.py`'s
last-listed-wins guess is right on all 39 pages, and xref 331 contributes no glyph to the
corpus. `duplicateFontNames` previously reported 0 because it compared names *with* the
subset tag; it now compares the stripped name and reports these 39 pages.

Two consequences: the stream records the font object per span (`"o"`), because the code alone
is ambiguous; and the shape count is the measured 268, not the 288 that counting the unused
object inflated it to.

### 8. Empty outlines collapse into one shape

The blank glyphs — `uniF001`, `uniF008`, spaces — draw nothing and advance 0.244 em, so they
all hash to the same shape id (`97d170e155`), the most frequent shape in the corpus at 53,476
glyphs. It is one row in the sheet, and one label (space) covers every site that reaches it.
Fine for decoding, but it means a shape id is a *drawing*, not a glyph: any future zero-width
or invisible glyph would merge into this row instead of getting its own. The 94 codeless
glyphs of §"Glyphs with no code" merge here too, since they also draw nothing.

---

### 9. The reference fonts are **Unicode editions with GSUB**, not the same program plus a cmap

`scripts/reference_fonts/Nikosh.ttf` and `NikoshBAN.ttf` are not the embedded legacy programs
with a Unicode cmap bolted on — their glyphs are named `bn_ka`, `glyph544`, `period`, where the
embedded ones are `uniF0NN`. Each holds 525 cmap entries (94 of them Bengali), **708 GSUB
ligature rules** and 2 single substitutions, over features
`abvs, blwf, blws, half, haln, init, pres, pstf, psts, rphf, vatu`.

That is what makes 0.3 work: the conjuncts, half forms, reph, vowel ligatures and য-ফলা a legacy
font draws as one glyph are present here as ligature glyphs, so a drawing match names the legacy
shape *and* supplies the logical-order Unicode — no hand-written conjunct table.

---

## Open questions

1. ~~Labeling route for the 456 shapes~~ — **settled in 0.3**: normalised-shape matching against
   the reference fonts. Nothing is unmatched, so the review sheet is a confirmation pass, not the
   primary route. The 49 ambiguous rows (Assamese twins, Bengali-vs-ASCII digits)
   are **settled by the 0.4 review**: they stand accepted as Bengali, with every candidate still
   kept in the shape table (`candidates`), so the choice can be revisited without re-labelling.
2. Shapes with no contours collapse into one row (correction 8) — accept the merge, or split
   on advance width so a blank is distinguishable from a zero-width glyph?
3. The 108 unmapped glyphs inside Unicode Bengali fonts — measured as 82 in `kalpurush` spans
   and 26 in `shonarbangla` spans, all `U+FFFD`, where the *source PDF* has no glyph either.
   Decide whether to flag those spans as non-canonical rather than repair them. `validate.py`
   check 1 counts and attributes them today without failing the build.
4. **SutonnyMJ has no Unicode table yet — robustness, not a user-visible gap.** Its 571 spans pass
   through `reorder.py` unreordered, but they are page furniture and none of them reach the corpus
   (measured: 0 lookalike characters in `source/ppr2025/` or `assets/ppr2025/`). So nothing
   searchable is missing today, and this is not a blocker. It becomes a real requirement only if
   the pipeline ever has to read SutonnyMJ *body* text, and the work is order-sensitive: `HEADER_RE`
   matches the **Bijoy-ASCII** form, and that same header is what marks a page image-only
   (`texts[page]` empty ⇒ 24 `imageOnlyPages`), so decoding SutonnyMJ *before* `structure.py` would
   stop both working and bleed ~270 running headers into rule bodies. A `sutonnymj.json`
   Bijoy-ASCII → Unicode table (plan §4) must therefore be applied after furniture stripping, or
   `HEADER_RE` must be rewritten in Unicode terms in the same change — and it needs the `reorder.py`
   pass too, since only `nikosh`/`nikoshban` are in `SHAPE_FAMILIES`.
5. The 353 Symbol/Wingdings private-use codepoints (U+F0BE ×338, U+F0B7 ×13, U+F0D8 ×2, all in
   `symbol` spans) — decide whether to map them through the Symbol encoding table, drop them, or
   keep them as-is. They carry the gazette's own symbols, not Bengali text.

---

## Blockers

None.
