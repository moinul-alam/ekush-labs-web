#!/usr/bin/env python3
"""
Phase 0.3 - Auto-label legacy glyph shapes from the Unicode reference fonts.

Legacy Nikosh/NikoshBAN glyphs carry no Unicode, so the only way to name them is
to compare their drawings with a font that does. `scripts/reference_fonts/`
holds the Unicode edition of both (see families.json `referenceFont`).

Raw outlines do NOT match across the two: the embedded legacy glyph is the same
letterform drawn at a different size and origin, so `shape_id` (which rounds raw
coordinates) finds almost nothing. `normalised_shape_key` removes translation
and uniform scaling first, and then the match is exact - to 1/1000 em.

Two tables are read off the reference font:

  - its cmap, drawing by drawing. That names every base letter and matra.
  - its GSUB rules, each rewritten as the Unicode the rule spells. A conjunct is
    one glyph in a legacy font but a sequence in the reference, and the reference
    carries that conjunct as its own ligature glyph, so the same drawing match
    names it - correctly, because the rules are written in logical order.
    Components are often themselves ligatures (half forms), and a context-specific
    drawing is a one-for-one substitution of the letter it draws, so both kinds of
    rule are followed until they stop yielding anything new.

What that resolves, and what it cannot:
  - base letters and matras    exact match, confidence 1.0
  - conjuncts, half forms,
    reph, vowel ligatures      drawing match against a ligature glyph, 0.9
  - blank glyphs               empty outline, labelled space
  - digits, and the Assamese
    twin of any letter         the reference draws both identically; the
                               gazette is Bengali, so the Bengali reading wins
                               at reduced confidence, with every candidate kept
  - shapes the reference has
    no drawing of at all       left empty for the review sheet

After this step every row in the review sheet is a shape whose drawing the
reference font does not contain - a genuinely ambiguous one, not an unreachable
one.

Writes into each glyph_tables/shapes/<family>.json, per shape:
  unicode      the drafted reading (one character, or several for a conjunct)
  confidence   1.0 exact, 0.9 ligature, 0.6 where the choice was a convention
  source       which tier produced it
  candidates   every reading the same drawing could have
and a report to build/<edition>.labels.json.
"""

import argparse
import collections
import itertools
import json
import os
import sys

import pymupdf
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

from ppr_common import (
    BUILD_DIR,
    GLYPH_DIR,
    REFERENCE_DIR,
    FontResolver,
    edition_pdf_path,
    ensure_build_dir,
    get_edition,
    load_families,
    normalised_shape_key,
    write_json,
)
from glyph_inventory import SHAPE_FAMILIES, shape_gids

SPACE = " "

# Codepoints the reference cmap may name; beyond this the entries are not text.
MAX_REFERENCE_CODEPOINT = 0x2FFF

# Assamese letters the reference draws exactly like their Bengali twin - ৰ is
# র, ৱ is ব. The gazette is Bengali, so a reading using one of these loses.
ASSAMESE = {0x09F0, 0x09F1}

# A glyph reachable several ways (and every longer sequence built on it) only
# needs a few readings kept, best first; the rest say the same thing louder.
MAX_READINGS_PER_GLYPH = 4
LIGATURE_ROUNDS = 12

# Report tiers, and the `source` values that belong to each.
TIER_SOURCES = {
    "exact": ("shape-match",),
    "ligature": ("shape-match-ligature",),
    "ambiguous": ("shape-match-ambiguous",),
    "blank": ("blank",),
    "unmatched": ("unmatched",),
}


def reference_region(glyph_set, glyph_name):
    pen = DecomposingRecordingPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return pen.value


def reference_cmap(ttf):
    """codepoint -> glyph name, over the codepoints the font uses for text."""
    codepoints = {}
    for table in ttf["cmap"].tables:
        for codepoint, glyph_name in table.cmap.items():
            if codepoint <= MAX_REFERENCE_CODEPOINT:
                codepoints.setdefault(codepoint, glyph_name)
    return codepoints


def ligature_rules(ttf):
    """(ligature glyph, component glyphs) for every ligature rule in the font."""
    rules = []
    gsub = ttf["GSUB"].table if "GSUB" in ttf else None
    if not gsub or not gsub.LookupList:
        return rules
    for lookup in gsub.LookupList.Lookup:
        for subtable in lookup.SubTable:
            for first, ligatures in getattr(subtable, "ligatures", {}).items():
                for ligature in ligatures:
                    rules.append((ligature.LigGlyph, [first, *ligature.Component]))
    return rules


def single_substitutions(ttf):
    """(glyph, the glyph it is substituted by) for every one-for-one rule."""
    rules = []
    gsub = ttf["GSUB"].table if "GSUB" in ttf else None
    if not gsub or not gsub.LookupList:
        return rules
    for lookup in gsub.LookupList.Lookup:
        for subtable in lookup.SubTable:
            rules.extend(getattr(subtable, "mapping", {}).items())
    return rules


