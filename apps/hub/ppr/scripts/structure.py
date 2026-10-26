#!/usr/bin/env python3
"""
Phase 1 - Segment the decoded corpus into chapters, parts, rules and sub-rules.

Phase 0 produced one record per text span, in reading order, with the visual and
the logical spelling of every span. That is a flat stream: it knows nothing about
where a chapter begins, which rule a clause belongs to, or where the schedules
start. This step imposes that structure.

Two Phase-0 findings drive the algorithm, and both are load-bearing:

  * The text layer draws part of the document twice at identical boxes, so the
    stream must be de-duplicated first. The key is (page, box, visual, font
    object): same page, same box, same drawing, same font.
  * The order `get_texttrace` emits spans, after that de-duplication, *is* the
    reading order. Spans are multi-line runs (one span can hold a whole
    paragraph), so re-sorting them by their box top - the obvious fix - moves a
    rule's marker after its own body and splits inline Latin from its line.
    Concatenating spans in stream order per page, pages in numeric order, is
    correct.

The regulation's own spine is the rule series, which runs 1..N with no gaps. So
rules are not matched by pattern alone - `উদাহরণ ১।` and the digit rows of a
schedule table also look like rule markers. Instead candidate markers are walked
in reading order and aligned against the expected sequence: a candidate counts
only when it is the next number due. Everything else is left in the body text.

Chapters are found by ordinal (`প্রথম অধ্যায়`), parts by `অংশ-N` / `অংশ-X`, and
schedules by `তফসিল-N`. Two document defects are recorded rather than silently
dropped: the second chapter's heading has no recoverable glyphs, and 24 pages are
scanned images with no text layer at all, which is why four schedule headings are
missing. Those pages are listed too, so the validation harness can tell a page
that carries a provision from a page that is simply an image.

Reads build/<edition>.text.jsonl, writes:
  build/<edition>.structure.json    chapters, parts, rules, sub-rules, defects
  build/<edition>.toc.json          browse table of contents data
  source/<edition>/index.json       chapter list + TOC (canonical corpus)
  source/<edition>/provisions/*.json  one file per chapter, plus schedules
"""

import argparse
import bisect
import json
import os
import re
import sys
import unicodedata
from collections import OrderedDict

from ppr_common import BASE_DIR, ensure_build_dir, get_edition, write_json

BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯"
ORDINALS = OrderedDict(
    [
        ("প্রথম", 1),
        ("দ্বিতীয়", 2),
        ("তৃতীয়", 3),
        ("চতুর্থ", 4),
        ("পঞ্চম", 5),
        ("ষষ্ঠ", 6),
        ("সপ্তম", 7),
        ("অষ্টম", 8),
        ("নবম", 9),
        ("দশম", 10),
    ]
)
# Block separators the fonts draw between paragraphs: the Symbol font's section
# sign, the same shape as NikoshBAN maps it (U+2211), and the two Wingdings /
# Symbol bullets. They are furniture, not text, and become a space.
SEPARATORS = "\uf0be\u2211\uf0d8\uf0b7"
# A schedule title has no delimiter between it and the first table row, so it is
# cut at this many characters and then backed up to the last word boundary.
TITLE_LIMIT = 120

# Page furniture: the running header (SutonnyMJ, so it arrives as Bijoy-ASCII and
# every Bengali glyph is a control/latin-1 lookalike: U+2020, U+2021, U+00B3,
# U+00DE, U+00A4), the printed page label in parentheses, and the price footer.
HEADER_RE = re.compile(
    r"(?:\d{4}\s+)?evsjv\u2021`k \u2020M\u2021RU,\s*AwZwi\u00b3,"
    r"\s*\u2020m\u2021\u00de\u00a4\^i\s*28,\s*2025(?:\s+\d{4})?"
)
PRICE_RE = re.compile(r"g~j\u00a8\s*:\s*UvKv\s*[\d.,]+")
PAGE_LABEL_RE = re.compile(r"\(\d{4}\)")

