# Prize Bond Result Checker: Implementation Spec

> **For the AI IDE:** Read this whole file before writing code. Build in the phases at the end. Where this spec says **VERIFY**, do not guess: confirm against the official Bangladesh Bank result PDF or ask the owner. Wrong prize data is the worst possible bug in this project.

---

## 0. Summary

A free, no-login, no-backend web tool where users check Bangladesh Government Prize Bond numbers against official draw results.

- **Live at:** `https://tools.ekushlabs.com/prize-bond-result-checker`
- **Draw data hosted at:** `https://hub.ekushlabs.com/bond/assets/` (see the domain note below)
- **Inputs:** comma/space/newline separated numbers, ranges, Excel/CSV upload
- **Privacy:** everything runs in the browser. The user's numbers are never sent anywhere or stored anywhere.
- **Speed:** all draw data is loaded into in-memory hash maps; matching is O(1) per number.

> **Domain note:** the owner wrote `hub.ekuslab.com` once, which looks like a typo for `hub.ekushlabs.com`. Make the data base URL a single config constant (`BOND_DATA_BASE_URL`) and default it to `https://hub.ekushlabs.com/bond/assets`. Confirm with the owner.

---

## 1. Repositories and folder layout

Two deliverables:

### 1.1 Hub (data) project: `hub/bond/`

```
hub/
└── bond/
    ├── README.md                  # how to add a new draw (step by step)
    ├── source/                    # official PDFs, kept for audit (not served)
    │   └── draw-<NNN>-<YYYY-MM-DD>.pdf
    ├── scripts/
    │   ├── extract_draw.py        # PDF -> draw JSON
    │   ├── validate_draw.py       # schema + count checks
    │   ├── build_manifest.py      # regenerates index.json
    │   └── requirements.txt
    ├── schema/
    │   ├── draw.schema.json       # JSON Schema for a draw file
    │   └── index.schema.json
    └── assets/                    # <- this folder is what gets deployed
        ├── index.json             # manifest of all draws
        ├── rules.json             # prize tiers, tax, claim info (single source of truth)
        └── draws/
            ├── 001.json
            ├── 002.json
            └── ...
```

Only `assets/` is deployed to `hub.ekushlabs.com/bond/assets/`. `source/` and `scripts/` stay in the repo.

### 1.2 Tool project: `tools.ekushlabs.com/prize-bond-result-checker`

Follow the existing structure and conventions of the tools site. **Before writing any UI, inspect the existing tools site and reuse its layout shell, header/footer, design tokens (colors, fonts, radius, spacing), dark-mode handling, i18n approach, and component library.** Do not introduce a new design language.

Suggested files (adapt to the existing framework):

```
prize-bond-result-checker/
├── page (route)                   # SEO shell, static
├── components/
│   ├── Checker.*                  # main interactive island
│   ├── InputPanel.*               # tabs: Type/Paste | Range | Excel
│   ├── DrawSelector.*
│   ├── ResultSummary.*
│   ├── WinnerCard.*
│   ├── NextSteps.*
│   ├── Disclaimer.*
│   └── Faq.*
├── lib/
│   ├── parse-input.ts             # tokenizer, Bangla digits, ranges
│   ├── parse-excel.ts             # SheetJS wrapper (lazy loaded)
│   ├── draw-store.ts              # fetch + in-memory index
│   ├── matcher.ts                 # pure matching logic
│   ├── export-csv.ts
│   └── i18n/ (bn.json, en.json)  # or the site's existing i18n
├── workers/match.worker.ts
└── tests/
```

---

## 2. Prize bond rules and domain facts

Bangladesh prize bonds are issued by the Government and managed by Bangladesh Bank / the National Savings Directorate. Draws are held periodically, and results are published as official lists.

**Do not hardcode these from memory. VERIFY every item below against official sources and record the verified values in `assets/rules.json`:**

