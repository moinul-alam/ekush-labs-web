#!/usr/bin/env python3
"""
Phase 2 - Search index builder.

Reads the canonical corpus (source/<edition>/) and writes the deployable search
assets to assets/<edition>/:

  documents.json   one document per provision (rule or schedule), with the fields
                   MiniSearch indexes, the tags the alias table adds, and the
                   cross-reference graph (refs / refsBy) Phase 4 needs
  index.json       the manifest: counts, chapter and schedule tables, the L0
                   resolver, the alias table, the facet vocabulary, the glossary
                   and a content hash of the corpus

The MiniSearch index itself is built in the browser from these documents, in
apps/tools/src/lib/ppr/search.ts. MiniSearch is JavaScript, so this script cannot
produce its index - it produces the documents and the tables the client needs,
and the same tables drive the benchmark (apps/tools/tests/ppr-search.test.ts).

Nothing about PPR 2025 is hardcoded here: the alias and facet tables are edition
data (source/<edition>/aliases.json, facets.json), the resolver and the reference
graph are derived from the corpus, and the glossary is read off whichever rule the
corpus itself titles সংজ্ঞার্থ.

Usage: python build_index.py [edition_id]
"""

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone

from ppr_common import BASE_DIR, get_edition, write_json

BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯"
ROMAN = (
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
)


def to_bengali(number):
    return "".join(BENGALI_DIGITS[int(digit)] for digit in str(number))


def from_bengali(text):
    """Bengali numeral string -> int, so '৪৮' and 48 are one number."""
    return int("".join(str(BENGALI_DIGITS.index(char)) for char in text))


def fold(text):
    """NFC, whitespace collapsed - the form used for matching."""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", text)).strip()


def fold_key(text):
    r"""Matching form with spaces and punctuation removed, for keys and tokens.

    A query 'rule 42' and the corpus' 'বিধি ৪২' have to land on one key, and a
    group's key token has to survive tokenization as a single token, so both
    spaces and punctuation go. Only letters, digits and combining marks are
    kept: `\W` would drop Bengali vowel signs (category Mc), which would fold
    'বিধি' to 'বধ' and stop the key matching the client's foldKey().
    """
    folded = fold(text).lower()
    return "".join(
        char for char in folded if unicodedata.category(char)[0] in ("L", "N", "M")
    )


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def source_dir(edition_id):
    return os.path.join(BASE_DIR, "source", edition_id)


def assets_dir(edition_id):
    return os.path.join(BASE_DIR, "assets", edition_id)


def load_corpus(edition_id):
    """Merge the index's chapter metadata with each chapter file's rules."""
    root = source_dir(edition_id)
    index = load_json(os.path.join(root, "index.json"))
    schedules = load_json(os.path.join(root, "provisions", "schedules.json"))
    chapters = []
    for entry in index["chapters"]:
        detail = load_json(
            os.path.join(root, "provisions", f"chapter-{entry['number']:02d}.json")
        )
        chapters.append(
            {
                "number": entry["number"],
                "ordinal": entry["ordinal"],
                "headingMissing": entry["headingMissing"],
                "page": entry["page"],
                "pdfPage": entry["pdfPage"],
                "parts": entry.get("parts", []),
                "rules": detail["rules"],
            }
        )
    return index, chapters, schedules


def load_tables(edition_id):
    root = source_dir(edition_id)
    aliases = load_json(os.path.join(root, "aliases.json"))
    facets = load_json(os.path.join(root, "facets.json"))
    groups = []
    for group in aliases["groups"]:
        groups.append(
            {
                "id": group["id"],
                "bn": group["bn"],
                "en": group.get("en"),
                "keyToken": fold_key(group["bn"]),
                "terms": group["terms"],
            }
        )
    return groups, facets["facets"]


def terms_present(haystack, terms):
    """True if any term occurs in the folded haystack (case-insensitive)."""
    lowered = haystack.lower()
    return any(term.lower() in lowered for term in terms)


# ── Cross-reference graph (Phase 4) ──────────────────────────────
#
# A provision cites another as 'বিধি ৪৮-এ উল্লিখিত' or 'তফসিল ৩' or 'পঞ্চম অধ্যায়'.
# The graph is derived from the corpus, never hardcoded: the chapter ordinals come
# from the chapter table, so a renumbered edition needs no change here.

RULE_REF_RE = re.compile(r"বিধি\s*([০-৯]+)")
SCHEDULE_REF_RE = re.compile(r"তফসিল\s*([০-৯]+)")


def chapter_ref_re(ordinals):
    """'পঞ্চম অধ্যায়' - the alternation is built from the corpus' own ordinals."""
    alternatives = "|".join(re.escape(ordinal) for ordinal in ordinals)
    return re.compile(rf"({alternatives})\s*অধ্যায়")


