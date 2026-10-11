# Prize Bond Draw Management & Deployment Guide

This directory manages the Bangladesh Prize Bond draw results and data pipeline for [EkushLabs Tools](https://tools.ekushlabs.com/prize-bond-result-checker).

## Directory Structure
- `source/`: Official PDFs downloaded from Bangladesh Bank (retained for audit, not served).
- `scripts/`:
  - `validate_draw.py`: Validates draw JSON format, counts, uniqueness, and rules.
  - `build_manifest.py`: Regenerates `assets/index.json` with content hashes and claim validity dates.
- `schema/`: JSON Schemas for draw files and index manifest.
- `assets/`: The folder deployed directly to `hub.ekushlabs.com/bond/assets/`.

## How to Add a New Draw
1. Download the official PDF into `source/draw-<NNN>-<YYYY-MM-DD>.pdf`.
2. Extract the numbers and create `assets/draws/<NNN>.json` matching `schema/draw.schema.json`.
3. Run the validator:
   ```bash
   python scripts/validate_draw.py
   ```
4. Regenerate manifest:
   ```bash
   python scripts/build_manifest.py
   ```
5. Commit and deploy.
