# Savings Certificate (Sanchayapatra) Calculator — Implementation Spec

> **Audience:** AI IDE (Windsurf / Cursor / Antigravity) implementing this tool end to end.
> **Product:** Free, client-side tool under Ekush Labs, to live at `tools.ekushlabs.com/savings-certificate-calculator` (final slug: confirm against existing tool routing).
> **Status:** Design finalized in discussion. Follow this document; where it says **VERIFY**, do not assume, check the official source and record what you found.

---

## 1. Purpose

Bangladeshi users want to know what they will earn on Government National Savings Certificates (Sanchayapatra), issued under the **Department of National Savings (DNS / National Savings Directorate)**. Today they have to read gazette notices and rate tables.

The tool lets a user enter **an amount** and instantly see **every applicable scheme as a ranked card**, with profit, tax deducted, net return, effective yield, and early-encashment outcomes. Most profitable on top.

### Goals
- Amount-first, zero-friction UX. One required input.
- Accurate, transparent numbers driven by **data files**, never hardcoded rates.
- Bilingual (Bengali default-friendly, English), Bengali numerals, lakh/crore formatting.
- Consistent look and feel with the existing tools at `tools.ekushlabs.com`.
- Easy six-monthly data update (see Section 10).

### Non-goals (for now)
- Schemes other than savings certificates (no Wage Earner Bond, USD bonds, Post Office Savings account, FDR products).
- No user accounts, no portfolio tracking, no storage of user input anywhere (no server calls with user data; no localStorage of amounts unless explicitly added later).
- No buying/encashment transactions. Informational only.

---

## 2. Guiding principles

1. **Data-driven.** Rates, tiers, ceilings, tax rules and encashment schedules live in JSON. Code contains only logic.
2. **Period-based rates.** A certificate keeps the rate in force **on its purchase date**. New rate periods apply only to new purchases. The calculator must accept a purchase date.
3. **Transparent, not prescriptive.** Rank by objective metrics. Never use "best for you" wording. Labels like "Highest net return" are fine.
4. **Official source wins.** Every data file records its source. The UI shows "rates effective {from} to {to}, last verified {date}".
5. **Fail safe.** If data is missing, stale, or inconsistent for the chosen date, show a clear warning instead of a guessed number.
6. **Client-side only.** All calculation in the browser. JSON fetched as static files.

---

## 3. Tech and integration

- **Inspect the existing `tools.ekushlabs.com` codebase first** (and the prize bond result checker in particular) and reuse its framework, layout, header/footer, design tokens, components, i18n approach, analytics, and SEO helpers. Do not introduce a new stack or a second design system.
- Unified JS/TS stack, TypeScript strict mode, if the existing project allows.
- Pure functions for all calculations, in a separate module with **no UI imports**, so they are unit-testable.
- Static JSON hosted in the hub folder, following the same pattern used for the prize bond draw JSON (hub domain, a folder per tool). **VERIFY** the exact hub path convention from the existing bond tool and mirror it, for example `<hub>/savings-certificate/assets/`. Make the base URL a single config constant.
- Fetch with caching-friendly behavior: load `index.json` first (small), then only the needed period files. Handle fetch failure with a retry and a friendly error.
- Responsive, mobile first. Works on low-end Android devices and slow connections.

---

## 4. Data architecture

All files include the common metadata block (4.1). Provide JSON Schemas under `schema/` and validate in CI/build and in the update workflow.

### 4.0 File layout

```
<hub>/savings-certificate/assets/
  index.json                 # list of periods + pointers to latest files
  schemes.json               # static scheme definitions (rarely changes)
  tax.json                   # tax rules, effective-dated (changes independently)
  rates/
    2026-H2.json             # one file per rate period (Jul–Dec 2026)
    2026-H1.json
    2025-H2.json
    ...
  schema/
    index.schema.json
    schemes.schema.json
    tax.schema.json
    rates.schema.json
```

