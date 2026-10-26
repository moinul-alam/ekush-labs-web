#!/usr/bin/env python3
"""
Phase 0.6 - Corpus QA harness.

Runs the offline checks of ppr-plan.md section 7 against the built text and exits
non-zero if one of them fails, so a broken decode cannot go out looking correct.

  1  residual characters   no control, surrogate or unassigned codepoint in the
                           text. The two classified kinds - U+FFFD from a
                           Unicode font that has no glyph, and the Symbol /
                           Wingdings private-use symbols - are counted and
                           attributed to their font family instead; their
                           disposition is tracked in progress-status "Open
                           questions", so they are reported, not hidden.
  2  expected keywords     বিধি / অধ্যায় / তফসিল present at plausible frequency.
  3  rule numbering        the rule series structure.py produced is contiguous
                           1..N and the chapters partition it exactly.
  4  page coverage         every gazette page of the edition carries a provision,
                           or is a page the structure recorded as an image with
                           no text layer - and the recorded image pages are
                           exactly the pages that carry no provision.
  5  known strings         the fixed list in reorder.py decodes exactly, and no
                           visual-order spelling of it survives.
  6  oracle divergence     skipped - external cross-check against the web
                           edition, run by hand (plan section 2).

Reads build/<edition>.text.jsonl + build/<edition>.inventory.json and, when it
exists, build/<edition>.structure.json (written by structure.py); writes
build/<edition>.validation.json.
"""

import argparse
import json
import os
import sys
import unicodedata
from collections import Counter, OrderedDict

from ppr_common import (
    ensure_build_dir,
    get_edition,
    write_json,
)
from reorder import KNOWN_STRINGS
from structure import normalize

# Check 2 - words that must survive decoding in a Bengali regulation, with a
# floor far below the measured count (বিধি 507, অধ্যায় 30, তফসিল 231), so the
# check catches a collapse rather than corpus drift.
KEYWORDS = (
    ("বিধি", 100),
    ("অধ্যায়", 10),
    ("তফসিল", 50),
)

# Check 1 - codepoint categories that fail the build outright.
HARD_CATEGORIES = ("Cc", "Cs", "Cn")
REPLACEMENT = "\ufffd"


def load_text(build_dir, edition_id):
    path = os.path.join(build_dir, f"{edition_id}.text.jsonl")
    if not os.path.exists(path):
        sys.exit(f"Error: {path} not found - run reorder.py first")
    records = []
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                records.append(json.loads(line))
    return records, path


def load_inventory(build_dir, edition_id):
    path = os.path.join(build_dir, f"{edition_id}.inventory.json")
    if not os.path.exists(path):
        sys.exit(f"Error: {path} not found - run extract.py first")
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def check_residual_characters(records):
    """Check 1 - control/surrogate/unassigned codepoints, and what else lingers."""
    hard = Counter()
    flagged = Counter()
    flagged_by_family = {}
    for record in records:
        for char in record["logical"]:
            if char == REPLACEMENT:
                kind = "replacement"
            elif unicodedata.category(char) == "Co":
                kind = "privateUse"
            elif unicodedata.category(char) in HARD_CATEGORIES:
                hard[f"U+{ord(char):04X} ({unicodedata.category(char)})"] += 1
                continue
            else:
                continue
            flagged[kind] += 1
            by_kind = flagged_by_family.setdefault(record["fam"], Counter())
            by_kind[kind] += 1
    detail = {
        "hard": dict(sorted(hard.items())),
        "flagged": dict(sorted(flagged.items())),
        "flaggedByFamily": {
            family: dict(sorted(counts.items()))
            for family, counts in sorted(flagged_by_family.items())
        },
        "note": (
            "replacement = a Unicode Bengali font with no glyph for the codepoint; "
            "privateUse = the Symbol / Wingdings runtime encoding. Both are counted "
            "here and their disposition is open in progress-status (Open questions)."
        ),
    }
    return {
        "id": 1,
        "name": "residual characters",
        "status": "fail" if hard else "pass",
        "detail": detail,
    }


