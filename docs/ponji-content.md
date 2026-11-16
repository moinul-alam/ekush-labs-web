# Ekush Ponji Content Update Workflow (Annual)

This guide documents how the **Ekush Ponji** app's words and quotes datasets are maintained and refreshed.

---

## 1. Schedule & Layout

- **Review Cycle:** Every November, prepare the datasets for the coming calendar year.
- **Ad-hoc Fixes:** Any missing day, invalid date, or content correction — publish immediately.
- **Live endpoints:** `https://hub.ekushlabs.com/ponji/manifest.json` (see `manifest.json` in this folder).
- **Reminder:** a scheduled GitHub Action opens an issue titled `Ponji content refresh for <year>` every 1 November.

```
apps/hub/ponji/
├── manifest.json              # version stamps + dataset file map
├── words/words_en.json        # daily word, 366 slots
├── quotes/quotes_en.json      # daily quote, 366 slots
├── holidays/holidays_<year>.json
├── hijri/<year>.json
├── today/todays_occasion.json
└── scripts/validate.mjs       # validator (run before every push)
```

## 2. The Slot Model

Both daily datasets are keyed by `month` + `day`, one entry per calendar slot:

- **366 slots** — February 29 included, so leap days are covered (the app falls back to the first entry on a missing slot, which users would otherwise see).
- Entries **sorted** by month, then day.
- No duplicate slots and no impossible dates (`4-31`, `6-31`, and the like).

Quote entries are bilingual: `text` / `author` in English plus `textBn` / `authorBn` in Bengali script, and a dataset-level `categories` map translates each English `category` value into its Bangla label. The app renders Bangla by locale and falls back to English when a `*Bn` field is empty, so Bengali fields are mandatory for new content.

The app reads `words_en.json` / `quotes_en.json` through `manifest.json`. A user's install downloads new data only when `datasets.<name>.version` increases **or** the manifest stamp (`manifestVersion` + `lastUpdated` + file paths) changes.

## 3. Annual Refresh Procedure

### Step 1: Draft the New Content
- Words: 366 entries, unique spellings (repeats across years are fine; repeats within one file are discouraged).
- Quotes: 366 entries, unique slots, each with `text`, `textBn`, `author`, `authorBn`, `category`, plus a `categories` map covering every category used.
- Keep the exact schema of the existing files — the app validates and rejects incomplete entries field-by-field.

### Step 2: Write the Files
Replace `words/words_en.json` / `quotes/quotes_en.json` in place. Preserve the existing formatting (2-space indent, one field per line) so diffs stay reviewable.

### Step 3: Run the Validator
```bash
node apps/hub/ponji/scripts/validate.mjs
```
Must print `PASSED`. Repeated word spellings are warnings; everything else is a hard failure. CI runs the same script on every push touching `apps/hub/ponji/`.

### Step 4: Bump Versions
In `manifest.json`:
1. `datasets.words.version` / `datasets.quotes.version` +1 for each dataset you changed.
2. `manifestVersion` +1.
3. `lastUpdated` = today (`YYYY-MM-DD`).
4. Mirror the same bump in the dataset file's own `version` and `count`.

Without these bumps existing installs will keep serving cached content.

### Step 5: Publish & Verify
1. Push to `main` — the hub deploys to `hub.ekushlabs.com/ponji/`.
2. Verify the live files match the repo:
   ```bash
   curl -sS https://hub.ekushlabs.com/ponji/manifest.json
   curl -sS https://hub.ekushlabs.com/ponji/words/words_en.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.count,j.version,j.words.at(-1))})"
   ```
   Note: the host serves LF line endings even though the repo stores CRLF, so byte counts differ — compare parsed JSON, not file sizes.

### Step 6: Refresh the App Seed
The Flutter app bundles a copy of both datasets as its offline seed (`apps/ekush_ponji/assets/data/...` in the `ekush-space` repo). Copy the published files there before any release; existing installs sync from the hub on their own.

## 4. Rollback

1. `git revert` the content commit (or restore the previous JSON), then bump `manifestVersion` + `lastUpdated` again — reverting a commit alone would restore the old numbers, which installs ignore because they already have that version cached.
2. Re-run the validator, push.

## 5. Reusable AI Prompt for Refresh Cycles

```text
Refresh the Ekush Ponji daily content for <YEAR>. Steps:
1. Read apps/hub/ponji/words/words_en.json and quotes/quotes_en.json and keep their exact schema, key order and formatting.
2. Produce 366 word entries: one per calendar slot including Feb 29, sorted, unique spellings, each with word, partOfSpeech, meaningEn, meaningBn (must contain Bengali script), synonym, example, pronunciation (with Bengali transliteration).
3. Optionally produce 366 new quotes with text, textBn, author, authorBn, category — one per slot, no invalid dates — and add a Bengali label for every category to the dataset's categories map. Bangla must read naturally, not like a literal machine translation.
4. Run node apps/hub/ponji/scripts/validate.mjs and fix every error before continuing.
5. Bump manifestVersion, the changed datasets' versions and lastUpdated in manifest.json; bump each file's own version and count.
6. Show me the diff summary and the validator output. Do not commit or push until approved.
```