def glyph_readings(ttf, codepoints):
    """
    glyph name -> the Unicode readings that draw it.

    The cmap names every base letter directly. A conjunct is not in the cmap,
    but a ligature rule spells it out of components, and a component may itself
    be a ligature (a half form), so the rules are resolved over and over until
    nothing new appears. The chain bottoms out in cmap names, so a rule only
    gets a reading when the whole chain is known.

    Single substitutions are resolved alongside them. A script engine swaps a
    glyph for a context-specific drawing of the same letter - the pre-base
    matra has a narrower initial form, so it is a glyph the cmap never names -
    and a reading carries across that swap unchanged.

    A glyph can be reachable more than one way - the Assamese and the Bengali
    ra are separate codepoints on one glyph - so readings are kept as a set,
    capped and best-first. That ambiguity is real and belongs in the sheet.
    """
    readings = {}
    for codepoint, name in codepoints.items():
        readings.setdefault(name, set()).add(chr(codepoint))
    ligatures = ligature_rules(ttf)
    singles = single_substitutions(ttf)
    for _round in range(LIGATURE_ROUNDS):
        changed = False
        for glyph, components in ligatures:
            parts = [readings.get(name) for name in components]
            if any(not part for part in parts):
                continue
            previous = set(readings.get(glyph, ()))
            combined = readings.setdefault(glyph, set())
            for combination in itertools.product(
                *(sorted(part, key=reading_rank)[:MAX_READINGS_PER_GLYPH] for part in parts)
            ):
                combined.add("".join(combination))
            if len(combined) > MAX_READINGS_PER_GLYPH:
                readings[glyph] = set(
                    sorted(combined, key=reading_rank)[:MAX_READINGS_PER_GLYPH]
                )
            if readings[glyph] != previous:
                changed = True
        for glyph, substitute in singles:
            source = readings.get(glyph)
            if not source:
                continue
            previous = set(readings.get(substitute, ()))
            combined = readings.setdefault(substitute, set()) | source
            if len(combined) > MAX_READINGS_PER_GLYPH:
                combined = set(sorted(combined, key=reading_rank)[:MAX_READINGS_PER_GLYPH])
            readings[substitute] = combined
            if combined != previous:
                changed = True
        if not changed:
            break
    return {glyph: value for glyph, value in readings.items() if value}


def build_reference_tables():
    """
    family id -> {single: key -> codepoints, readings: key -> readings}.

    Both are keyed by the same normalised drawing, so a legacy shape is looked
    up once and found in whichever table the reference keeps it.
    """
    tables = {}
    for family in load_families():
        file_name = family.get("referenceFont")
        if not file_name:
            continue
        path = os.path.join(REFERENCE_DIR, file_name)
        if not os.path.exists(path):
            sys.exit(f"Error: reference font not found: {path}")
        ttf = TTFont(path, lazy=True)
        glyph_set = ttf.getGlyphSet()
        codepoints = reference_cmap(ttf)

        single = collections.defaultdict(set)
        for codepoint, glyph_name in codepoints.items():
            key = normalised_shape_key(reference_region(glyph_set, glyph_name))
            if key:
                single[key].add(codepoint)

        readings = collections.defaultdict(set)
        for glyph_name, named in glyph_readings(ttf, codepoints).items():
            key = normalised_shape_key(reference_region(glyph_set, glyph_name))
            if key:
                readings[key].update(named)

        ttf.close()
        tables[family["id"]] = {"single": single, "readings": readings}
    return tables


def reading_rank(reading):
    """
    Sort key that picks the reading a Bengali gazette would use: no Assamese
    letter, then nothing outside the Bengali block (which is how the Bengali
    numeral beats the ASCII digit), then short, then low.
    """
    return (
        sum(1 for char in reading if ord(char) in ASSAMESE),
        sum(1 for char in reading if not 0x0980 <= ord(char) <= 0x09FF),
        len(reading),
        tuple(ord(char) for char in reading),
    )


def label_family(entries, objects, gids, resolver, reference):
    """Fill unicode/confidence/source/candidates on one family's shape table."""
    summary = collections.Counter()
    for shape, entry in entries.items():
        site = next(
            (object_key for object_key in entry["objects"] if (object_key, shape) in gids),
            None,
        )
        key = None
        if site:
            key = resolver.normalised_key(objects[site]["xref"], gids[(site, shape)])
        if key is None:
            entry["unicode"], entry["confidence"], entry["source"] = SPACE, 0.9, "blank"
            entry["candidates"] = [SPACE]
            summary["blank"] += entry["count"]
            continue

        codepoints = reference["single"].get(key, set())
        readings = sorted(reference["readings"].get(key, set()))
        if len(codepoints) == 1:
            reading = chr(next(iter(codepoints)))
            tier, confidence, source = "exact", 1.0, "shape-match"
        elif len(readings) == 1:
            reading = readings[0]
            tier, confidence, source = "ligature", 0.9, "shape-match-ligature"
        elif codepoints or readings:
            candidates = sorted({chr(codepoint) for codepoint in codepoints} | set(readings))
            reading = min(candidates, key=reading_rank)
            tier, confidence, source = "ambiguous", 0.6, "shape-match-ambiguous"
        else:
            entry["unicode"], entry["confidence"], entry["source"] = "", None, "unmatched"
            entry["candidates"] = []
            summary["unmatched"] += entry["count"]
            continue

        entry["unicode"], entry["confidence"], entry["source"] = reading, confidence, source
        entry["candidates"] = sorted(
            {reading} | {chr(codepoint) for codepoint in codepoints} | set(readings)
        )
        summary[tier] += entry["count"]
    return summary


