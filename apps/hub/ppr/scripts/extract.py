#!/usr/bin/env python3
"""
Phase 0.1 - Extract the raw text stream from the PPR PDF.

PPR2025.pdf has a text layer, but Bengali is encoded in legacy Bangladeshi
fonts (SutonnyMJ / Nikosh / NikoshBAN) whose ToUnicode CMaps deliberately omit
every Bengali letter. Naive extraction therefore yields control characters.

This step does not attempt to decode anything. It records, per text span, the
font, the font object (xref), the page (both PDF index and printed gazette page),
the span's box on the page, and, for legacy fonts, the original font's character
code recovered by inverting each subset's cmap. The (font object, code) pair is
the stable key the decode tables are built against; the code alone is not,
because it is assigned per font object.

The box matters for two things downstream. The text layer draws part of the
document twice at the *same* coordinates, so the box is what tells a real span
from its overprint; and plain extraction splits one line across several spans
(`৭` and `১` arrive apart where `৭১।` is meant), so the box is also what puts a
line's spans back in order.

Outputs (build/):
  <edition>.stream.jsonl    one record per span, in reading order
  <edition>.inventory.json  per-family font objects, code frequency, and the
                            digit/punctuation part of the table that can be
                            derived automatically from ToUnicode
"""

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict

import pymupdf

from ppr_common import (
    FontResolver,
    classify_family,
    code_key,
    edition_pdf_path,
    ensure_build_dir,
    font_object_for_span,
    get_edition,
    load_families,
    strip_subset_prefix,
    write_json,
)

BFRANGE_RE = re.compile(r"<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>")


def parse_tounicode(doc, xref):
    """Return {stream_code: unicode_char} from a font's ToUnicode CMap."""
    mapping = {}
    key = doc.xref_get_key(xref, "ToUnicode")
    if key[0] != "xref":
        return mapping
    obj = int(key[1].split()[0])
    text = doc.xref_stream(obj).decode("latin-1", "replace")
    for src, src_end, dst in BFRANGE_RE.findall(text):
        start, end, base = int(src, 16), int(src_end, 16), int(dst, 16)
        for offset in range(end - start + 1):
            try:
                mapping[start + offset] = chr(base + offset)
            except ValueError:
                pass
    return mapping