# A chapter heading is `প্রথম অধ্যায়`; `প্রথম অধ্যায়ের` and `সপ্তম অধ্যায়
# অনুসারে` are cross-references, so a suffix or a postposition rules a match out.
CHAPTER_SUFFIX = r"(?!ের|ে| অনুসারে| অনুযায়ী| অনুসরণে| মতে| সম্পর্কিত| প্রাধান্য| ব্যতীত)"
CHAPTER_RE = re.compile(rf"({'|'.join(ORDINALS)})\s*অধ্যায়{CHAPTER_SUFFIX}")
# A rule marker is a Bengali numeral followed by a danda, not itself preceded by a
# numeral, danda or an open paren (which would make it a sub-rule or a citation).
RULE_RE = re.compile(rf"(?<![{BENGALI_DIGITS}।(])([{BENGALI_DIGITS}]{{1,3}})\s*।")
PART_RE = re.compile(rf"অংশ\s*-?\s*([{BENGALI_DIGITS}]{{1,2}}|[কখগঘ])")
SCHEDULE_RE = re.compile(
    rf"তফসিল\s*-\s*([{BENGALI_DIGITS}]{{1,2}})(?=\s*(?:অংশ|\[|বিধি|[\nA-Za-z]))"
)
# Sub-rules: (১) (২) ... and (ক) (খ) ..., but not the (১৭) inside a citation
# like বিধি ১১(১৭).
SUB_RULE_RE = re.compile(rf"(?<![\u0980-\u09ff])(?<![{BENGALI_DIGITS}])\(([{BENGALI_DIGITS}]{{1,3}})\)")
SUB_LETTER_RE = re.compile(r"(?<![\u0980-\u09ff])\(([কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ])\)")


def bengali_to_int(text):
    return int("".join(str(BENGALI_DIGITS.index(char)) for char in text))


def load_text(build_dir, edition_id):
    path = os.path.join(build_dir, f"{edition_id}.text.jsonl")
    if not os.path.exists(path):
        sys.exit(f"Error: {path} not found - run reorder.py first")
    records = []
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                records.append(json.loads(line))
    return records


def dedupe(records):
    """
    Drop the overprint: the text layer draws part of the document a second time at
    identical boxes. Key includes the font object because two objects can share a
    box with different text. Order is preserved, so the result is still in reading
    order.
    """
    seen, kept = set(), []
    for record in records:
        key = (record["p"], tuple(record["bbox"]), record["visual"], record["o"])
        if key in seen:
            continue
        seen.add(key)
        kept.append(record)
    return kept


def strip_furniture(text):
    """Remove the running header, the printed page label and the price footer."""
    text = HEADER_RE.sub(" ", text)
    text = PAGE_LABEL_RE.sub(" ", text)
    text = PRICE_RE.sub(" ", text)
    return text


def normalize(text):
    """
    Turn one page's spans into a single line of prose.

    The section sign becomes a space; runs of whitespace collapse; and a danda is
    given a space after it when a Bengali letter follows, because the streams
    glue them (`প্রবর্তন।(১)`) and the marker scan needs the boundary.

    The text is composed once more at this point, after the spans are joined,
    because a vowel split across two spans only settles here: `reorder` hands a
    stranded pre-base matra to the next span, which leaves `ে` at the end of one
    span and `া` at the start of the following one, and NFC is what makes them
    the single `ো` the reader expects.
    """
    text = unicodedata.normalize("NFC", text)
    text = re.sub(rf"[{SEPARATORS}]", " ", text)
    text = strip_furniture(text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"।(?=[\u0980-\u09ff])", "। ", text)
    return text.strip()


def build_stream(deduped):
    """
    Concatenate the pages in numeric order into one string, remembering where each
    page starts so a character offset can be turned back into a gazette page.
    Pages are separated by a newline, which the furniture never contains.
    """
    by_page = OrderedDict()
    for record in deduped:
        by_page.setdefault(record["g"], []).append(record)

    texts = OrderedDict()
    for page in sorted(by_page):
        texts[page] = normalize("".join(record["logical"] for record in by_page[page]))

    stream, starts, pages = "", OrderedDict(), []
    for page in texts:
        starts[page] = len(stream)
        pages.append(page)
        stream += texts[page] + "\n"
    return stream, starts, pages, texts


def make_offset_to_page(starts, pages):
    keys = [starts[page] for page in pages]

    def offset_to_page(offset):
        index = bisect.bisect_right(keys, offset) - 1
        return pages[max(index, 0)]

    return offset_to_page


def find_rules(stream, body_end, offset_to_page):
    """
    Align candidate rule markers against the expected sequence 1..N.

    A candidate is accepted only when it is the next number due, so an `উদাহরণ ১।`
    example or a schedule table's `২। বিনিয়োগ` row falls through instead of
    inventing a rule. Returns the accepted markers and the rejected candidates
    (kept so the run can report what it skipped).
    """
    accepted, rejected = [], []
    expected = 1
    for match in RULE_RE.finditer(stream):
        if match.start() >= body_end:
            break
        number = bengali_to_int(match.group(1))
        context = re.sub(r"\s+", " ", stream[match.start():match.start() + 60]).strip()
        entry = {
            "number": number,
            "offset": match.start(),
            "page": offset_to_page(match.start()),
            "context": context,
        }
        if number == expected:
            accepted.append(entry)
            expected += 1
        else:
            rejected.append(entry)
    return accepted, rejected