def tier_rows(entries, tier):
    """How many shapes landed in a tier, and every non-empty reading counted."""
    sources = TIER_SOURCES[tier]
    readings = collections.Counter()
    rows = 0
    for entry in entries.values():
        if entry["source"] not in sources:
            continue
        rows += 1
        if entry["unicode"]:
            readings[entry["unicode"]] += entry["count"]
    return rows, readings


def is_garbage(reading):
    """Control, surrogate or private-use reading - the shape of broken output."""
    return any(
        ord(char) < 0x20 or 0x7F <= ord(char) <= 0x9F or 0xD800 <= ord(char) <= 0xF8FF
        for char in reading
    )


def main(edition_id):
    edition = get_edition(edition_id)
    pdf_path = edition_pdf_path(edition)
    if not os.path.exists(pdf_path):
        sys.exit(f"Error: source PDF not found at {pdf_path}")

    objects_path = os.path.join(GLYPH_DIR, "objects.json")
    if not os.path.exists(objects_path):
        sys.exit("Error: glyph_tables/objects.json not found - run glyph_inventory.py first")
    with open(objects_path, "r", encoding="utf-8") as fh:
        objects = json.load(fh)["objects"]

    reference = build_reference_tables()

    doc = pymupdf.open(pdf_path)
    resolver = FontResolver(doc)
    gids = shape_gids(objects, resolver)

    shapes_dir = os.path.join(GLYPH_DIR, "shapes")
    report = {"schemaVersion": 1, "edition": edition_id, "families": {}}
    labels = {}
    for family in SHAPE_FAMILIES:
        path = os.path.join(shapes_dir, f"{family}.json")
        if not os.path.exists(path):
            sys.exit(f"Error: {path} not found - run glyph_inventory.py first")
        with open(path, "r", encoding="utf-8") as fh:
            document = json.load(fh)
        entries = document["shapes"]
        summary = label_family(entries, objects, gids, resolver, reference[family])
        document["note"] = (
            "shape id -> Unicode. 'unicode' is one character, or several where the "
            "drawing is a conjunct. 'confidence' is 1.0 for an exact drawing match "
            "against the reference font, 0.9 where the match was a ligature glyph of "
            "that font, lower where the reading was a convention. 'candidates' lists "
            "every reading of the same drawing. Empty 'unicode' means the reference "
            "font has no such drawing and the shape needs review."
        )
        write_json(path, document)
        labels[family] = entries
        total = sum(entry["count"] for entry in entries.values())
        tiers = {tier: tier_rows(entries, tier) for tier in TIER_SOURCES}
        readings = collections.Counter()
        for tier, (_rows, tier_readings) in tiers.items():
            if tier != "blank":  # the blank glyph is always first and says nothing
                readings.update(tier_readings)
        report["families"][family] = {
            "occurrences": total,
            "byTier": {
                tier: {
                    "glyphs": summary[tier],
                    "share": round(summary[tier] / total, 4) if total else 0,
                    "rows": rows,
                }
                for tier, (rows, _tier_readings) in tiers.items()
            },
            # Frequency cross-check: a Bengali gazette's most frequent glyphs must
            # land on the most frequent letters (matras, then common consonants).
            "topReadings": [
                {"unicode": char, "glyphs": count} for char, count in readings.most_common(20)
            ],
            "garbageReadings": sorted(char for char in readings if is_garbage(char)),
        }

    doc.close()
    build_dir = ensure_build_dir()
    write_json(os.path.join(build_dir, f"{edition_id}.labels.json"), {**report, "labels": labels})

    for family in SHAPE_FAMILIES:
        info = report["families"][family]
        print(f"\n{family}: {len(labels[family])} shapes, {info['occurrences']} glyph positions")
        for tier in TIER_SOURCES:
            row = info["byTier"][tier]
            if row["glyphs"]:
                print(
                    f"   {tier:<10} rows={row['rows']:<4} glyphs={row['glyphs']:<7} "
                    f"({100 * row['share']:.1f}%)"
                )
        top = "  ".join(
            f"{item['unicode']}:{item['glyphs']:,}" for item in info["topReadings"][:10]
        )
        print(f"   most frequent readings  {top}")
        if info["garbageReadings"]:
            print(f"   GARBAGE  {info['garbageReadings']}")
    print(f"\nWrote {os.path.join(build_dir, edition_id + '.labels.json')}")
    print(f"Updated {os.path.join(GLYPH_DIR, 'shapes')}/*.json")
    print("Re-run glyph_inventory.py to render review_sheet.html with these drafts.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--edition", default="ppr2025")
    main(parser.parse_args().edition)