| Item | What to confirm |
|---|---|
| Denomination | Currently Tk 100 (confirm no other active denominations) |
| Bond number format | Series letter(s) plus a 7-digit number? Confirm exactly (for example `ক ০১২৩৪৫৬`). |
| **Match key** | Does a win require the series letter AND the number, or the number only? This decides the whole matching design. See 3.3. |
| Draw frequency | Roughly quarterly (confirm the months) |
| Prize tiers | Number of tiers, prize amount per tier, count of winning numbers per tier |
| Tax | Source tax / withholding on prizes (rate and who deducts it) |
| Claim window | How long after the draw a prize can be claimed, and whether old draws stay claimable |
| Claim process | Where to claim, required documents, forms |
| Official source | The exact Bangladesh Bank / NSD URL where results are published |

The tool must support checking against **all historical draws that are still claimable**, not only the latest. Put the claim-window rule in `rules.json` so it can change without code changes.

---

## 3. Data: JSON structure

### 3.1 `assets/index.json` (manifest)

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-11T00:00:00Z",
  "latestDraw": 1,
  "draws": [
    {
      "id": "001",
      "drawNumber": 1,
      "date": "2026-07-15",
      "file": "draws/001.json",
      "version": "sha256-<first 12 chars of file hash>",
      "totalWinners": 0,
      "claimableUntil": "YYYY-MM-DD"
    }
  ]
}
```

- `version` is a content hash, used as a cache-busting query param (`draws/001.json?v=<version>`) so files can be cached aggressively but never stale.
- `claimableUntil` is derived from `rules.json` by the build script.

### 3.2 `assets/rules.json`

```json
{
  "schemaVersion": 1,
  "denomination": 100,
  "currency": "BDT",
  "numberFormat": { "digits": 7, "hasSeries": true, "series": ["ক", "খ"] },
  "matchKey": "series+number",
  "tiers": [
    { "tier": 1, "labelBn": "প্রথম পুরস্কার", "labelEn": "1st Prize", "amount": 0 }
  ],
  "tax": { "ratePercent": 0, "noteBn": "", "noteEn": "" },
  "claim": {
    "validityMonths": 0,
    "officialSourceUrl": "",
    "stepsBn": [],
    "stepsEn": [],
    "documents": []
  },
  "lastVerified": "YYYY-MM-DD"
}
```

All `0`/empty values above are **placeholders**. Fill them only from verified official data.

### 3.3 `assets/draws/<id>.json`

Design the file so it works whether or not the series letter matters:

```json
{
  "schemaVersion": 1,
  "id": "001",
  "drawNumber": 1,
  "date": "2026-07-15",
  "source": {
    "name": "Bangladesh Bank",
    "url": "https://...",
    "pdf": "source/draw-001-2026-07-15.pdf",
    "extractedAt": "2026-10-11T00:00:00Z"
  },
  "tiers": [
    {
      "tier": 1,
      "amount": 0,
      "expectedCount": 1,
      "numbers": ["ক0123456"]
    }
  ]
}
```

- Store each winning entry as a **normalized key string**: English digits, no spaces, series (if applicable) as the Bangla letter prefix, then the 7-digit zero-padded number. Example: `ক0123456`.
- If VERIFY shows the series is irrelevant, store plain 7-digit strings and set `matchKey: "number"` in `rules.json`. The matcher reads `matchKey`; do not hardcode.
- `expectedCount` is the official count for that tier, and the validator asserts `numbers.length === expectedCount`.
- Keep files compact (no pretty-printing in `assets/`, though a formatted copy may live elsewhere). A draw file should stay in the tens of KB gzipped.
- **Numbers are always strings.** Never store them as integers (leading zeros).

---

## 4. Extraction pipeline (`hub/bond/scripts/`)

### 4.1 `extract_draw.py`

Input: official PDF path plus draw number and date. Output: `assets/draws/<id>.json`.

Steps:

1. Try `pdfplumber` (or `pymupdf`) text and table extraction.
2. **Bangla font trap:** many government PDFs use legacy fonts (Bijoy/SutonnyMJ style), so extracted text comes out as garbled ASCII. Detect this (for example the output has no Bangla Unicode chars where letters are expected). If detected, either map the legacy encoding or fall back to OCR (`pytesseract` with `ben+eng`, rasterize pages at 300 dpi).
3. Parse tier headings and winning numbers into the structure in 3.3.
4. Normalize: Bangla digits to English, strip whitespace/zero-width characters, zero-pad.
5. Print a **human review report**: per tier, the count found vs expected, any malformed tokens, any duplicates.
6. Never silently drop a token. Anything unparsed must be listed in the report and cause a non-zero exit code.

### 4.2 `validate_draw.py` (must pass before anything is committed)

- Validates against `schema/draw.schema.json`
- `numbers.length === expectedCount` per tier
- No duplicate numbers within a draw (flag, do not auto-fix)
- Every number matches the verified format regex
- Tier amounts match `rules.json`
- Prints a spot-check sample of 10 random numbers with the page of the PDF they came from, for manual verification

### 4.3 `build_manifest.py`

Regenerates `index.json` from `draws/*.json` (hashes, counts, claimable dates). Run after every new draw.

### 4.4 `hub/bond/README.md` (per-draw checklist)

1. Download the official PDF to `source/`.
2. Run extract, then validate.
3. **Manually verify** at least the top-tier numbers and 10 random ones against the PDF.
4. Run build_manifest.
5. Commit and deploy.

Optional later: a GitHub Action that runs validation on every PR touching `bond/`.

---

## 5. Hosting the data

- Deploy `hub/bond/assets/` to `https://hub.ekushlabs.com/bond/assets/`.
- Required response headers for the assets path:
  - `Access-Control-Allow-Origin: https://tools.ekushlabs.com` (and `http://localhost:*` for development only)
  - `Content-Type: application/json; charset=utf-8`
  - `Cache-Control: public, max-age=300` for `index.json` (so new draws appear within minutes)
  - `Cache-Control: public, max-age=31536000, immutable` for `draws/*.json` (safe because of the `?v=` hash)
- Serve with gzip/brotli.
- If the hub is on Cloudflare Pages/Netlify, configure these through `_headers`. Include the file in the repo.

---

## 6. Client-side architecture: in-memory, fastest check

### 6.1 Loading

1. On page load, fetch `index.json` (small).
2. Fetch the **latest draw immediately**. Fetch the remaining claimable draws in the background (`Promise.all`, with a small concurrency limit).
3. Parse into an in-memory index. **Nothing is persisted**: no localStorage, no IndexedDB, no cookies. (HTTP cache handles repeat visits.)
4. If a fetch fails, show a retry button and a clear error. Do not show "no winners" if data failed to load. Block the check until the selected draws are loaded.

### 6.2 Index structure

```ts
type Win = { drawId: string; drawNumber: number; date: string; tier: number; amount: number };
// key -> list of wins (a bond can win in multiple draws)
const index: Map<string, Win[]> = new Map();
```

Build once. Lookup is `index.get(key)`.

### 6.3 Matching

- Pure function in `lib/matcher.ts`: `check(keys: string[], index, selectedDrawIds): MatchResult`.
- For inputs above ~5,000 keys, run in a **Web Worker** (`match.worker.ts`) and post progress. For small inputs, run on the main thread.
- Ranges are expanded **lazily/in chunks** inside the worker. Do not build a giant array on the main thread.
- Hard cap on a single range and on total checked numbers (default 200,000, as a config constant), with a friendly message when exceeded.

### 6.4 Draw selection

- Default: "All claimable draws".
- Allow choosing a specific draw. Show the date and draw number.
- If a number matched only in an expired draw (past `claimableUntil`), show it as **"Won, but claim period may have ended"**, clearly distinguished from live wins.

---

## 7. Input handling

### 7.1 Normalization (shared by all input methods)

- Convert Bangla digits `০১২৩৪৫৬৭৮৯` to `0123456789`.
- Strip zero-width chars, NBSP, and BOM.
- Accept separators: comma, Bangla comma, semicolon, whitespace, newlines, tabs.
- Trim and zero-pad numbers to the verified width **only if** short numbers are valid in the format (VERIFY).
- Dedupe; keep a count of duplicates removed.
- Reject invalid tokens and **show them** in a collapsible "Ignored entries" list with a reason (wrong length, bad character, and so on). Never silently drop.

### 7.2 Tab 1: Type or paste

- A multi-line textarea. Live counter ("12 valid, 1 ignored").
- Placeholder with an example in Bangla and English.

### 7.3 Tab 2: Range

- From and To fields (plus a series selector if the match key includes the series).
- Validate `from <= to` and the cap from 6.3. Show "N numbers will be checked".
- Allow adding multiple ranges.

### 7.4 Tab 3: Excel / CSV upload

- Accept `.xlsx`, `.xls`, `.csv`. Max size 5 MB (config).
- **Lazy-load SheetJS** only when this tab is first used.
- Read **in the browser** (FileReader/ArrayBuffer). The file is never uploaded. Say so in the UI.
- Scan **all cells in all sheets**. Extract every token that looks like a valid bond number. Tolerate headers, blank rows, merged cells, numbers stored as numeric cells (restore leading zeros, VERIFY width), and Bangla digits.
- Offer a **sample template** download (generated client-side).
- Support drag and drop plus a file picker. Show file name, sheets scanned, and numbers found.

All three methods feed **one combined, deduplicated list** that the user can review before pressing **Check**.

---

## 8. Results UI

### 8.1 Summary bar

Total checked, winners count, ignored count, draws searched, and time taken.

### 8.2 If there are winners

- A prominent celebratory-but-calm banner (respect the tools site's tone).
- A winner card/table per match: bond number, draw number and date, prize tier, **prize amount**, and a status badge (Claimable / Check claim period).
- Show the **total prize amount** across winners, with a note that tax may be deducted (from `rules.json`).
- **"Next steps" panel, immediately visible** (see section 9).
- Buttons: **Download results (CSV)** and **Copy winning numbers**.

### 8.3 If there are no winners

- A friendly message: "No winning numbers found in the selected draws."
- State exactly what was checked ("N numbers against draws X to Y, results as of <index.generatedAt>").
- Remind them to keep their bonds, since more draws will come.

### 8.4 Large result sets

Virtualize or paginate the winners list. Never render 50,000 "no match" rows. Only winners are listed individually.

---

## 9. "What to do next" if a number matches

Show this panel prominently when there is at least one win. Content comes from `rules.json` (so it is editable without code changes), in Bangla and English. **All details must be VERIFIED before launch.** The structure:

1. **Don't panic, don't discard.** Keep the physical bond safe. Do not write on it or fold it.
2. **Confirm officially.** Cross-check the number with the official result list (link to the official source).
3. **Where to claim.** Where to go (Bangladesh Bank office or authorised bank branch). Name only what has been verified.
4. **What to bring.** The original bond, NID/ID, bank account details, and any forms (list from `rules.json`).
5. **Tax and deductions.** Explain that source tax is deducted from the prize (use the verified rate).
6. **Deadline.** The claim window and the date by which to claim, per winning draw.
7. **Beware of fraud.** Nobody should ask for a fee or advance payment to release a prize. This site never asks for money or personal data.

---

## 10. Disclaimer (must be visible on the page, not hidden in a modal)

Place a short version directly under the checker, and the full text in the footer area of the page. Bangla first, English second:

> **Disclaimer.** This tool is unofficial and is not affiliated with Bangladesh Bank, the Government of Bangladesh, or the National Savings Directorate. Results are transcribed from the official published draw lists and may contain errors despite our checks. Always confirm any win with the official source or your bank before taking action. We are not responsible for any loss arising from use of this tool. Your numbers are checked entirely in your browser and are never sent to or stored on any server.

Also show on the page: "Data last updated: <date>", the draw numbers loaded, and a link to the official source.

---

## 11. UI / UX requirements

- **Consistency first:** match tools.ekushlabs.com (layout shell, typography, colors, buttons, cards, dark mode). Reuse existing components.
- **Bangla-first**, with an English toggle (follow the site's existing language mechanism). Use a Bangla web font consistent with the site, with a fallback stack.
- **Mobile-first**: most users are on phones. Thumb-friendly controls, 44px minimum tap targets, no horizontal page scroll.
- **Flow:** choose input method, review the list, press Check, see the results. One primary action visible at a time.
- Helpful empty states, inline validation, and loading skeletons for draw data.
- A "Clear all" button that wipes the in-memory input and results.
- **Accessibility:** WCAG AA contrast, full keyboard use, labelled inputs, `aria-live` for result announcements, and no information conveyed by color alone.
- Performance targets: first interaction under 2 s on a mid-range phone on 4G, and 100,000 numbers checked in under 1 s after data load.

---

## 12. Privacy and security

- No analytics event may include user numbers or file contents. If analytics are used, use a privacy-friendly option and track only page views.
- No third-party scripts that could read the textarea.
- Add a strict CSP for the page where the framework allows: `connect-src` limited to `'self'` and `https://hub.ekushlabs.com`.
- No `eval`, and no `innerHTML` with user content (escape everything).
- Pin the SheetJS version and load it from the project bundle, not a CDN.
- State plainly in the UI: "Your numbers and files stay on your device."

---

## 13. SEO

- Title and meta description in Bangla and English. Target phrases such as "প্রাইজবন্ড ড্র রেজাল্ট", "prize bond result checker Bangladesh".
- The static page must include meaningful server-rendered content (intro, how-to, FAQ), not only the JS app.
- `FAQPage` structured data.
- A short FAQ: how to check, how often are draws held, where to claim, is my data stored, what if my bond is old.
- Canonical URL and Open Graph image consistent with the other tools.

---

## 14. Testing

Unit tests (required):

- `parse-input`: Bangla digits, mixed separators, duplicates, invalid tokens, zero padding, series handling.
- Range expansion: boundaries, reversed range, cap exceeded.
- `matcher`: a bond winning in two draws, a number winning in an expired draw, an empty index.
- Excel parser: messy sheet, multiple sheets, numeric cells with lost zeros, junk headers.
- Schema validation of every file in `assets/`.

Data tests (required, in the hub project):

- Counts per tier match `expectedCount`.
- Known-answer test: hand-picked winning numbers from the official PDF must appear in the JSON.

E2E (recommended): paste numbers, upload a sample file, and check a known winner and a known non-winner. Test at a 360px viewport.

---

## 15. Build phases

1. **Inspect** the tools site conventions. Report the framework, design tokens, and i18n method before coding.
2. **Hub data:** folder layout, schemas, `rules.json` with placeholders. Ask the owner for the latest official draw PDF.
3. **Extraction:** build scripts, process one real draw, validate, and manually verify.
4. **Core library:** parse-input, matcher, draw-store, with tests.
5. **UI:** the three input tabs, the review step, results, and the next-steps panel, with the disclaimer.
6. **Worker, CSV export, edge cases, and performance pass.**
7. **Load remaining draws** and finalize `rules.json` with verified values.
8. **Polish:** SEO, accessibility audit, mobile QA, and the CSP.
9. **Deploy:** hub assets with headers first, then the tool page. Smoke test in production.

---

## 16. Acceptance criteria

- [ ] A known winning number from the official PDF is reported correctly, with the right tier and amount.
- [ ] A known non-winning number is reported as no match.
- [ ] Bangla digit input behaves identically to English digit input.
- [ ] Range, comma list, and Excel upload all work, and can be combined.
- [ ] No network request carries user input (verify in the browser's Network tab).
- [ ] Nothing is persisted in browser storage.
- [ ] A fetch failure shows an error and never a false "no winners".
- [ ] The disclaimer, "data last updated" date, and official source link are visible.
- [ ] The next-steps panel appears on a win, with verified content.
- [ ] Looks and behaves consistently with tools.ekushlabs.com, in light and dark mode.
- [ ] Works at 360px width and passes the accessibility basics.
- [ ] Adding a new draw needs only: run the scripts, then commit. No frontend code change.

---

## 17. Open questions for the owner

1. Confirm the data domain: `hub.ekushlabs.com` or `hub.ekuslab.com`?
2. Provide the latest official result PDF(s) and the official source URL.
3. Does the existing tools site use Astro, Next.js, or something else, and where do shared components live?
4. How many past draws should be included (all still claimable, or a fixed number)?
5. Bangla only, or Bangla plus English toggle at launch?