def find_chapters(stream, offset_to_page):
    chapters = []
    for match in CHAPTER_RE.finditer(stream):
        ordinal = match.group(1)
        chapters.append(
            {
                "number": ORDINALS[ordinal],
                "ordinal": ordinal,
                "offset": match.end(),
                "headingOffset": match.start(),
                "page": offset_to_page(match.start()),
                "headingMissing": False,
            }
        )
    return chapters


def find_parts(stream, offset_to_page):
    """
    Distinguish a part heading from a cross-reference.

    `অংশ-১১ স্বার্থের সংঘাত ৭১।` heads a part; `অংশ-২-এর অধীন` cites one. An
    inflection right after the marker rules a heading out, and a digit part must
    still be followed by its first rule marker with no danda in between.
    """
    parts = []
    for match in PART_RE.finditer(stream):
        label = match.group(1)
        following = stream[match.end():match.end() + 6].lstrip()
        if following.startswith("-") or following.startswith(("এর", "ে")):
            continue
        if label in "কখগঘ":
            if not re.match(r"\s*[\[:]", stream[match.end():match.end() + 4]):
                continue
            title_end = match.end() + 4
        else:
            # The window must reach the first rule marker of the part, and a part
            # title can run past a hundred characters before it does.
            window = stream[match.end():match.end() + 160]
            rule = RULE_RE.search(window)
            if not rule or "।" in window[: rule.start()]:
                continue
            title_end = match.end() + rule.start()
        parts.append(
            {
                "label": label,
                "offset": match.start(),
                "page": offset_to_page(match.start()),
                "title": re.sub(r"\s+", " ", stream[match.end():title_end]).strip(" :["),
            }
        )
    return parts


def schedule_title(stream, end):
    """
    The heading of a schedule is `তফসিল-N`, often a `[বিধি … দ্রষ্টব্য]` note, and
    then the title - which runs into the first table row with no delimiter to stop
    at. Take the text up to the first page break, numbered item or danda, and if
    none of those comes first, stop at a word boundary rather than mid-word.
    """
    window = stream[end:end + 400]
    stop = len(window)
    for regex in (re.compile(r"\n"),
                  re.compile(rf"[{BENGALI_DIGITS}]{{1,3}}\s*।"),
                  re.compile(r"।")):
        found = regex.search(window)
        if found and found.start() < stop:
            stop = found.start()
    title = re.sub(r"\s+", " ", window[:stop]).strip(" :[")
    if len(title) > TITLE_LIMIT:
        title = title[:TITLE_LIMIT].rsplit(" ", 1)[0]
    return title


def find_schedules(stream, offset_to_page):
    schedules, seen = [], {}
    for match in SCHEDULE_RE.finditer(stream):
        number = bengali_to_int(match.group(1))
        if number in seen:
            continue
        seen[number] = True
        schedules.append(
            {
                "number": number,
                "offset": match.start(),
                "page": offset_to_page(match.start()),
                "title": schedule_title(stream, match.end()),
            }
        )
    return schedules


def is_clause_start(body, start, kind, label):
    """
    Tell a sub-rule marker from a citation.

    `(২) উপবিধি` opens a clause; the `(১)` in `উপবিধি (১)-এর` cites one, and the
    `(ক)` in `ধারা ৩২ (ক)` cites one too. A numbered clause follows a danda,
    colon, dash or separator, and a lettered one may also follow a word (the
    `থাকিবে (ক) ...` construction) - but never a numeral.

    Two markers the gazette and the text layer agree on still need a hand: the
    body of rule 2 drops the dash that introduces its list (`বিধিমালায় (১)
    'অনুমোদনকারী কর্তৃপক্ষ'`), so a `(১)` that no other numbered marker precedes
    is taken as the opening of the list rather than a citation.
    """
    before = body[:start].rstrip()
    if not before:
        return True
    last = before[-1]
    if last in "।:;\u2013\u2014\u2015-" or last in SEPARATORS:
        return True
    if kind == "number" and label == BENGALI_DIGITS[1] and not SUB_RULE_RE.search(before):
        return True
    if kind == "letter" and "\u0980" <= last <= "\u09ff" and not (BENGALI_DIGITS[0] <= last <= BENGALI_DIGITS[-1]):
        return True
    return False