MVP history: **current period plus the previous 2–3 periods (about 18 months)**. The structure must allow adding older periods later with no code change.

### 4.1 Common metadata block

```json
{
  "meta": {
    "schemaVersion": "1.0.0",
    "dataVersion": "2026-07-03.1",
    "lastVerified": "2026-07-03",
    "sources": [
      { "title": "…", "url": "https://…", "publishedOn": "2026-07-02", "type": "gazette|circular|official-site|news" }
    ],
    "extractedBy": "ai",
    "reviewed": false,
    "notes": ""
  }
}
```

- `reviewed: false` means a human has not signed off. The UI may show a subtle "data pending review" note only in non-production builds; production should show it only if `reviewed` is false for the active period (owner decision: default to showing a small note).
- Prefer **official** sources (DNS website, IRD/Finance Division gazette). News articles are acceptable only as a cross-check, and must be listed as `type: "news"`.

### 4.2 `index.json`

```json
{
  "meta": { },
  "latestPeriodId": "2026-H2",
  "periods": [
    { "id": "2026-H2", "from": "2026-07-01", "to": "2026-12-31", "file": "rates/2026-H2.json" },
    { "id": "2026-H1", "from": "2026-01-01", "to": "2026-06-30", "file": "rates/2026-H1.json" }
  ]
}
```

Rules: periods must not overlap; they must be contiguous where the government set contiguous periods; sorted newest first. Note that a period's rates may be **unchanged** from the previous one (this happened in 2026), but still gets its own file so purchase dates map cleanly.

### 4.3 `schemes.json` (static definitions)

```json
{
  "meta": { },
  "schemes": [
    {
      "id": "family",
      "name": { "bn": "পরিবার সঞ্চয়পত্র", "en": "Family Savings Certificate" },
      "shortDescription": { "bn": "…", "en": "…" },
      "termYears": 5,
      "payoutType": "at_maturity",
      "payoutFrequency": null,
      "eligibility": { "pensionerOnly": false, "notes": { "bn": "", "en": "" } },
      "purchaseLimits": {
        "individual": { "max": null, "notes": "VERIFY" },
        "joint": { "max": null, "notes": "VERIFY" },
        "minPurchase": null,
        "denominations": []
      },
      "rateTierThreshold": 750000,
      "encashment": { "allowedBeforeMaturity": true }
    }
  ]
}
```

MVP schemes (exactly these four; others are out of scope):

| id | Scheme (en) | Term | Payout |
|---|---|---|---|
| `family` | Family Savings Certificate | 5 years | at maturity |
| `pensioner` | Pensioner Savings Certificate | 5 years | at maturity |
| `bangladesh_5yr` | Bangladesh Savings Certificate (5-year) | 5 years | at maturity |
| `profit_3month` | 3-Month Profit-Based Savings Certificate | **VERIFY** (term) | every 3 months (quarterly profit) |

**VERIFY from official sources and record in the data:** exact Bengali and English official names, terms, payout frequency, who is eligible, **purchase ceilings (individual and joint)**, minimum purchase and denominations. If a value cannot be confirmed, set it to `null` and add a `notes` entry. Do not invent.

`payoutType` enum: `at_maturity | monthly | quarterly`.

### 4.4 `rates/<period>.json`

```json
{
  "meta": { },
  "periodId": "2026-H2",
  "effectiveFrom": "2026-07-01",
  "effectiveTo": "2026-12-31",
  "currency": "BDT",
  "tierThreshold": 750000,
  "tierMode": "VERIFY: whole_amount | excess_only",
  "schemes": {
    "family": {
      "rateAtOrBelowThreshold": 11.93,
      "rateAboveThreshold": 11.80,
      "payoutTablePerLakh": null,
      "earlyEncashment": [
        { "afterFullYears": 1, "rateAtOrBelowThreshold": null, "rateAboveThreshold": null }
      ]
    }
  }
}
```

