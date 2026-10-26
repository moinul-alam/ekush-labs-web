#!/usr/bin/env python3
"""
Phase 0.5 - Reorder the decoded legacy stream from visual order to logical order.

The legacy Bangladeshi fonts draw a syllable in the order it is *painted*, not
the order it is *typed*. Decoding a glyph to its Unicode name therefore yields
text that reads correctly on screen but will not match a search or a rule
number, because four things sit in the wrong place:

  - **pre-base matras** (ি ে ৈ, and the ে inside ো/ৌ) are painted before their
    consonant: `িনম` -> inverted, `নিম`.
  - the **reph** র্ is painted after the consonant it belongs to: `মর্` -> `র্ম`.
  - a **half form** is stored with the hasanta *after* its consonant
    (`র্` `য্` `ব্`) where Unicode puts the hasanta first (`্র` `্য` `্ব`), and any
    conjunct built on one inherits that: `পর্` -> `প্র`, `নয্` -> `ন্য`,
    `ন্তর্` -> `ন্ত্র`.
  - a **matra + consonant** ligature is stored matra-first: `িট` -> `টি`.

So one glyph can be a whole syllable's worth of text (`পর্` names প্র) and its
reading has to be rewritten, while a matra can be its own glyph and has to be
moved across a token boundary. The two cases are handled differently, and the
reph/য-fলা case is a fixed-point rewrite because the reference font nests its
GSUB rules (`বর্য্` -> `ব্র্য` only settles after two passes).

Both rewrite kinds are stated as one rule: *inside a reading, a hasanta that is
not followed by a consonant swaps with the letter before it.* A correct
conjunct (`ক্ষ` = ক ্ ষ) already has the hasanta before its consonant and is left
alone; `র্` is the reph and is moved instead of rewritten; everything else with
a trailing hasanta settles into the logical form.

The reordering is per span, but a syllable can be split across spans when the
font object changes mid-cluster. A pre-base matra left waiting with no consonant
to attach to is therefore handed forward to the next span instead of being
stranded at the end of its own; the caller (`run`) owns that hand-off and never
lets a matra cross a page.

Reads `glyph_tables/objects.json` + `glyph_tables/shapes/<family>.json` (the 0.2
and 0.3 tables) and the 0.1 stream, and writes:

  build/<edition>.text.jsonl    one record per span: page, font, visual, logical
  build/<edition>.reorder.json  counts, the known-string checks, anything left
"""

import argparse
import json
import os
import sys
import unicodedata

from ppr_common import (
    GLYPH_DIR,
    ensure_build_dir,
    get_edition,
    write_json,
)

HASANTA = "\u09cd"          # ্
REPH = "\u09b0\u09cd"       # র + ্
YA = "\u09af"               # য
PREBASE_MATRAS = frozenset("\u09bf\u09c7\u09c8")     # ি ে ৈ
# Dependent vowel signs painted with, or after, their own consonant, so a
# decoded glyph can hold one at its end: া ী ু ূ ৃ ৄ ো ৌ ৗ.
POSTBASE_VOWELS = frozenset("\u09be\u09c0\u09c1\u09c2\u09c3\u09c4\u09cb\u09cc\u09d7")
UNKNOWN = "\ufffd"

# Families whose decode tables exist; a span in any other family keeps its
# `resolved` text untouched.
SHAPE_FAMILIES = ("nikosh", "nikoshban")

# Visual forms that must come out as their logical form, and the reverse. Drawn
# from real spans, so the check is end-to-end (decode + reorder), not a unit test
# of the rewrite on hand-typed input.
KNOWN_STRINGS = (
    ("িনমর্াণ", "নির্মাণ"),
    ("সম্পিকর্ত", "সম্পর্কিত"),
    ("যন্তর্পািত", "যন্ত্রপাতি"),
    ("কাযর্কর", "কার্যকর"),
    ("পর্িতষ্ঠােনর", "প্রতিষ্ঠানের"),
    ("ঊধব্র্মুখ", "ঊর্ধ্বমুখ"),
    ("েলাকবল", "লোকবল"),
    ("েকােনা", "কোনো"),
    ("িবধিমালার", "বিধিমালার"),
    ("সংিশ্লষ্ট", "সংশ্লিষ্ট"),
)