def extract(edition_id):
    edition = get_edition(edition_id)
    pdf_path = edition_pdf_path(edition)
    if not os.path.exists(pdf_path):
        print(f"Error: source PDF not found at {pdf_path}")
        sys.exit(1)

    families = load_families()
    doc = pymupdf.open(pdf_path)
    resolver = FontResolver(doc)
    offset = edition.get("pageOffset", 0)

    build_dir = ensure_build_dir()
    stream_path = os.path.join(build_dir, f"{edition_id}.stream.jsonl")
    inventory_path = os.path.join(build_dir, f"{edition_id}.inventory.json")

    # ---- font objects -------------------------------------------------
    font_objects = {}
    duplicate_name_pages = []
    for page_number in range(doc.page_count):
        seen_on_page = {}
        for xref, _ext, _type, base_name, _ref, _enc in doc.get_page_fonts(page_number):
            family_id, kind = classify_family(base_name, families)
            record = font_objects.setdefault(
                xref,
                {
                    "xref": xref,
                    "baseFont": strip_subset_prefix(base_name),
                    "family": family_id,
                    "kind": kind,
                    "pages": 0,
                    "glyphOrderSize": 0,
                    "autoMapped": 0,
                },
            )
            record["pages"] += 1
            if record["kind"] == "legacy":
                record["glyphOrderSize"] = resolver.glyph_count(xref)
            # Two subsets of one family can mount on one page under different
            # subset tags ('GTJPCB+NikoshBAN' and 'WBFANC+NikoshBAN'). The span
            # only names the family, so the collision is recorded here and the
            # object is settled per span, from the glyph ids.
            stripped = strip_subset_prefix(base_name)
            if stripped in seen_on_page:
                duplicate_name_pages.append(
                    {
                        "page": page_number,
                        "baseFont": stripped,
                        "fonts": [seen_on_page[stripped], xref],
                    }
                )
            seen_on_page[stripped] = xref

    # ---- automatically derivable table entries (digits, punctuation) ---
    auto_tables = defaultdict(dict)
    for xref, record in font_objects.items():
        if record["kind"] != "legacy":
            continue
        for code, char in parse_tounicode(doc, xref).items():
            if 0 < code < 0x100:
                auto_tables[record["family"]][code_key(code)] = char
                record["autoMapped"] += 1

    # ---- stream -------------------------------------------------------
    code_frequency = defaultdict(Counter)
    uncoded_shapes = defaultdict(Counter)
    family_chars = Counter()
    footer_mismatches = []
    unresolved = defaultdict(set)
    span_total = 0

    with open(stream_path, "w", encoding="utf-8") as out:
        for page_number in range(doc.page_count):
            fonts_on_page = {}
            for xref, _ext, _type, base_name, _ref, _enc in doc.get_page_fonts(page_number):
                fonts_on_page.setdefault(strip_subset_prefix(base_name), []).append(xref)

            raw_page_text = doc[page_number].get_text()
            gazette_numbers = re.findall(r"\b9[0-9]{3}\b", raw_page_text)
            gazette_page = page_number + offset
            if gazette_numbers and int(gazette_numbers[0]) != gazette_page:
                footer_mismatches.append(
                    {"pdfIndex": page_number, "printed": int(gazette_numbers[0]), "computed": gazette_page}
                )

            for span in doc[page_number].get_texttrace():
                font_name = strip_subset_prefix(span["font"])
                family_id, kind = classify_family(font_name, families)
                # Two subsets of one family can mount on one page, and the span
                # only names the family: the glyph ids pick the object.
                xref = font_object_for_span(
                    fonts_on_page.get(font_name, []), span["chars"], kind, resolver
                )

                glyphs = []
                resolved = []
                for code_point, gid, _origin, _bbox in span["chars"]:
                    char = chr(code_point)
                    resolved.append(char)
                    if kind != "legacy" or xref is None:
                        glyphs.append(char)
                        continue
                    code = resolver.code_for_gid(xref, gid)
                    if code:
                        key = code_key(code)
                        glyphs.append(key)
                        code_frequency[family_id][key] += 1
                        continue
                    # No cmap entry: the glyph can only be named by its drawing.
                    shape = resolver.shape_for_gid(xref, gid)
                    if shape:
                        glyphs.append(f"~{shape}")
                        uncoded_shapes[family_id][shape] += 1
                    else:
                        glyphs.append(f"={char}")
                        unresolved[family_id].add(char)

                out.write(
                    json.dumps(
                        {
                            "p": page_number,
                            "g": gazette_page,
                            "f": font_name,
                            "o": xref,
                            "fam": family_id,
                            "bbox": [round(value, 1) for value in span["bbox"]],
                            "glyphs": glyphs,
                            "resolved": "".join(resolved),
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                span_total += 1
                family_chars[family_id] += len(span["chars"])

    # ---- inventory ----------------------------------------------------
    inventory = {
        "schemaVersion": 1,
        "edition": edition_id,
        "sourcePdf": edition["sourcePdf"],
        "pdfPages": doc.page_count,
        "pageOffset": offset,
        "footerMismatches": footer_mismatches,
        "spanCount": span_total,
        "charCountByFamily": dict(family_chars.most_common()),
        "fonts": sorted(font_objects.values(), key=lambda r: r["baseFont"]),
        "duplicateFontNames": duplicate_name_pages,
        "legacyFamilies": {},
    }

    for family_id in sorted(code_frequency):
        freq = code_frequency[family_id]
        auto = auto_tables.get(family_id, {})
        covered = sum(count for code, count in freq.items() if code in auto)
        total = sum(freq.values())
        inventory["legacyFamilies"][family_id] = {
            "distinctCodes": len(freq),
            "totalGlyphs": total,
            "autoMappedCodes": len(auto),
            "autoMappedCoverage": round(covered / total, 4) if total else 0,
            "uncodedShapes": dict(uncoded_shapes[family_id].most_common()),
            "unresolvedLiterals": sorted(unresolved[family_id]),
            "codeFrequency": [{"code": code, "count": count} for code, count in freq.most_common()],
            "autoTable": auto,
        }

    write_json(inventory_path, inventory)
    doc.close()

    print(f"Pages            : {inventory['pdfPages']}")
    print(f"Spans            : {span_total}")
    print(f"Footer mismatch  : {len(footer_mismatches)} (page offset {offset})")
    print(f"Font objects     : {len(font_objects)} ({len(duplicate_name_pages)} duplicate-name cases)")
    print("\nChars by family:")
    for family_id, count in family_chars.most_common():
        print(f"  {count:>9}  {family_id}")
    print("\nLegacy families:")
    for family_id, info in inventory["legacyFamilies"].items():
        print(
            f"  {family_id:<11} codes={info['distinctCodes']:<4} glyphs={info['totalGlyphs']:<7} "
            f"auto-mapped={info['autoMappedCodes']:<4} ({info['autoMappedCoverage']:.1%}) "
            f"uncoded-shapes={len(info['uncodedShapes'])}"
        )
    print(f"\nWrote {stream_path}")
    print(f"Wrote {inventory_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--edition", default="ppr2025")
    extract(parser.parse_args().edition)