- `rateAtOrBelowThreshold` / `rateAboveThreshold`: annual percentage as published (percent, e.g. `11.93`).
- `payoutTablePerLakh` (optional but **preferred when the official source publishes it**): the official amounts payable per Tk 1 lakh by year/period, so results match official tables exactly without reverse-engineering rounding. Example shape:
  ```json
  "payoutTablePerLakh": {
    "atMaturityTotal": 176800,
    "byYear": [ { "year": 1, "total": 112000 } ],
    "perPayout": { "frequency": "quarterly", "amount": 2955 }
  }
  ```
  Numbers above are placeholders. Fill only from the official source.
- `earlyEncashment`: the reduced rate (or amount) by completed holding period, per scheme and per tier. Source from the official schedule. Leave `null` where not found, and the UI must then say "refer to official schedule" for that cell instead of computing.
- `tierMode`: **VERIFY** whether the lower rate applies to the **entire** investment once it exceeds the threshold, or only to the **excess portion**. Record the finding. The engine must support both through this flag.

**Seed values seen in news reports (cross-check against the official gazette, do not trust blindly):**
Family 5-yr: 11.93% (≤ Tk 7.5 lakh), 11.80% above. Pensioner: 11.98% / 11.80%. Bangladesh Savings Certificate 5-yr: 11.83% / 11.80%. 3-month profit-based: 11.82% / 11.77%. Reports indicated these were retained for Jul–Dec 2026, and that earlier periods (for example Jul–Dec 2025 and before) had different rates. Reconstruct the earlier periods from official notices.

### 4.5 `tax.json` (effective-dated)

```json
{
  "meta": { },
  "rules": [
    {
      "effectiveFrom": "2026-02-01",
      "effectiveTo": null,
      "sourceTax": [
        { "upToInvestment": 500000, "rate": 5.0, "appliesTo": "all" },
        { "above": 500000, "rate": 10.0, "appliesTo": "all" }
      ],
      "pensionerExemptUpTo": 500000,
      "measuredOn": "VERIFY: per_certificate | holder_total",
      "tinRelatedAdjustments": "VERIFY and document, or null",
      "notes": { "bn": "", "en": "" }
    }
  ]
}
```

Seed understanding (from news): source tax on certificate interest is **5% for investments up to Tk 5 lakh and 10% above**, and **pensioner certificates up to Tk 5 lakh are tax-exempt** at source. **VERIFY** effective dates, whether the threshold applies per certificate or across the holder's total holdings, how the above-threshold rate applies (whole interest or excess portion), and whether a TIN affects anything. Tax is looked up by **date of profit payment / encashment**, not only purchase date, because the tax rule in force when profit is paid applies. Document the assumption you choose and expose it in the UI's "how this is calculated" section.

---

## 5. Calculation engine