def is_bengali_consonant(char):
    """True for a Bengali consonant letter, including the nukta forms."""
    if not char:
        return False
    code_point = ord(char)
    if 0x0995 <= code_point <= 0x09B9:
        return True
    return code_point in (0x09CE, 0x09DC, 0x09DD, 0x09DF, 0x09F0, 0x09F1)


def fix_reading(reading):
    """
    Rewrite one glyph's reading into logical order.

    A hasanta that is *not* followed by a consonant belongs to the consonant it
    follows - the half-form and reph case - so it moves in front of it. Repeating
    to a fixed point settles nested cases like `বর্য্` -> `ব্র্য`, which needs two
    moves because the reference font builds it from two ligature rules.
    """
    chars = list(reading)
    changed = True
    while changed:
        changed = False
        for index, char in enumerate(chars):
            if char != HASANTA or index == 0:
                continue
            following = chars[index + 1] if index + 1 < len(chars) else None
            if is_bengali_consonant(following):
                continue
            chars[index - 1], chars[index] = chars[index], chars[index - 1]
            changed = True
            break
    return "".join(chars)


def reading_elements(reading):
    """
    Split one glyph reading into ordered (role, text) elements in visual order.

    role is 'reph', 'prebase', 'postbase' or 'normal'. A reading can hold a vowel
    sign as well as a consonant, and the sign is cut loose so `reorder` can place
    it: a leading pre-base matra (`িট` = ি + ট) because it belongs after the whole
    cluster, a trailing post-base matra (`তু` = ত + ু) because it steps over a
    half form that follows. A reph-carrying reading can hold a matra too
    (`র্ী` = reph + ী): the reph moves left, the matra stays.
    """
    if reading == REPH:
        return [("reph", REPH)]
    if len(reading) > 2 and reading.startswith(REPH):
        return [("reph", REPH)] + reading_elements(reading[2:])
    if len(reading) > 1 and reading[0] in PREBASE_MATRAS:
        # matra + consonant drawn as one glyph: িট -> ি held, then ট
        return [("prebase", reading[0])] + reading_elements(reading[1:])
    if reading in PREBASE_MATRAS:
        return [("prebase", reading)]
    head, vowels = reading, []
    while head and head[-1] in POSTBASE_VOWELS:
        vowels.insert(0, head[-1])
        head = head[:-1]
    if head and vowels:
        return [("normal", fix_reading(head))] + [("postbase", vowel) for vowel in vowels]
    return [("normal", fix_reading(reading))]


def span_elements(readings):
    """
    The elements of a whole span's readings, in visual order.

    Two things the font draws are dropped here, because they belong to the
    drawing and not to the text:

      * a hasanta that is its own glyph after a reading that does not end in a
        consonant is the joiner tying the next glyph on, never a letter
        (`উপযুক্ত` is painted প + যু + ্ + ক্ত);
      * the ya-phala is stroked again inside the vowel glyph that sits under
        it, so a half form ending in য্ followed by a য+vowel glyph spells the
        য twice (`মূল্যুক্ত` is painted ল্য + যু + ্ + ক্ত). Only the ya-phala
        does this; বিশ্বব্যাংক really is painted শ্ব + ব্য and keeps both.
    """
    elements = []
    for index, reading in enumerate(readings):
        previous = readings[index - 1] if index else None
        if reading == HASANTA:
            if previous and is_bengali_consonant(previous[-1]):
                elements.append(("normal", HASANTA))
            continue
        if (previous and previous.endswith(YA + HASANTA)
                and reading.startswith(YA) and len(reading) > 1):
            reading = reading[1:]
        elements.extend(reading_elements(reading))
    return elements