def split_sub_rules(text, title_end):
    """
    Cut a rule's body at its list markers. A sub-rule runs from its `(১)` to the
    next `(২)`, so the labels are gathered first and the slices taken between them.
    """
    body = text[title_end:]
    marks = []
    for regex, kind in ((SUB_RULE_RE, "number"), (SUB_LETTER_RE, "letter")):
        for match in regex.finditer(body):
            if is_clause_start(body, match.start(), kind, match.group(1)):
                marks.append((match.start(), match.group(1), kind))
    marks.sort()
    subs = []
    for index, (start, label, kind) in enumerate(marks):
        end = marks[index + 1][0] if index + 1 < len(marks) else len(body)
        subs.append(
            {
                "label": label,
                "kind": kind,
                "text": re.sub(r"\s+", " ", body[start:end]).strip(),
            }
        )
    return subs


def slice_rules(stream, accepted, body_end, cut_points):
    """
    Give each rule the text that runs from its marker to the next one.

    A chapter heading between two rule markers is a boundary, not part of the
    rule above it, so the slice stops at the first heading that falls inside it
    (otherwise `নবম অধ্যায় বিবিধ` bleeds into rule 150).
    """
    rules = []
    for index, marker in enumerate(accepted):
        start = marker["offset"]
        end = accepted[index + 1]["offset"] if index + 1 < len(accepted) else body_end
        head = next((cut for cut in cut_points if start < cut < end), None)
        if head is not None:
            end = head
        text = re.sub(r"\s+", " ", stream[start:end]).strip()
        # The marker ends in a danda; the title runs to the next one.
        body_start = text.index("।") + 1 if "।" in text else len(text)
        tail = text[body_start:]
        title = tail[: tail.index("।")].strip(" -–—:.").strip() if "।" in tail else ""
        rules.append(
            {
                "number": marker["number"],
                "page": marker["page"],
                "offset": marker["offset"],
                "title": title,
                "text": text,
                "subRules": split_sub_rules(text, body_start),
            }
        )
    return rules


def group_by_chapter(rules, chapters):
    """
    Assign each rule to the chapter whose heading precedes it. The second chapter
    has no recoverable heading, so its boundary is synthesized at the top of its
    page - recorded as a gap, not forgotten.
    """
    ordered = sorted(chapters, key=lambda chapter: chapter["offset"])
    for index, chapter in enumerate(ordered):
        chapter["end"] = ordered[index + 1]["offset"] if index + 1 < len(ordered) else None
    for rule in rules:
        owner = ordered[0] if ordered else None
        for chapter in ordered:
            if chapter["offset"] <= rule["offset"]:
                owner = chapter
            else:
                break
        rule["chapter"] = owner["number"] if owner else None
    return ordered


def group_by_part(rules, parts):
    ordered = sorted(parts, key=lambda part: part["offset"])
    for index, part in enumerate(ordered):
        part["end"] = ordered[index + 1]["offset"] if index + 1 < len(ordered) else None
    for rule in rules:
        owner = None
        for part in ordered:
            if part["offset"] <= rule["offset"] and (part["end"] is None or rule["offset"] < part["end"]):
                owner = part
                break
        rule["part"] = owner["label"] if owner else None
    return ordered