Create `lib/savings-certificate/` (or the project's equivalent) with pure, typed functions.

### 5.1 Inputs
```ts
type CalcInput = {
  amount: number;            // BDT, integer
  purchaseDate: string;      // ISO date, default = today
  isPensioner: boolean;      // default false
};
```

### 5.2 Outputs per scheme
```ts
type SchemeResult = {
  schemeId: string;
  eligible: boolean;
  ineligibleReason?: { bn: string; en: string };  // e.g. pensioner-only, exceeds ceiling, below minimum
  grossProfit?: number;
  taxDeducted?: number;
  netProfit?: number;
  totalAtMaturity?: number;       // principal + net profit
  effectiveAnnualYield?: number;  // net, annualized, % — document the formula
  periodicPayout?: { frequency: 'monthly' | 'quarterly'; grossPerPayout: number; taxPerPayout: number; netPerPayout: number };
  earlyEncashment?: Array<{ afterFullYears: number; ratePercent: number | null; grossProfit: number | null; taxDeducted: number | null; netReceivable: number | null }>;
  warnings: string[];             // data gaps, assumptions
  breakdown: BreakdownStep[];     // human-readable steps for the "how calculated" panel
};
```

### 5.3 Logic order
1. Resolve the **rate period** from `purchaseDate` using `index.json`. If none, return a "no data for this date" state (no numbers).
2. For each scheme: check eligibility (`pensionerOnly` vs `isPensioner`), minimum purchase, and **purchase ceilings**. If over a ceiling, mark ineligible with a clear reason and show the maximum allowed. (Optional improvement: allow "split across joint holders" note, no computation.)
3. Determine the rate by tier using `tierMode` (`whole_amount` or `excess_only`).
4. Compute gross profit:
   - **Prefer `payoutTablePerLakh`** when present (scale by amount ÷ 100,000, apply the tier logic).
   - Otherwise use the formula for that scheme as documented in the official source. Document it in a code comment and in `breakdown`. If the official method is unknown, do not guess; add a warning and show the headline-rate estimate clearly labelled as an estimate.
5. Compute tax using the tax rule effective on the **payment date**, per Section 4.5 assumptions, including the pensioner exemption.
6. Compute net profit, total at maturity, effective annual yield, periodic payouts (profit-based scheme), and early encashment rows.
7. Rounding: use the rounding convention of the official tables **VERIFY** (typically to the nearest taka). Do all intermediate math in integers or with a decimal library, never raw floating point accumulation.

### 5.4 Ranking
- Default sort: **net profit over the full term, descending** (ties broken by effective yield).
- Sort chips: *Highest net return* (default), *Highest effective yield*, *Highest regular income* (by net periodic payout), *Shortest term*.
- Ineligible schemes always appear **after** eligible ones, greyed out, with the reason. Never hide them.
- Badges, assigned by data, never subjective: "Highest net return", "Highest yield", "Regular income".

---

## 6. UI / UX

### 6.1 Page structure (top to bottom)
1. **Header/hero:** title, one-line explanation, language toggle (consistent with other tools).
2. **Input panel (one screen):**
   - **Amount** (required): large numeric input, Bengali/English digits accepted, live formatting with lakh/crore grouping and a words hint (e.g. "পাঁচ লক্ষ টাকা"). Quick-pick chips (e.g. 1 লক্ষ, 5 লক্ষ, 7.5 লক্ষ, 10 লক্ষ).
   - **Toggle:** "I am a pensioner" (affects eligibility and tax).
   - **Advanced (collapsed):** purchase date (default today; clamp to available periods).
   - **Calculate on input** (debounced), no submit button required. Keep a visible "Reset".
3. **Data freshness bar:** "Rates effective {from}–{to} · last verified {date}". Show a **stale warning** if today is later than `effectiveTo` of the latest period and no newer period exists ("New rates may have been announced — check the official source").
4. **Sort/filter chips** (see 5.4).
5. **Results: ranked scheme cards.** Each card shows:
   - Scheme name, term, small badge(s).
   - Big number: **net profit** (and total at maturity beneath).
   - Row: gross profit · tax deducted · effective yield.
   - For profit-based schemes: **net payout per period** prominently.
   - Collapsed "Details" section with:
     - "How this is calculated" (the `breakdown` steps),
     - Tax calculation,
     - **Early encashment table** (holding period → rate → net receivable),
     - Purchase limits for the scheme.
   - Ineligible cards: greyed, reason shown, no numbers.
6. **Compare mode:** user can tick 2–3 cards then "Compare" for a side-by-side table. On mobile, stack as swipeable columns or a vertical grouped table.
7. **Info section:** short FAQ (what is Sanchayapatra, how tax works, early encashment, difference between schemes, rates change every six months and apply at purchase).
8. **Disclaimer** (see Section 9) and **official links** (DNS, how to buy through banks/post offices).
9. **Footer:** consistent with other tools.

### 6.2 Deep links and sharing
Support query params: `?amount=500000&scheme=family&pensioner=1&date=2026-07-10&lang=bn&sort=net`. Parameters pre-fill the form and scroll to/expand the named scheme. "Copy link" button. No data leaves the browser.

### 6.3 States
- **Initial:** friendly empty state with example amounts. Optionally show a sample result for a default amount, labelled as an example.
- **Loading:** skeleton cards.
- **No data for date:** clear message, offer the nearest available period.
- **Fetch error:** retry button, plus offline-friendly message.
- **Zero/invalid amount, below minimum, over ceiling:** inline validation with plain-language messages.
- **Very large amounts:** handle up to at least Tk 100 crore without layout breaks.

### 6.4 Localization and formatting
- All user-facing strings in i18n files (`bn`, `en`). Data files carry bilingual labels.
- Bengali numerals when the language is Bengali. Lakh/crore grouping (`১২,৩৪,৫৬৭`), ৳ / "টাকা" per existing tool convention.
- Percentages to two decimals. Currency rounded as per Section 5.3.
- Date format consistent with other tools.

### 6.5 Accessibility and performance
- Semantic HTML, labelled inputs, keyboard operable, focus visible, sufficient contrast, `aria-live` on result updates, no color-only meaning.
- Respect reduced motion.
- Target: usable on slow 3G; JS bundle lean; fetch only needed JSON; cache with ETag/Cache-Control from the hub.

---

## 7. SEO and content

- Title/description in both languages, canonical URL, Open Graph image consistent with other tools.
- `FAQPage` structured data matching the on-page FAQ.
- Server-render or pre-render the static content (FAQ, intro) if the existing stack supports it.
- Suggested keywords to reflect naturally in copy (Bengali and English): সঞ্চয়পত্র মুনাফা ক্যালকুলেটর, সঞ্চয়পত্রের সুদ হার, পরিবার সঞ্চয়পত্র, পেনশনার সঞ্চয়পত্র, savings certificate profit calculator Bangladesh.

---

## 8. Validation, edge cases, testing

### 8.1 Data validation (script + CI)
- Validate every JSON file against its schema.
- Periods do not overlap; each file's `effectiveFrom/To` matches `index.json`.
- Rates in a sane range (for example 0–25%); `rateAboveThreshold <= rateAtOrBelowThreshold` unless the source says otherwise (then require a note).
- Every scheme in `schemes.json` has an entry in every rate file, or an explicit `"unavailable": true` with a reason.
- Early encashment rows sorted by `afterFullYears` with non-decreasing rates where expected.
- Tax rule bands sorted and non-overlapping.
- Fail the build if `meta.sources` is empty.

### 8.2 Unit tests (required)
- Tier boundaries: exactly Tk 7,50,000, one taka below, one above, in both `tierMode` settings.
- Tax boundaries: exactly Tk 5,00,000 and above; pensioner exempt at and above the cutoff.
- Purchase date at period boundaries (Jun 30 / Jul 1; Dec 31 / Jan 1) and dates with no data.
- Ceiling and minimum purchase handling.
- Payout-table path versus formula path give consistent results where both exist.
- Rounding behavior and very large amounts.
- Golden tests: at least one worked example per scheme, taken from an **official** table and cited in the test.

### 8.3 UI tests
- Amount formatting with Bengali/English digit input, paste handling.
- Sorting and chips; ineligible ordering; compare mode on mobile width.
- Deep link round trip.
- Stale-data banner logic using a mocked date.

---

## 9. Disclaimer and copy (must appear)

- Results are **estimates for information only**. The official rules and rates published by the Department of National Savings and the government prevail. Rates and tax rules can change and may differ for certificates bought in earlier periods.
- Not financial or tax advice.
- Tool is independent and not affiliated with the Government of Bangladesh.
- Link to official sources and note where certificates are sold (banks, post offices, per official information **VERIFY**).
- No data is stored or transmitted: "Your input stays in your browser."

Provide Bengali and English text for all of the above.

---

## 10. Data update workflow (six-monthly, AI-assisted)

Create `docs/data-update.md` and a reusable prompt. Rates are reviewed every six months and can change by gazette at short notice, so the process must be quick and safe.

**Prompt to give the AI IDE each cycle:**

> Update the savings certificate data for the new period. Steps:
> 1. Search the web for the latest rates for the four MVP schemes, prioritizing the Department of National Savings website and the Finance Division / IRD gazette or circular. Use news only to cross-check and list it as `type: "news"`.
> 2. Create `rates/<YYYY>-H<1|2>.json` following the schema. Fill the official payout table and early encashment schedule if published; otherwise leave `null` with notes.
> 3. Check `tax.json` for any change by NBR/IRD. Add a new effective-dated rule rather than editing history.
> 4. Update `index.json` (latest pointer, new period at top). Do not alter older period files unless correcting a documented error.
> 5. Set `meta.extractedBy = "ai"`, `reviewed = false`, `lastVerified = <today>`, and record every source URL.
> 6. Run the validation script and unit tests. Report any value that could not be confirmed from an official source, and any difference between sources.
> 7. Stop and show me the diff for review. Do not publish.

After the owner reviews, flip `reviewed` to `true` and deploy the JSON to the hub.

Also add a small **scheduled reminder** note in the docs: check in early January and early July, and whenever news reports a rate change.

---

## 11. Implementation phases

**Phase 1 — Data and engine**
1. Inspect existing tools codebase and hub JSON hosting conventions.
2. Define schemas and validation script.
3. Research and populate `schemes.json`, `tax.json`, and rate files for current plus 2–3 previous periods (mark **VERIFY** items resolved or `null`).
4. Build and unit-test the calculation engine.

**Phase 2 — UI**
5. Page shell, i18n, input panel, freshness bar.
6. Ranked cards, sort chips, details panel, early encashment table.
7. Compare mode, deep links, states and errors.

**Phase 3 — Polish and release**
8. Accessibility pass, performance pass, SEO/FAQ content, disclaimer.
9. Update workflow doc and prompt. Final review of all data with `reviewed: true`.
10. Deploy under `tools.ekushlabs.com`, add the tool to the tools index/listing page the same way the prize bond checker was added.

---

## 12. Acceptance criteria

- Entering an amount shows ranked cards for all four schemes with correct profit, tax, net, yield, and early encashment (where data exists).
- Changing purchase date changes the rate period used; dates without data show a clear message, never a guessed number.
- Tier and tax boundary cases match official worked examples.
- Ineligible schemes are shown greyed with reasons, after eligible ones.
- Works in Bengali and English with proper numerals and lakh/crore formatting.
- No user input is stored or sent anywhere.
- Data freshness and stale warnings behave correctly.
- Validation script and unit tests pass; adding a new period requires only a new JSON file plus an `index.json` entry.
- Visual design is indistinguishable in style from the other `tools.ekushlabs.com` tools.

---

## 13. Open items the implementer must resolve and document

| # | Item | Where it lands |
|---|---|---|
| 1 | Official purchase ceilings (individual and joint) per scheme | `schemes.json` |
| 2 | Does the lower rate above Tk 7.5 lakh apply to the whole amount or the excess only? | `rates/*.json` `tierMode` |
| 3 | Official payout tables per Tk 1 lakh and the official profit formula and rounding | `rates/*.json`, engine comments |
| 4 | Early encashment schedule per scheme, tier and holding period | `rates/*.json` |
| 5 | 3-month profit-based scheme: term, payout schedule, and early-encashment rules | `schemes.json`, rates |
| 6 | Tax: effective dates, per-certificate versus holder total, treatment above Tk 5 lakh, TIN effects, pensioner exemption details | `tax.json` |
| 7 | Rates for each historical period included in the MVP | `rates/*.json` |
| 8 | Hub folder path convention for static JSON | config constant |
| 9 | Where certificates can be bought and official links | info section |

For each item, record what was found, the source, and any residual uncertainty in `meta.notes`. If an item cannot be confirmed, the UI must degrade gracefully (show "refer to official source") rather than display an unverified number.