def check_keywords(records):
    """Check 2 - the regulation's own vocabulary is present in quantity."""
    text = unicodedata.normalize("NFC", "".join(record["logical"] for record in records))
    counts = OrderedDict()
    below = []
    for keyword, floor in KEYWORDS:
        counts[keyword] = text.count(keyword)
        if counts[keyword] < floor:
            below.append(keyword)
    return {
        "id": 2,
        "name": "expected keywords",
        "status": "fail" if below else "pass",
        "detail": {"counts": counts, "floors": dict(KEYWORDS), "belowFloor": below},
    }


def load_structure(build_dir, edition_id):
    path = os.path.join(build_dir, f"{edition_id}.structure.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def check_rule_numbering(structure):
    """
    Check 3 - the rule series holds together.

    The stream alone gives no boundary to count, but structure.py resolves the
    markers into the sequence 1..N. This passes only when that sequence has no
    gap, starts at one, and the chapters partition it exactly - every rule in one
    chapter and no rule counted twice.
    """
    if structure is None:
        return {
            "id": 3,
            "name": "rule numbering",
            "status": "skipped",
            "detail": {"reason": "needs build/<edition>.structure.json - run structure.py first"},
        }
    series = structure["ruleSeries"]
    numbers = [rule["number"] for rule in structure["rules"]]
    chapters = sorted(structure["chapters"], key=lambda chapter: chapter["number"])
    chapter_series = [number for chapter in chapters for number in chapter["ruleNumbers"]]
    contiguous = series["contiguous"] and series["first"] == 1
    partitioned = chapter_series == numbers
    return {
        "id": 3,
        "name": "rule numbering",
        "status": "pass" if contiguous and partitioned else "fail",
        "detail": {
            "first": series["first"],
            "last": series["last"],
            "count": len(numbers),
            "contiguous": series["contiguous"],
            "chaptersPartition": partitioned,
            "perChapter": {chapter["number"]: len(chapter["ruleNumbers"]) for chapter in chapters},
            "rejectedCandidates": len(structure["rejectedCandidates"]),
        },
    }


def check_page_coverage(records, edition, inventory, structure):
    """
    Check 4, Phase 1 form - every gazette page carries a provision.

    Phase 0 asked only that a page carry text, which a page holding nothing but
    its running header satisfied. This asks the sharper question: a page carries
    a provision, or it is one the structure recorded as an image with no text
    layer. The two sets must partition the edition - no page unaccounted, and no
    page wrongly called an image.
    """
    offset = edition.get("pageOffset", 0)
    expected = set(range(offset, offset + inventory["pdfPages"]))
    text_pages = {record["g"] for record in records if record["logical"].strip()}

    by_page = OrderedDict()
    for record in records:
        by_page.setdefault(record["g"], []).append(record["logical"])
    furniture_only = {page for page, spans in by_page.items() if not normalize("".join(spans))}

    image_only = set(structure["imageOnlyPages"]) if structure else set()
    missing = sorted(expected - (text_pages | image_only))
    outside = sorted(text_pages - expected)
    # The recorded images must be exactly the pages that carry no provision, so a
    # page that is furniture-only but not recorded is caught here.
    undetected = sorted(furniture_only - image_only) if structure else []
    phantom = sorted(image_only - furniture_only) if structure else []
    failed = missing or outside or undetected or phantom
    return {
        "id": 4,
        "name": "page coverage",
        "status": "fail" if failed else "pass",
        "detail": {
            "expectedPages": len(expected),
            "provisionPages": len(text_pages - image_only),
            "imageOnlyPages": len(image_only),
            "missing": missing,
            "outsideEdition": outside,
            "unrecordedImages": undetected,
            "phantomImages": phantom,
        },
    }


def check_known_strings(records):
    """Check 5 - the fixed list decodes exactly, with no visual form left."""
    text = unicodedata.normalize("NFC", "".join(record["logical"] for record in records))
    entries = []
    for visual, logical in KNOWN_STRINGS:
        seen = text.count(logical)
        leftover = text.count(visual) if visual != logical else 0
        entries.append(
            {
                "logical": logical,
                "seen": seen,
                "leftoverVisual": leftover,
                "pass": seen > 0 and leftover == 0,
            }
        )
    failed = [entry["logical"] for entry in entries if not entry["pass"]]
    return {
        "id": 5,
        "name": "known strings",
        "status": "fail" if failed else "pass",
        "detail": {"strings": entries, "failed": failed},
    }


def skipped_checks():
    return [
        {
            "id": 6,
            "name": "oracle divergence",
            "status": "skipped",
            "detail": {
                "reason": "external cross-check against the web edition, run by hand"
            },
        },
    ]


def run(edition_id):
    edition = get_edition(edition_id)
    build_dir = ensure_build_dir()
    records, text_path = load_text(build_dir, edition_id)
    inventory = load_inventory(build_dir, edition_id)
    structure = load_structure(build_dir, edition_id)

    checks = [
        check_residual_characters(records),
        check_keywords(records),
        check_rule_numbering(structure),
        check_page_coverage(records, edition, inventory, structure),
        check_known_strings(records),
    ]
    checks.extend(skipped_checks())
    checks.sort(key=lambda check: check["id"])

    report_path = os.path.join(build_dir, f"{edition_id}.validation.json")
    write_json(
        report_path,
        {
            "schemaVersion": 1,
            "edition": edition_id,
            "spans": len(records),
            "checks": checks,
            "passed": sum(1 for check in checks if check["status"] == "pass"),
            "failed": sum(1 for check in checks if check["status"] == "fail"),
            "skipped": sum(1 for check in checks if check["status"] == "skipped"),
        },
    )

    print(f"Edition          : {edition_id}")
    print(f"Spans            : {len(records)}")
    for check in checks:
        print(f"  [{check['status']:^7}] {check['id']}  {check['name']}")
        detail = check["detail"]
        if check["id"] == 1:
            print(f"            hard: {detail['hard'] or 'none'}")
            print(f"            flagged: {detail['flagged'] or 'none'}")
            for family, counts in detail["flaggedByFamily"].items():
                print(f"              {family}: {counts}")
        elif check["id"] == 2:
            print(f"            counts: {detail['counts']}")
        elif check["id"] == 3:
            if check["status"] == "skipped":
                print(f"            {detail['reason']}")
            else:
                print(
                    f"            rules {detail['first']}..{detail['last']}"
                    f"  contiguous {detail['contiguous']}  chapters partition {detail['chaptersPartition']}"
                )
        elif check["id"] == 4:
            print(
                f"            {detail['provisionPages']} provision pages"
                f" + {detail['imageOnlyPages']} image pages"
                f" = {detail['expectedPages']}  missing {detail['missing'] or 'none'}"
            )
            if detail["unrecordedImages"] or detail["phantomImages"]:
                print(
                    f"            unrecorded {detail['unrecordedImages'] or 'none'}"
                    f"  phantom {detail['phantomImages'] or 'none'}"
                )
        elif check["id"] == 5:
            print(f"            {sum(1 for e in detail['strings'] if e['pass'])}/{len(detail['strings'])} pass")
        else:
            print(f"            {detail['reason']}")

    failed = sum(1 for check in checks if check["status"] == "fail")
    skipped = sum(1 for check in checks if check["status"] == "skipped")
    print(f"\nPassed {len(checks) - failed - skipped}  Failed {failed}  Skipped {skipped}")
    print(f"Wrote {report_path}")
    return 1 if failed else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--edition", default="ppr2025")
    sys.exit(run(parser.parse_args().edition))