def dedupe_refs(refs):
    """One entry per (kind, number), first sighting wins, order kept."""
    seen = set()
    unique = []
    for ref in refs:
        key = (ref["kind"], ref["number"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(ref)
    return unique


def parse_refs(text, ordinal_to_number, chapter_pattern):
    """Every internal citation in a provision, as {kind, number, label}."""
    refs = []
    for match in RULE_REF_RE.finditer(text):
        number = from_bengali(match.group(1))
        refs.append({"kind": "rule", "number": number, "label": f"বিধি {to_bengali(number)}"})
    for match in SCHEDULE_REF_RE.finditer(text):
        number = from_bengali(match.group(1))
        refs.append(
            {"kind": "schedule", "number": number, "label": f"তফসিল {to_bengali(number)}"}
        )
    for match in chapter_pattern.finditer(text):
        ordinal = match.group(1)
        number = ordinal_to_number.get(ordinal)
        if number is None:
            continue
        refs.append({"kind": "chapter", "number": number, "label": f"{ordinal} অধ্যায়"})
    return dedupe_refs(refs)


# ── Glossary (Phase 4) ───────────────────────────────────────────
#
# PPR defines its own vocabulary: the rule the corpus titles সংজ্ঞার্থ lists
# '(১) ‘ক্রয়কারী (Procuring entity)’ অর্থ ...' entries. Those definitions are the
# glossary - quoted off the document, not written by hand here.

DEFINITION_SPLIT_RE = re.compile(r"(?=\([০-৯]+\)\s*‘)")
DEFINITION_RE = re.compile(r"^\([০-৯]+\)\s*(?P<head>.*?)অর্থ(?P<definition>.+)$", re.S)
QUOTED_RE = re.compile(r"‘([^’]+)’")


def parse_glossary(source_kind, source_number, text):
    """The definitions a সংজ্ঞার্থ rule states, in document order."""
    entries = []
    for chunk in DEFINITION_SPLIT_RE.split(fold(text)):
        match = DEFINITION_RE.match(chunk.strip())
        if not match:
            continue
        head = match.group("head")
        quoted = QUOTED_RE.findall(head)
        if not quoted:
            continue
        term = quoted[0].strip()
        definition = match.group("definition").strip().rstrip(";").strip()
        if not term or not definition:
            continue
        english = None
        english_match = re.search(r"’\s*\(([^)]{1,80})\)", head)
        if english_match:
            english = english_match.group(1).strip()
        entries.append(
            {
                "term": term,
                "en": english,
                "aliases": [alias.strip() for alias in quoted[1:]],
                "definition": definition,
                "source": {"kind": source_kind, "number": source_number},
            }
        )
    return entries


def build_glossary(glossary_rules):
    """First definition of a term wins; ids are stable and URL-safe."""
    glossary = []
    seen = set()
    for rule in glossary_rules:
        for entry in parse_glossary("rule", rule["number"], rule["text"]):
            key = fold_key(entry["term"])
            if not key or key in seen:
                continue
            seen.add(key)
            glossary.append({"id": f"g{len(glossary) + 1:03d}", **entry})
    return glossary


def reference_summary(documents):
    """Edges that resolve inside the corpus vs. those that point outside it."""
    known = {(document["kind"], document["number"]) for document in documents}
    edges = 0
    dangling = {}
    for document in documents:
        for ref in document["refs"]:
            edges += 1
            if (ref["kind"], ref["number"]) not in known:
                label = f'{ref["kind"]} {ref["number"]}'
                dangling[label] = dangling.get(label, 0) + 1
    return {
        "edges": edges,
        "documents": sum(1 for document in documents if document["refs"]),
        "backlinks": sum(1 for document in documents if document["refsBy"]),
        "dangling": [{"target": target, "count": count} for target, count in sorted(dangling.items())],
    }


def add_backlinks(documents):
    """refsBy: the inverse of refs, attached to the cited provision."""
    by_key = {(document["kind"], document["number"]): document for document in documents}
    for document in documents:
        source = {
            "kind": document["kind"],
            "number": document["number"],
            "id": document["id"],
            "label": (
                f'বিধি {to_bengali(document["number"])}'
                if document["kind"] == "rule"
                else f'তফসিল {to_bengali(document["number"])}'
            ),
        }
        for ref in document["refs"]:
            target = by_key.get((ref["kind"], ref["number"]))
            if target is not None and target is not document:
                target["refsBy"].append(source)


def match_aliases(haystack, groups):
    return [group for group in groups if terms_present(haystack, group["terms"])]


def match_facets(haystack, facet_defs):
    """Facet id -> list of matched value ids, for the keyword-driven facets."""
    matched = {}
    for facet in facet_defs:
        if facet["kind"] != "terms":
            continue
        hits = [
            value["id"]
            for value in facet["values"]
            if terms_present(haystack, value["terms"])
        ]
        if hits:
            matched[facet["id"]] = hits
    return matched


def tag_tokens(matched_aliases, facet_defs, matched_facets):
    """Everything extra the search should match on, as space-joined tokens."""
    tokens = []
    for group in matched_aliases:
        tokens.append(group["keyToken"])
        tokens.extend(group["terms"])
    by_id = {facet["id"]: facet for facet in facet_defs if facet["kind"] == "terms"}
    for facet_id, value_ids in matched_facets.items():
        facet = by_id.get(facet_id)
        if not facet:
            continue
        for value in facet["values"]:
            if value["id"] in value_ids:
                tokens.append(value["bn"])
                if value.get("en"):
                    tokens.append(value["en"])
    return " ".join(dict.fromkeys(tokens))


def provision_document(edition_id, kind, number, chapter, title, text, page, pdf_page,
                       part, sub_rules, groups, facet_defs, refs):
    haystack = fold(f"{title} {text}")
    matched_aliases = match_aliases(haystack, groups)
    matched_facets = match_facets(haystack, facet_defs)
    if chapter is not None:
        matched_facets = {"chapter": [chapter["number"]], **matched_facets}
    return {
        "id": f"{edition_id}:{kind}:{number}",
        "kind": kind,
        "number": number,
        "chapter": chapter["number"] if chapter else None,
        "chapterOrdinal": chapter["ordinal"] if chapter else None,
        "part": part,
        "title": title,
        "text": text,
        "snippet": text[:240],
        "tags": tag_tokens(matched_aliases, facet_defs, matched_facets),
        "aliases": [group["id"] for group in matched_aliases],
        "facets": matched_facets,
        "refs": refs,
        "refsBy": [],
        "subRuleCount": len(sub_rules),
        # The numbered/lettered clauses themselves, so the reader can lay the body
        # out as a hierarchy instead of one paragraph. Search still runs on `text`,
        # which already contains them.
        "subRules": sub_rules,
        "page": page,
        "pdfPage": pdf_page,
    }


def rule_document(edition_id, chapter, rule, groups, facet_defs, refs):
    return provision_document(
        edition_id, "rule", rule["number"], chapter, rule["title"], rule["text"],
        rule["page"], rule["pdfPage"], rule.get("part") or None,
        rule.get("subRules") or [], groups, facet_defs, refs,
    )


def schedule_document(edition_id, schedule, groups, facet_defs, refs):
    return provision_document(
        edition_id, "schedule", schedule["number"], None, schedule["title"],
        schedule["title"], schedule["page"], schedule["pdfPage"], None, [],
        groups, facet_defs, refs,
    )


def build_documents(edition_id, chapters, schedules, groups, facet_defs,
                    ordinal_to_number, chapter_pattern):
    documents = []
    for chapter in chapters:
        for rule in chapter["rules"]:
            refs = parse_refs(
                fold(f'{rule["title"]} {rule["text"]}'), ordinal_to_number, chapter_pattern
            )
            refs = [ref for ref in refs if not (ref["kind"] == "rule" and ref["number"] == rule["number"])]
            documents.append(
                rule_document(edition_id, chapter, rule, groups, facet_defs, refs)
            )
    for schedule in schedules["schedules"]:
        refs = parse_refs(fold(schedule["title"]), ordinal_to_number, chapter_pattern)
        documents.append(schedule_document(edition_id, schedule, groups, facet_defs, refs))
    add_backlinks(documents)
    return documents


def build_resolve(chapters, schedules):
    """
    L0 resolver: a folded key -> jump target. Rules own the bare numerals; a
    schedule or chapter has to be named ('তফসিল ৩', 'chapter 3') because its
    number would otherwise be ambiguous with a rule of the same number.
    """
    resolve = {}

    def add(keys, kind, number, page, pdf_page):
        for key in keys:
            resolve.setdefault(fold_key(key), {
                "kind": kind,
                "number": number,
                "page": page,
                "pdfPage": pdf_page,
            })

    for chapter in chapters:
        number = chapter["number"]
        ordinal = chapter["ordinal"]
        roman = ROMAN[number - 1]
        add(
            [f"chapter {number}", f"chapter {roman}", f"chapter-{number}",
             f"অধ্যায় {number}", f"অধ্যায় {to_bengali(number)}",
             f"{ordinal} অধ্যায়"],
            "chapter", number, chapter["page"], chapter["pdfPage"],
        )
        for rule in chapter["rules"]:
            n = rule["number"]
            add(
                [str(n), to_bengali(n), f"rule {n}", f"rule-{n}",
                 f"বিধি {n}", f"বিধি {to_bengali(n)}"],
                "rule", n, rule["page"], rule["pdfPage"],
            )

    for schedule in schedules["schedules"]:
        n = schedule["number"]
        roman = ROMAN[n - 1] if n <= len(ROMAN) else str(n)
        add(
            [f"তফসিল {n}", f"তফসিল {to_bengali(n)}", f"তফসিল-{n}",
             f"schedule {n}", f"schedule {roman}", f"tফসিল {roman}"],
            "schedule", n, schedule["page"], schedule["pdfPage"],
        )
    return resolve


def file_hash(path):
    with open(path, "rb") as handle:
        return "sha256-" + hashlib.sha256(handle.read()).hexdigest()[:12]


def main():
    parser = argparse.ArgumentParser(description="Build the PPR search assets.")
    parser.add_argument("edition", nargs="?", default="ppr2025")
    args = parser.parse_args()
    edition = get_edition(args.edition)
    edition_id = edition["id"]

    index, chapters, schedules = load_corpus(edition_id)
    groups, facet_defs = load_tables(edition_id)

    ordinal_to_number = {chapter["ordinal"]: chapter["number"] for chapter in chapters}
    chapter_pattern = chapter_ref_re(ordinal_to_number)
    documents = build_documents(
        edition_id, chapters, schedules, groups, facet_defs, ordinal_to_number, chapter_pattern
    )
    resolve = build_resolve(chapters, schedules)

    rules = [rule for chapter in chapters for rule in chapter["rules"]]
    parts = [part for chapter in chapters for part in chapter.get("parts", [])]
    glossary = build_glossary(
        [rule for rule in rules if "সংজ্ঞার্থ" in rule["title"]]
    )
    references = reference_summary(documents)
    rules_with_aliases = sum(1 for document in documents if document["aliases"])
    rules_with_facets = sum(
        1 for document in documents if len(document["facets"]) > 1 or document["kind"] == "schedule"
    )

    out_dir = assets_dir(edition_id)
    os.makedirs(out_dir, exist_ok=True)
    documents_path = os.path.join(out_dir, "documents.json")
    manifest_path = os.path.join(out_dir, "index.json")

    write_json(documents_path, {
        "schemaVersion": 1,
        "edition": edition_id,
        "documents": documents,
    })

    documents_hash = file_hash(documents_path)

    manifest = {
        "schemaVersion": 1,
        "edition": edition_id,
        "title": index["title"],
        "titleEn": edition["titleEn"],
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "contentHash": documents_hash,
        "pageOffset": edition["pageOffset"],
        "pdfPages": edition["pdfPages"],
        "files": {"documents": "documents.json"},
        "counts": {
            "documents": len(documents),
            "rules": len(rules),
            "schedules": len(schedules["schedules"]),
            "chapters": len(chapters),
            "parts": len(parts),
            "rulesWithAliases": rules_with_aliases,
            "rulesWithFacets": rules_with_facets,
            "resolveKeys": len(resolve),
            "refEdges": references["edges"],
            "glossaryTerms": len(glossary),
        },
        "chapters": [
            {
                "number": chapter["number"],
                "ordinal": chapter["ordinal"],
                "headingMissing": chapter["headingMissing"],
                "page": chapter["page"],
                "pdfPage": chapter["pdfPage"],
                "ruleRange": [chapter["rules"][0]["number"], chapter["rules"][-1]["number"]],
                "parts": chapter.get("parts", []),
            }
            for chapter in chapters
        ],
        "schedules": schedules["schedules"],
        "missingSchedules": schedules["missing"],
        "aliases": [
            {"id": group["id"], "bn": group["bn"], "en": group["en"],
             "keyToken": group["keyToken"], "terms": group["terms"]}
            for group in groups
        ],
        "facets": facet_defs,
        "glossary": glossary,
        "references": references,
        "resolve": resolve,
        "hashes": {"documents.json": documents_hash},
    }
    write_json(manifest_path, manifest)

    print(f"Documents        : {len(documents)}  ({len(rules)} rules + "
          f"{len(schedules['schedules'])} schedules)")
    print(f"Chapters         : {len(chapters)}")
    print(f"Alias groups     : {len(groups)}  (rules tagged: {rules_with_aliases})")
    print(f"Facets           : {[facet['id'] for facet in facet_defs]}  "
          f"(documents tagged: {rules_with_facets})")
    print(f"Resolve keys     : {len(resolve)}")
    print(f"Reference edges  : {references['edges']}  "
          f"(documents citing: {references['documents']}, "
          f"documents cited: {references['backlinks']}, "
          f"dangling: {len(references['dangling'])})")
    print(f"Glossary terms   : {len(glossary)}")
    print(f"Content hash     : {documents_hash}")
    print(f"Wrote            : {os.path.relpath(documents_path, BASE_DIR)}")
    print(f"                   {os.path.relpath(manifest_path, BASE_DIR)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
