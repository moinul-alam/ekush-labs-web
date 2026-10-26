# PPR Plan — Implementation Complete

The [PPR plan](file:///c:/App/ekush-labs-web/ppr-plan.md) is finished. Nothing is left to resume.
Task-level detail and evidence live in [progress-status.md](file:///c:/App/ekush-labs-web/progress-status.md).

## Where it stands

| Phase | State | Output |
|---|---|---|
| 0 — Text recovery | Done | Legacy-font decode: 8 font objects, 456 shapes, 15,031 spans reordered visual → logical, 0 hasanta violations |
| 1 — Structure and corpus | Done | 9 chapters, 40 parts, 154 rules (1–154, no gaps), 17 schedules; canonical corpus in `apps/hub/ppr/source/ppr2025/` |
| 2 — Search index | Done | `assets/ppr2025/` documents + manifest, 900-key L0 resolver, alias/facet tables; benchmark green incl. `OTM` → rule ৭৮ |
| 3 — Application | Done | `apps/tools/src/components/ppr/StudyApp.svelte` + `PdfViewer.svelte`; search → clause → correct gazette page |
| 4 — v1 differentiators | Done | Cross-reference graph, glossary, content-hash offline cache |

## What ships

- **Route:** `tools.ekushlabs.com/ppr-2025-study` (and `/en/ppr-2025-study`).
- **Island:** `apps/tools/src/components/ppr/StudyApp.svelte` — chapter browse, search grouped by
  chapter, clause detail with citation/permalink, cross-reference and glossary panels, URL state
  (`?clause/?chapter/?q/?page/?pdfq`).
- **Viewer:** `apps/tools/src/components/ppr/PdfViewer.svelte` — pdf.js over the hub-hosted
  `PPR2025.pdf`, opened by `?page=`, with in-page match highlighting.
- **Libs:** `apps/tools/src/lib/ppr/{search,refs,data}.ts`.

## Verification

```powershell
cd apps/tools
npm test        # 70/70 pass (ppr-search 23, ppr-refs 15, savings 21, prize-bond 11)
npm run build   # clean; both routes prerendered
```

## Still open (recorded, not blocking)

The five open questions in [progress-status.md](file:///c:/App/ekush-labs-web/progress-status.md#open-questions)
are unaffected by Phases 3–4. The two that touch the shipped tool:

- **SutonnyMJ (open question 4)** — 571 spans pass through `reorder.py` unreordered, but they are
  gazette furniture (masthead, running header, page label, price footer) and measured as absent
  from the corpus and the shipped assets. Nothing searchable is missing, so this is a robustness
  item, not a gap. The work is order-sensitive: `HEADER_RE` matches the Bijoy-ASCII form and that
  same header marks a page image-only, so a `sutonnymj.json` table must land after furniture
  stripping or `HEADER_RE` must change with it.
- **Verification of the edition itself** — `editions.json` still has `verified: false`; titles and
  the effective date need confirming against the gazette cover before release.

Uncommitted work: the Phase 3/4 app files and the PPR assets/tools libraries.