def reorder(readings, carry=()):
    """
    Turn a span's visual-order readings into logical-order Unicode text.

    A pre-base matra waits for its whole consonant cluster - the next element and
    whatever half form that cluster continues into - because in visual order the
    matra sits to the left of the cluster but in Unicode it follows all of it
    (`েলাকবল` -> লোকবল, `পর্েতয্ক` -> প্রত্যেক). A post-base matra is already
    beside its own consonant, but a half form that follows takes it instead, so it
    steps over that too (`মৃতু্য` -> মৃত্যু, `নূয্নতম` -> ন্যূনতম). A reph is
    inserted before the nearest preceding consonant.

    A matra can be left waiting with no consonant after it when the cluster it
    belongs to is drawn by a *different font object*, in its own span: the text
    layer splits `কারিগরি স্কোর` into `...কারিগরি ে` (one subset) + `স্ক` (the
    second subset) + `ার...` (the first subset again). Nothing inside the first
    span can settle that matra, so it is returned as `carry` and the caller feeds
    it back into the next span, where it finds its cluster. Returns
    (logical_text, carry) - `carry` is the still-unplaced pre-base matras, in
    order, and is empty for the overwhelming majority of spans.
    """
    elements = span_elements(readings)

    def continues(text):
        """True when an element extends the consonant cluster in progress."""
        return text.startswith(HASANTA)

    out = []
    prebase = list(carry)   # pre-base matras waiting for the end of their cluster
    postbase = []           # post-base matras waiting for the half form that follows
    for index, (role, text) in enumerate(elements):
        following = elements[index + 1][1] if index + 1 < len(elements) else None
        if role == "prebase":
            prebase.append(text)
            continue
        if role == "reph":
            out.extend(postbase)
            postbase = []
            insert = len(out)
            for position in range(len(out) - 1, -1, -1):
                if any(is_bengali_consonant(char) for char in out[position]):
                    insert = position
                    break
            out.insert(insert, text)
            continue
        if role == "postbase":
            if following is not None and continues(following):
                postbase.append(text)
            else:
                out.append(text)
                if prebase:
                    out.extend(prebase)
                    prebase = []
            continue
        if not continues(text):
            out.extend(postbase)
            postbase = []
        out.append(text)
        if prebase and not (following is not None and continues(following)):
            out.extend(prebase)
            prebase = []
    out.extend(postbase)
    return unicodedata.normalize("NFC", "".join(out)), tuple(prebase)


def load_decode_tables():
    """glyph_tables/objects.json + shapes/<family>.json, as the decode key."""
    objects_path = os.path.join(GLYPH_DIR, "objects.json")
    if not os.path.exists(objects_path):
        sys.exit(f"Error: {objects_path} not found - run glyph_inventory.py first")
    with open(objects_path, "r", encoding="utf-8") as handle:
        objects = json.load(handle)["objects"]
    shapes = {}
    for family in SHAPE_FAMILIES:
        path = os.path.join(GLYPH_DIR, "shapes", family + ".json")
        if not os.path.exists(path):
            sys.exit(f"Error: {path} not found - run glyph_inventory.py first")
        with open(path, "r", encoding="utf-8") as handle:
            shapes[family] = json.load(handle)["shapes"]
    return objects, shapes


def decode_readings(record, objects, shapes):
    """One glyph token -> its reading, in visual order. None if undecodable."""
    family = record["fam"]
    if family not in shapes:
        return None
    codes = objects.get(record["f"] + "@" + str(record["o"]), {}).get("codes", {})
    table = shapes[family]
    readings = []
    for token in record["glyphs"]:
        if token.startswith("="):
            readings.append(token[1:])
            continue
        shape = token[1:] if token.startswith("~") else codes.get(token)
        row = table.get(shape) if shape else None
        readings.append(row["unicode"] if row and row.get("unicode") else UNKNOWN)
    return readings


def hasanta_violations(text):
    """Count hasantas still followed by a non-consonant (should be none)."""
    count = 0
    for index, char in enumerate(text):
        if char != HASANTA or index + 1 >= len(text):
            continue
        if not is_bengali_consonant(text[index + 1]) and text[index + 1] != HASANTA:
            count += 1
    return count