def segment(records, edition):
    deduped = dedupe(records)
    stream, starts, pages, texts = build_stream(deduped)
    offset_to_page = make_offset_to_page(starts, pages)
    offset = edition.get("pageOffset", 0)

    # Image-only pages: a page whose text is nothing but furniture has no
    # provision. Detecting them here is what lets check 4 tell the two apart.
    image_only = [page for page in pages if not texts[page]]

    schedules = find_schedules(stream, offset_to_page)
    body_end = starts[schedules[0]["page"]] if schedules else len(stream)

    accepted, rejected = find_rules(stream, body_end, offset_to_page)
    chapters = find_chapters(stream, offset_to_page)
    parts = find_parts(stream, offset_to_page)

    # Chapter two's heading has no glyphs in the file; its ghost is that run of
    # U+FFFD at the top of page 9566. Synthesize the boundary so its rules are
    # not misfiled into chapter one, and flag it.
    if not any(chapter["number"] == 2 for chapter in chapters):
        starts_in_stream = {chapter["number"]: chapter for chapter in chapters}
        if 1 in starts_in_stream and 3 in starts_in_stream:
            chapter_two_page = find_second_chapter_page(
                stream, starts_in_stream[1], starts_in_stream[3], offset_to_page
            )
            chapters.append(
                {
                    "number": 2,
                    "ordinal": "দ্বিতীয়",
                    "offset": starts[chapter_two_page],
                    "headingOffset": starts[chapter_two_page],
                    "page": chapter_two_page,
                    "headingMissing": True,
                }
            )
    chapters.sort(key=lambda chapter: chapter["number"])

    # A chapter or part heading sits between two rule markers; it ends the rule
    # above it. A part heading is drawn inside the run of rules it introduces
    # (`অংশ-১১ স্বার্থের সংঘাত ৭১।`), so without it as a cut point the heading and
    # its title stay glued to the tail of the preceding rule.
    cut_points = sorted(
        [chapter["headingOffset"] for chapter in chapters]
        + [part["offset"] for part in parts]
    )
    rules = slice_rules(stream, accepted, body_end, cut_points)
    chapters = group_by_chapter(rules, chapters)
    parts = group_by_part(rules, parts)

    for rule in rules:
        rule["pdfPage"] = rule["page"] - offset
    for chapter in chapters:
        chapter["pdfPage"] = chapter["page"] - offset
        chapter["ruleNumbers"] = [rule["number"] for rule in rules if rule["chapter"] == chapter["number"]]
    for part in parts:
        part["pdfPage"] = part["page"] - offset
        part["rules"] = [rule["number"] for rule in rules if rule["part"] == part["label"]]
    for schedule in schedules:
        schedule["pdfPage"] = schedule["page"] - offset

    defects = []
    missing_chapter = next((chapter for chapter in chapters if chapter["headingMissing"]), None)
    if missing_chapter:
        defects.append(
            {
                "kind": "missingHeading",
                "what": "দ্বিতীয় অধ্যায় heading",
                "page": missing_chapter["page"],
                "note": "the heading has no glyph in the file; only its U+FFFD ghost survives",
            }
        )
    expected_schedules = set(range(1, max(schedule["number"] for schedule in schedules) + 1))
    absent = sorted(expected_schedules - {schedule["number"] for schedule in schedules})
    if absent:
        defects.append(
            {
                "kind": "missingSchedule",
                "what": f"তফসিল {', '.join(str(number) for number in absent)}",
                "pages": image_only,
                "note": "the pages carrying these schedules are scanned images with no text layer",
            }
        )
    if image_only:
        defects.append(
            {
                "kind": "imageOnlyPages",
                "count": len(image_only),
                "pages": image_only,
                "note": "running header only; no provision can be extracted",
            }
        )

    return {
        "stream": stream,
        "starts": starts,
        "pages": pages,
        "rules": rules,
        "chapters": chapters,
        "parts": parts,
        "schedules": schedules,
        "rejected": rejected,
        "imageOnlyPages": image_only,
        "defects": defects,
        "deduped": len(deduped),
        "spans": len(records),
    }


def find_second_chapter_page(stream, chapter_one, chapter_three, offset_to_page):
    """
    The second chapter's heading has no glyphs; only a run of U+FFFD replacement
    characters marks where it was drawn. Return the page that run sits on, so the
    chapter boundary lands there instead of in the middle of chapter one.
    """
    between = stream[chapter_one["offset"]:chapter_three["offset"]]
    ghost = re.search("\ufffd{2,}", between)
    if ghost:
        return offset_to_page(chapter_one["offset"] + ghost.start())
    return chapter_three["page"]


def write_toc(result, edition, edition_id):
    toc = {
        "schemaVersion": 1,
        "edition": edition_id,
        "title": edition.get("titleBn"),
    }
    chapter_entries = []
    for chapter in result["chapters"]:
        numbers = chapter["ruleNumbers"]
        chapter_entries.append(
            {
                "number": chapter["number"],
                "ordinal": chapter["ordinal"],
                "page": chapter["page"],
                "pdfPage": chapter["pdfPage"],
                "headingMissing": chapter["headingMissing"],
                "rules": numbers,
                "ruleRange": [numbers[0], numbers[-1]] if numbers else None,
                "parts": [
                    {"label": part["label"], "title": part["title"], "page": part["page"]}
                    for part in result["parts"]
                    if part["page"] is not None
                    and chapter["offset"] <= part["offset"]
                    and (chapter["end"] is None or part["offset"] < chapter["end"])
                ],
            }
        )
    toc["chapters"] = chapter_entries
    toc["schedules"] = [
        {"number": schedule["number"], "title": schedule["title"], "page": schedule["page"]}
        for schedule in result["schedules"]
    ]
    return toc


