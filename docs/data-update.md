# Savings Certificate Data Update Workflow (Six-Monthly)

This guide documents the periodic rate and tax maintenance pipeline for the **Ekush Labs Savings Certificate Calculator**.

---

## 1. Schedule & Monitoring
- **Review Cycle:** Early January (for H1: Jan–Jun) and early July (for H2: Jul–Dec).
- **Ad-hoc Updates:** Whenever the Ministry of Finance / Internal Resources Division (IRD) publishes an SRO/gazette notification regarding National Savings Certificates (Sanchayapatra).
- **Official Sources:**
  - Department of National Savings (DNS): [https://nationalsavings.gov.bd](https://nationalsavings.gov.bd)
  - Finance Division, Ministry of Finance: [https://mof.gov.bd](https://mof.gov.bd)
  - Internal Resources Division: [https://ird.gov.bd](https://ird.gov.bd)
  - Bangladesh Bank: [https://bb.org.bd](https://bb.org.bd)
  - National Board of Revenue (NBR): [https://nbr.gov.bd](https://nbr.gov.bd)

---

## 2. Step-by-Step Update Procedure

### Step 1: Research New Period Rates
1. Check DNS or IRD website for the latest circular.
2. Note effective dates, rates for the four MVP schemes:
   - `family` (পরিবার সঞ্চয়পত্র)
   - `pensioner` (পেনশনার সঞ্চয়পত্র)
   - `profit_3month` (৩ মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র)
   - `bangladesh_5yr` (৫ বছর মেয়াদী বাংলাদেশ সঞ্চয়পত্র)
3. Confirm tier threshold (e.g. Tk 7,50,000) and whether `tierMode` remains `excess_only`.
4. Check early encashment schedule for completed holding years.

### Step 2: Create New Period Rate File
Create `apps/hub/savings-certificate/assets/rates/<YYYY>-H<1|2>.json`:
```json
{
  "meta": {
    "schemaVersion": "1.0.0",
    "dataVersion": "<YYYY-MM-DD>.1",
    "lastVerified": "<YYYY-MM-DD>",
    "sources": [
      {
        "title": "Official Gazette Notification Title",
        "url": "https://...",
        "publishedOn": "<YYYY-MM-DD>",
        "type": "gazette"
      }
    ],
    "extractedBy": "ai",
    "reviewed": false,
    "notes": ""
  },
  "periodId": "<YYYY>-H<1|2>",
  "effectiveFrom": "<YYYY-MM-DD>",
  "effectiveTo": "<YYYY-MM-DD>",
  "currency": "BDT",
  "tierThreshold": 750000,
  "tierMode": "excess_only",
  "schemes": { ... }
}
```

### Step 3: Update `index.json`
Prepend the new period to the `periods` array in `apps/hub/savings-certificate/assets/index.json` and set `"latestPeriodId": "<YYYY>-H<1|2>"`.

### Step 4: Check `tax.json`
If NBR or the Finance Act altered source tax (TDS) brackets or pensioner exemptions, append a new rule object with its `effectiveFrom` date. Do not alter historical rules.

### Step 5: Mirror Assets to Tools Public Directory
Run:
```bash
node -e "const fs = require('fs'); fs.cpSync('apps/hub/savings-certificate/assets', 'apps/tools/public/savings-certificate/assets', { recursive: true }); console.log('Copied assets to tools/public');"
```

### Step 6: Run Data Validation and Test Suites
1. Run data validator:
   ```bash
   node apps/hub/savings-certificate/scripts/validate.mjs
   ```
2. Run unit tests:
   ```bash
   npm run test --workspace=apps/tools
   ```

### Step 7: Review & Deploy
1. Inspect the diff: ensure rates and sources match official publications.
2. Flip `"reviewed": true` in the new JSON file.
3. Commit and deploy:
   - Hub assets deploy to `hub.ekushlabs.com/savings-certificate/assets/`.
   - Web application deploys to `tools.ekushlabs.com`.

---

## 3. Reusable AI Prompt for Update Cycles

Copy and give the following prompt to the AI IDE at the start of each cycle:

```text
Update the savings certificate data for the new period. Steps:
1. Search the web for the latest rates for the four MVP schemes, prioritizing the Department of National Savings website and the Finance Division / IRD gazette or circular. Use news only to cross-check and list it as type: "news".
2. Create rates/<YYYY>-H<1|2>.json following the schema. Fill the official payout table and early encashment schedule if published; otherwise leave null with notes.
3. Check tax.json for any change by NBR/IRD. Add a new effective-dated rule rather than editing history.
4. Update index.json (latest pointer, new period at top). Do not alter older period files unless correcting a documented error.
5. Set meta.extractedBy = "ai", reviewed = false, lastVerified = <today>, and record every source URL.
6. Mirror files into apps/tools/public/savings-certificate/assets/.
7. Run the validation script (node apps/hub/savings-certificate/scripts/validate.mjs) and unit tests (npm run test --workspace=apps/tools). Report any value that could not be confirmed from an official source, and any difference between sources.
8. Stop and show me the diff for review. Do not publish until approved.
```