def run(edition_id):
    build_dir = ensure_build_dir()
    stream_path = os.path.join(build_dir, f"{edition_id}.stream.jsonl")
    if not os.path.exists(stream_path):
        sys.exit(f"Error: {stream_path} not found - run extract.py first")
    objects, shapes = load_decode_tables()

    text_path = os.path.join(build_dir, f"{edition_id}.text.jsonl")
    report_path = os.path.join(build_dir, f"{edition_id}.reorder.json")

    spans = 0
    decoded_spans = 0
    passthrough = {}
    visual_chars = 0
    logical_chars = 0
    violations = 0
    fetched = 0          # matras handed forward across a span boundary
    hit_logical = {logical: 0 for _visual, logical in KNOWN_STRINGS}
    hit_visual = {visual: 0 for visual, _logical in KNOWN_STRINGS}
    emitted = []
    carry = ()           # pre-base matras the previous span could not settle
    page = None

    with open(stream_path, "r", encoding="utf-8") as source:
        for line in source:
            if not line.strip():
                continue
            record = json.loads(line)
            spans += 1
            if record["g"] != page:
                # A matra never crosses a page. Put a leftover back at the end of
                # the span that produced it rather than lose it.
                if carry:
                    emitted[-1]["logical"] = unicodedata.normalize(
                        "NFC", emitted[-1]["logical"] + "".join(carry)
                    )
                carry = ()
                page = record["g"]
            readings = decode_readings(record, objects, shapes)
            if readings is None:
                # A span we do not decode cannot carry the cluster either, so the
                # matra goes back where it came from.
                if carry:
                    emitted[-1]["logical"] = unicodedata.normalize(
                        "NFC", emitted[-1]["logical"] + "".join(carry)
                    )
                    carry = ()
                passthrough[record["fam"]] = passthrough.get(record["fam"], 0) + 1
                logical = unicodedata.normalize("NFC", record["resolved"])
                visual = logical
            else:
                decoded_spans += 1
                visual = unicodedata.normalize("NFC", "".join(readings))
                logical, carry = reorder(readings, carry)
                fetched += len(carry)
            visual_chars += len(visual)
            logical_chars += len(logical)
            violations += hasanta_violations(logical)
            for known_visual, known_logical in KNOWN_STRINGS:
                if known_logical in logical:
                    hit_logical[known_logical] += 1
                if known_visual != known_logical and known_visual in logical:
                    hit_visual[known_visual] += 1
            emitted.append(
                {
                    "p": record["p"],
                    "g": record["g"],
                    "f": record["f"],
                    "o": record["o"],
                    "fam": record["fam"],
                    "bbox": record["bbox"],
                    "visual": visual,
                    "logical": logical,
                }
            )

    if carry:
        emitted[-1]["logical"] = unicodedata.normalize(
            "NFC", emitted[-1]["logical"] + "".join(carry)
        )

    with open(text_path, "w", encoding="utf-8") as out:
        for entry in emitted:
            out.write(json.dumps(entry, ensure_ascii=False) + "\n")

    checks = []
    for known_visual, known_logical in KNOWN_STRINGS:
        ok = hit_logical[known_logical] > 0 and (
            known_visual == known_logical or hit_visual[known_visual] == 0
        )
        checks.append(
            {
                "logical": known_logical,
                "seen": hit_logical[known_logical],
                "leftoverVisual": hit_visual[known_visual],
                "pass": ok,
            }
        )

    report = {
        "schemaVersion": 1,
        "edition": edition_id,
        "spans": spans,
        "decodedSpans": decoded_spans,
        "passthroughSpans": passthrough,
        "visualChars": visual_chars,
        "logicalChars": logical_chars,
        "carriedMatras": fetched,
        "hasantaViolations": violations,
        "knownStrings": checks,
    }
    write_json(report_path, report)

    passed = sum(1 for check in checks if check["pass"])
    print(f"Edition          : {edition_id}")
    print(f"Spans            : {spans} ({decoded_spans} decoded, {spans - decoded_spans} passed through)")
    for family, count in sorted(passthrough.items()):
        print(f"  passthrough    : {count:>6}  {family}")
    print(f"Characters       : {visual_chars} visual -> {logical_chars} logical")
    print(f"Matras carried   : {fetched} across a span boundary")
    print(f"Hasanta left wrong: {violations}")
    print(f"Known strings    : {passed}/{len(KNOWN_STRINGS)} pass")
    for check in checks:
        flag = "ok " if check["pass"] else "FAIL"
        print(f"  {flag} {check['logical']}  (seen {check['seen']}, leftover visual {check['leftoverVisual']})")
    print(f"\nWrote {text_path}")
    print(f"Wrote {report_path}")
    return 0 if passed == len(KNOWN_STRINGS) and violations == 0 else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--edition", default="ppr2025")
    sys.exit(run(parser.parse_args().edition))