def write_corpus(result, edition, edition_id):
    root = os.path.join(BASE_DIR, "source", edition_id)
    provisions = os.path.join(root, "provisions")
    os.makedirs(provisions, exist_ok=True)

    for chapter in result["chapters"]:
        rules = [rule for rule in result["rules"] if rule["chapter"] == chapter["number"]]
        payload = {
            "schemaVersion": 1,
            "edition": edition_id,
            "chapter": chapter["number"],
            "ordinal": chapter["ordinal"],
            "headingMissing": chapter["headingMissing"],
            "pageStart": chapter["page"],
            "pdfPageStart": chapter["pdfPage"],
            "rules": [
                {
                    "number": rule["number"],
                    "title": rule["title"],
                    "page": rule["page"],
                    "pdfPage": rule["pdfPage"],
                    "part": rule["part"],
                    "text": rule["text"],
                    "subRules": rule["subRules"],
                }
                for rule in rules
            ],
        }
        write_json(os.path.join(provisions, f"chapter-{chapter['number']:02d}.json"), payload)

    write_json(
        os.path.join(provisions, "schedules.json"),
        {
            "schemaVersion": 1,
            "edition": edition_id,
            "schedules": [
                {
                    "number": schedule["number"],
                    "title": schedule["title"],
                    "page": schedule["page"],
                    "pdfPage": schedule["pdfPage"],
                }
                for schedule in result["schedules"]
            ],
            "missing": [
                defect for defect in result["defects"] if defect["kind"] == "missingSchedule"
            ],
        },
    )
    write_json(os.path.join(root, "index.json"), write_toc(result, edition, edition_id))


def run(edition_id):
    edition = get_edition(edition_id)
    build_dir = ensure_build_dir()
    records = load_text(build_dir, edition_id)
    result = segment(records, edition)

    numbers = [rule["number"] for rule in result["rules"]]
    contiguous = numbers == list(range(1, len(numbers) + 1))

    report = {
        "schemaVersion": 1,
        "edition": edition_id,
        "spans": result["spans"],
        "deduped": result["deduped"],
        "overprintsDropped": result["spans"] - result["deduped"],
        "counts": {
            "chapters": len(result["chapters"]),
            "parts": len(result["parts"]),
            "rules": len(result["rules"]),
            "schedules": len(result["schedules"]),
            "imageOnlyPages": len(result["imageOnlyPages"]),
        },
        "ruleSeries": {"first": numbers[0], "last": numbers[-1], "contiguous": contiguous},
        "chapters": result["chapters"],
        "parts": result["parts"],
        "rules": result["rules"],
        "schedules": result["schedules"],
        "rejectedCandidates": result["rejected"],
        "imageOnlyPages": result["imageOnlyPages"],
        "defects": result["defects"],
    }
    write_json(os.path.join(build_dir, f"{edition_id}.structure.json"), report)
    write_json(os.path.join(build_dir, f"{edition_id}.toc.json"), write_toc(result, edition, edition_id))
    write_corpus(result, edition, edition_id)

    print(f"Edition          : {edition_id}")
    print(f"Spans            : {result['spans']} -> deduped {result['deduped']} ({result['spans'] - result['deduped']} overprints dropped)")
    print(f"Chapters         : {len(result['chapters'])}")
    print(f"Parts            : {len(result['parts'])}")
    print(f"Rules            : {len(result['rules'])}  series {numbers[0]}..{numbers[-1]}  contiguous={contiguous}")
    print(f"Schedules        : {len(result['schedules'])}  present {sorted(schedule['number'] for schedule in result['schedules'])}")
    print(f"Image-only pages : {len(result['imageOnlyPages'])}  {result['imageOnlyPages']}")
    print(f"Rejected markers : {len(result['rejected'])}")
    for defect in result["defects"]:
        print(f"  defect: {defect['kind']}")
    print("Chapters:")
    for chapter in sorted(result["chapters"], key=lambda chapter: chapter["number"]):
        numbers_here = chapter["ruleNumbers"]
        span = f"{numbers_here[0]}..{numbers_here[-1]}" if numbers_here else "-"
        print(f"  {chapter['number']}. {chapter['ordinal']} অধ্যায়  page {chapter['page']}  rules {span}"
              + ("  (heading missing)" if chapter["headingMissing"] else ""))
    return 0 if contiguous else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--edition", default="ppr2025")
    sys.exit(run(parser.parse_args().edition))
