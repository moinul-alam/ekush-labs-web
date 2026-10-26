#!/usr/bin/env python3
"""
Phase 0.2 - Per-object code -> glyph shape inventory, and the review sheet.

Legacy codes are assigned per font object, so a table keyed by (family, code) is
wrong (see plan section 3). This step builds the correct key, (font object, code),
and resolves it to the only thing that is comparable across objects: the glyph
outline. Shapes are hash-identified, so the same letter drawn by two subsets
collapses to one row, and one code in two subsets becomes two rows.

It also verifies the span -> font object attribution extract.py made. Spans carry
only the stripped font name, so where a page mounts two subsets of one family the
attribution is a guess; the guess is checked against the per-character advance
width recorded in the span.

Outputs:
  glyph_tables/objects.json      font object -> code -> shape id
  glyph_tables/shapes/<family>.json   shape id -> Unicode (label_shapes.py drafts it)
  build/<edition>.shapes.json    census: shapes, sites, attribution check
  build/review_sheet.html        rendered shapes, doubtful first, drafts pre-filled
"""

import argparse
import collections
import html
import json
import os
import sys

import pymupdf

from ppr_common import (
    FontResolver,
    BUILD_DIR,
    GLYPH_DIR,
    code_key,
    edition_pdf_path,
    ensure_build_dir,
    font_object_key,
    get_edition,
    strip_subset_prefix,
    write_json,
)

# Families whose Bengali letters the cmap hides, so they need shape labelling.
# SutonnyMJ is deliberately excluded: its ToUnicode is complete, so it decodes
# from a Bijoy ASCII table instead (plan section 4, correction 4).
SHAPE_FAMILIES = ("nikosh", "nikoshban")

# Site marker for a glyph the cmap gives no code for. extract.py names such a
# glyph by its drawing alone ("~<shape id>"), so it has no code to key on and no
# gid to look up by code - the sheet finds it by shape instead.
UNCODED = "~"

# Review order for the sheet, keyed by the `source` that label_shapes.py writes:
# a forced choice first, then any row still without a reading, then the ligature
# matches, then the plain cmap ones, and the blank glyph last.
DRAFT_RANK = {
    "shape-match-ambiguous": 0,
    "unmatched": 0,
    "shape-match-ligature": 2,
    "shape-match": 3,
    "blank": 4,
}


def read_stream(edition_id):
    path = os.path.join(BUILD_DIR, f"{edition_id}.stream.jsonl")
    if not os.path.exists(path):
        sys.exit(f"Error: {path} not found - run extract.py first")
    with open(path, "r", encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def verify_attribution(doc, resolver, legacy_objects):
    """
    Check spans -> font object where one page mounts several subsets of a family.

    Each span carries the origin and bbox of every character. Advance width in
    font units, scaled by the span size, predicts the bbox width, so the object
    whose metrics fit the majority of a page's characters is the object in use.
    """
    by_key = {record["xref"]: record for record in legacy_objects}
    report = {"collisionPages": 0, "agreed": 0, "mismatches": []}
    for page_number in range(doc.page_count):
        rows = doc.get_page_fonts(page_number)
        stripped = collections.Counter(strip_subset_prefix(row[3]) for row in rows)
        colliding = {name for name, count in stripped.items() if count > 1}
        if not colliding:
            continue
        candidates = collections.defaultdict(list)
        chosen = {}
        for xref, _ext, _type, base_name, _ref, _enc in rows:
            name = strip_subset_prefix(base_name)
            candidates[name].append(xref)
            chosen[name] = xref  # extract.py: last one listed wins
        if not all(xref in by_key for name in colliding for xref in candidates[name]):
            continue

        report["collisionPages"] += 1
        scores = collections.Counter()
        for span in doc[page_number].get_texttrace():
            name = strip_subset_prefix(span["font"])
            if name not in colliding:
                continue
            size = span["size"]
            for _codepoint, gid, _origin, bbox in span["chars"]:
                expected = bbox[2] - bbox[0]
                for xref in candidates[name]:
                    width = resolver.advance_width(xref, gid)
                    if width is not None and abs(width * size - expected) < 0.35:
                        scores[xref] += 1
        if not scores:
            continue
        winners = {name: max(candidates[name], key=lambda x: scores[x]) for name in colliding}
        if winners == {name: chosen[name] for name in colliding}:
            report["agreed"] += 1
        else:
            report["mismatches"].append(
                {
                    "page": page_number,
                    "chosen": {name: chosen[name] for name in colliding},
                    "measured": winners,
                    "scores": {str(x): scores[x] for x in scores},
                }
            )
    return report


def build_objects(doc, resolver, legacy_objects, stream):
    """font object -> {code -> shape id}, plus which objects the text uses."""
    used_objects = collections.Counter(record["o"] for record in stream if record.get("o"))
    objects = {}
    for record in legacy_objects:
        xref = record["xref"]
        codes = {}
        for gid in range(resolver.glyph_count(xref)):
            code = resolver.code_for_gid(xref, gid)
            shape = resolver.shape_for_gid(xref, gid)
            if code and shape:
                codes[code_key(code)] = shape
        key = font_object_key(record["baseFont"], xref)
        objects[key] = {
            "baseFont": record["baseFont"],
            "xref": xref,
            "family": record["family"],
            "pages": record["pages"],
            "spansUsingIt": used_objects.get(xref, 0),
            "usedInDocument": bool(used_objects.get(xref, 0)),
            "distinctCodes": len(codes),
            "distinctShapes": len(set(codes.values())),
            "codes": dict(sorted(codes.items())),
        }
    return objects


def build_census(resolver, objects, stream):
    """
    Census by family. A 'site' is one (font object, code) pair; a shape is one
    drawing. Counting shapes, not sites, is what makes this the review workload.
    """
    shapes = collections.defaultdict(
        lambda: {"count": 0, "sites": {}, "objects": set(), "representative": None}
    )
    families = {}
    for key, record in objects.items():
        families.setdefault(record["family"], {"objects": [], "sites": 0, "shapes": 0, "glyphs": 0})
        families[record["family"]]["objects"].append(key)
        families[record["family"]]["sites"] += record["distinctCodes"]
        for code, shape in record["codes"].items():
            entry = shapes[(record["family"], shape)]
            entry["objects"].add(key)
            entry["sites"].setdefault(key, []).append(code)
            if entry["representative"] is None:
                entry["representative"] = (key, code)

    for record in stream:
        xref = record.get("o")
        if not xref:
            continue
        key = font_object_key(record["f"], xref)
        family = record["fam"]
        if key not in objects:
            continue
        for token in record["glyphs"]:
            if token.startswith("~"):
                # No code: the glyph is named by its drawing alone. UNCODED marks it.
                shape = token[1:]
                entry = shapes[(family, shape)]
                entry["count"] += 1
                entry["objects"].add(key)
                codes = entry["sites"].setdefault(key, [])
                if UNCODED not in codes:
                    codes.append(UNCODED)
                if entry["representative"] is None:
                    entry["representative"] = (key, UNCODED)
                families[family]["glyphs"] += 1
            elif token in objects[key]["codes"]:
                shape = objects[key]["codes"][token]
                entry = shapes[(family, shape)]
                entry["count"] += 1
                families[family]["glyphs"] += 1

    for (family, _shape), entry in shapes.items():
        if entry["count"]:
            families[family]["shapes"] += 1

    census = {"families": families, "shapes": shapes}
    return census


def shape_gids(objects, resolver):
    """
    (font object key, shape id) -> glyph id, so the sheet renders without a scan.

    Keyed by shape rather than code so uncoded glyphs, which have no code, are
    found the same way. Two gids sharing one drawing render identically, so a
    collision is harmless.
    """
    lookup = {}
    for object_key, record in objects.items():
        xref = record["xref"]
        for gid in range(resolver.glyph_count(xref)):
            shape = resolver.shape_for_gid(xref, gid)
            if shape:
                lookup.setdefault((object_key, shape), gid)
    return lookup


def render_svg(resolver, xref, gid, size=64):
    """Render one glyph's outline as inline SVG, scaled to fit `size`."""
    path, bounds = resolver.outline(xref, gid)
    if not bounds:
        return '<div class="empty">&#8709;</div>'
    x_min, y_min, x_max, y_max = bounds
    pad = 12
    width = max(x_max - x_min, 1) + pad * 2
    height = max(y_max - y_min, 1) + pad * 2
    return (
        f'<svg viewBox="{x_min - pad:.2f} {-y_max - pad:.2f} {width:.2f} {height:.2f}" '
        f'width="{size}" height="{size}" role="img">'
        f'<g transform="scale(1,-1)"><path d="{path}"/></g></svg>'
    )


def load_drafts():
    """
    The Phase 0.3 drafts, if label_shapes.py has run. The sheet opens empty
    without them, so the order of the two steps does not matter.
    """
    drafts = {}
    for family in SHAPE_FAMILIES:
        path = os.path.join(GLYPH_DIR, "shapes", f"{family}.json")
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as fh:
            drafts[family] = json.load(fh).get("shapes", {})
    return drafts


def write_review_sheet(census, objects, resolver, path, edition_id):
    drafts = load_drafts()
    gids = shape_gids(objects, resolver)
    rows = []
    for (family, shape), entry in census["shapes"].items():
        if not entry["count"] or family not in SHAPE_FAMILIES:
            continue
        rows.append((family, shape, entry))

    def draft_rank(family, shape):
        source = (drafts.get(family, {}).get(shape) or {}).get("source")
        return DRAFT_RANK.get(source, 1)

    # The doubtful rows come first: a forced choice, then a missing label, then
    # the ligature matches, then the plain cmap ones. Frequency only breaks ties.
    rows.sort(key=lambda row: (SHAPE_FAMILIES.index(row[0]), draft_rank(row[0], row[1]), -row[2]["count"]))

    sections = []
    for family in SHAPE_FAMILIES:
        family_rows = [row for row in rows if row[0] == family]
        if not family_rows:
            continue
        cards = []
        for _family, shape, entry in family_rows:
            sites = " ".join(
                f"<code>{html.escape(object_key)}:{'uncoded' if code == UNCODED else code}</code>"
                for object_key, codes in sorted(entry["sites"].items())
                for code in codes
            )
            object_key, _code = entry["representative"]
            gid = gids.get((object_key, shape))
            xref = objects[object_key]["xref"]
            render = render_svg(resolver, xref, gid) if gid is not None else '<div class="empty">?</div>'
            cards.append(
                f'<div class="card" data-shape="{shape}">'
                f'<div class="glyph">{render}</div>'
                f'<div class="meta"><span class="shape">{shape}</span>'
                f'<span class="badge"></span>'
                f'<span class="count">{entry["count"]:,}</span></div>'
                f'<input type="text" placeholder="\u0989\u09a8\u09bf\u0995\u09cb\u09a1" maxlength="8">'
                f'<div class="candidates"></div>'
                f'<div class="sites">{sites}</div>'
                f"</div>"
            )
        shapes_path = os.path.join(GLYPH_DIR, "shapes", f"{family}.json")
        written_to = (
            os.path.relpath(shapes_path, os.path.dirname(path)).replace(os.sep, "/")
        )
        sections.append(
            f'<section data-family="{family}"><h2>{family} '
            f'<small>{len(family_rows)} shapes in use \u00b7 {written_to}</small></h2>'
            f'<div class="grid">{"".join(cards)}</div>'
            f'<div class="actions"><button data-export="{family}">'
            f"Download {family}.json</button></div></section>"
        )

    shown = collections.defaultdict(set)
    for family, shape, _entry in rows:
        shown[family].add(shape)
    payload = json.dumps(
        {
            family: {
                shape: {
                    "unicode": (drafts.get(family, {}).get(shape) or {}).get("unicode", ""),
                    "confidence": (drafts.get(family, {}).get(shape) or {}).get("confidence"),
                    "source": (drafts.get(family, {}).get(shape) or {}).get("source"),
                    "candidates": (drafts.get(family, {}).get(shape) or {}).get("candidates", []),
                }
                for shape in sorted(shown[family])
            }
            for family in SHAPE_FAMILIES
        },
        ensure_ascii=False,
    )
    document = SHEET_TEMPLATE.replace("__EDITION__", html.escape(edition_id)).replace(
        "__PAYLOAD__", payload
    ).replace("__SECTIONS__", "".join(sections))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(document)


SHEET_TEMPLATE = """<!doctype html>
<html lang="bn"><head><meta charset="utf-8">
<title>PPR glyph review sheet \u2014 __EDITION__</title>
<style>
:root { color-scheme: light dark; }
body { margin: 0; padding: 24px; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
h1 { font-size: 18px; margin: 0 0 4px; }
h2 { font-size: 15px; margin: 32px 0 12px; border-bottom: 1px solid #8884; padding-bottom: 6px; }
h2 small { font-weight: 400; opacity: .6; margin-inline-start: 8px; }
.lede { opacity: .7; margin: 0 0 24px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.card { border: 1px solid #8884; border-radius: 8px; padding: 8px; display: flex;
        flex-direction: column; gap: 6px; }
.glyph { height: 72px; display: flex; align-items: center; justify-content: center;
         background: #8881; border-radius: 6px; }
.glyph svg { fill: currentColor; }
.empty { font-size: 24px; opacity: .35; }
.meta { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-size: 12px; }
.shape { font-family: ui-monospace, monospace; opacity: .7; }
.count { font-variant-numeric: tabular-nums; }
.badge { font-size: 10px; letter-spacing: .02em; padding: 0 5px; border-radius: 999px;
         background: #8882; opacity: .8; white-space: nowrap; }
.badge.exact { background: #4a83; }
.badge.ligature { background: #a953; }
.badge.ambiguous { background: #e823; }
.badge.unmatched { background: #e223; }
.badge.edited { background: #4a82; }
input { font: inherit; padding: 4px 6px; border: 1px solid #8886; border-radius: 6px;
        background: transparent; color: inherit; text-align: center; }
input:focus { outline: 2px solid #4a8; outline-offset: 1px; }
input:focus::placeholder { color: transparent; }
.candidates { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; }
.candidates:empty { display: none; }
.candidates button { font: 13px/1.4 ui-sans-serif, system-ui, sans-serif; padding: 1px 6px;
                     border: 1px solid #8884; border-radius: 999px; background: transparent;
                     color: inherit; cursor: pointer; }
.candidates button:hover { background: #8882; }
.candidates button.chosen { border-color: #4a8; background: #4a82; }
.sites { font-size: 10px; opacity: .55; word-break: break-all; display: flex; flex-wrap: wrap; gap: 3px; }
.sites code { background: #8882; padding: 0 3px; border-radius: 3px; }
.actions { margin: 12px 0 0; }
button { font: inherit; padding: 6px 12px; border: 1px solid #8886; border-radius: 6px;
         background: transparent; color: inherit; cursor: pointer; }
button:hover { background: #8882; }
.done { color: #4a8; }
</style></head><body>
<h1>\u0997\u09cd\u09b2\u09bf\u09ab \u09b0\u09bf\u09ad\u09bf\u0989 \u09b6\u09c0\u099f \u2014 __EDITION__</h1>
<p class="lede">One row per distinct drawing. Each row opens with the reading Phase 0.3 drafted
from the reference font: the <em>badge</em> says how it was reached — <b>ambiguous</b> (the
reference draws another letter the same way, so the row is a forced choice), <b>unmatched</b>
(no drawing of it in the reference), <b>ligature</b> (a conjunct, half form, reph or
vowel ligature), <b>exact</b> (a plain cmap match), <b>blank</b>. Rows are ordered doubtful
first, then by frequency; the <em>chips</em> under the field are every reading the same
drawing could have, and clicking one fills the field. Correct a reading, or clear it, and
download the table. Edits are kept in localStorage, so the page can be reloaded.</p>
__SECTIONS__
<script>
const DRAFTS = __PAYLOAD__;
const KEY = "ppr-review-__EDITION__";
const TIER = {"shape-match": "exact", "shape-match-ligature": "ligature",
  "shape-match-ambiguous": "ambiguous", "blank": "blank", "unmatched": "unmatched"};
const DOUBT = ["ambiguous", "unmatched"];
const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
function fieldKey(family, shape) { return family + "/" + shape; }

// The badge says how the reading was reached, and drops to "edited" once the
// field no longer holds the drafted reading - that is what the counter counts.
function showBadge(card, tier, edited) {
  const badge = card.querySelector(".badge");
  badge.className = "badge";
  if (edited) {
    badge.textContent = "edited";
    badge.classList.add("edited");
  } else if (tier) {
    badge.textContent = tier;
    badge.classList.add(tier);
  }
}

function refresh(section) {
  const cards = [...section.querySelectorAll(".card")];
  const doubtful = cards.filter(c => c.classList.contains("doubt"));
  const left = doubtful.filter(c => !c.classList.contains("edited")).length;
  const label = doubtful.length
    ? (left ? left + " of " + doubtful.length + " doubtful left" : "all " + doubtful.length + " doubtful cleared")
    : cards.length + " rows";
  const button = section.querySelector("button[data-export]");
  button.textContent = "Download " + section.dataset.family + ".json (" + label + ")";
  button.classList.toggle("done", !left);
}

document.querySelectorAll("section").forEach(section => {
  const family = section.dataset.family;
  section.querySelectorAll(".card").forEach(card => {
    const shape = card.dataset.shape;
    const draft = (DRAFTS[family] || {})[shape] || {};
    const drafted = draft.unicode || "";
    const tier = TIER[draft.source];
    const input = card.querySelector("input");
    const key = fieldKey(family, shape);
    input.value = key in saved ? saved[key] : drafted;
    if (DOUBT.includes(tier)) card.classList.add("doubt");

    const chips = card.querySelector(".candidates");
    (draft.candidates || []).forEach(candidate => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.dataset.value = candidate;
      chip.textContent = candidate === " " ? "\u2423" : candidate;
      chip.addEventListener("click", () => {
        input.value = candidate;
        input.dispatchEvent(new Event("input"));
      });
      chips.appendChild(chip);
    });

    input.addEventListener("input", () => {
      saved[key] = input.value;
      localStorage.setItem(KEY, JSON.stringify(saved));
      const edited = input.value !== drafted;
      showBadge(card, tier, edited);
      card.classList.toggle("edited", edited);
      [...chips.children].forEach(chip =>
        chip.classList.toggle("chosen", chip.dataset.value === input.value));
      refresh(section);
    });
    showBadge(card, tier, input.value !== drafted);
    card.classList.toggle("edited", input.value !== drafted);
    [...chips.children].forEach(chip =>
      chip.classList.toggle("chosen", chip.dataset.value === input.value));
  });
  refresh(section);
});
document.querySelectorAll("button[data-export]").forEach(button => {
  button.addEventListener("click", () => {
    const family = button.dataset.export;
    const shapes = {};
    document.querySelectorAll('section[data-family="' + family + '"] .card').forEach(card => {
      const value = card.querySelector("input").value;
      // The blank glyph's label is a space, so do not trim an all-space value away.
      shapes[card.dataset.shape] = value.trim() || value;
    });
    const payload = {
      schemaVersion: 1,
      family: family,
      source: "review_sheet.html",
      shapes: shapes
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + "\\n"],
      { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = family + ".json";
    link.click();
    URL.revokeObjectURL(url);
  });
});
</script></body></html>
"""


def main(edition_id):
    edition = get_edition(edition_id)
    pdf_path = edition_pdf_path(edition)
    if not os.path.exists(pdf_path):
        sys.exit(f"Error: source PDF not found at {pdf_path}")

    inventory_path = os.path.join(BUILD_DIR, f"{edition_id}.inventory.json")
    if not os.path.exists(inventory_path):
        sys.exit(f"Error: {inventory_path} not found - run extract.py first")
    with open(inventory_path, "r", encoding="utf-8") as fh:
        inventory = json.load(fh)

    legacy_objects = [record for record in inventory["fonts"] if record["kind"] == "legacy"]
    stream = read_stream(edition_id)

    doc = pymupdf.open(pdf_path)
    resolver = FontResolver(doc)

    attribution = verify_attribution(doc, resolver, legacy_objects)
    objects = build_objects(doc, resolver, legacy_objects, stream)
    census = build_census(resolver, objects, stream)

    build_dir = ensure_build_dir()
    shapes_dir = os.path.join(GLYPH_DIR, "shapes")
    os.makedirs(shapes_dir, exist_ok=True)

    write_json(
        os.path.join(GLYPH_DIR, "objects.json"),
        {
            "schemaVersion": 1,
            "edition": edition_id,
            "note": (
                "Decode tables key on (font object, code): a code means different letters "
                "in different objects. 'codes' maps the code to the glyph shape id that the "
                "shape tables resolve to Unicode."
            ),
            "objects": objects,
        },
    )

    for family in SHAPE_FAMILIES:
        table_path = os.path.join(shapes_dir, f"{family}.json")
        existing = {}
        if os.path.exists(table_path):
            with open(table_path, "r", encoding="utf-8") as fh:
                existing = json.load(fh).get("shapes", {})
        entries = {}
        for (row_family, shape), entry in census["shapes"].items():
            if row_family != family or not entry["count"]:
                continue
            prior = existing.get(shape, {})
            entries[shape] = {
                "unicode": prior.get("unicode") or "",
                "confidence": prior.get("confidence"),
                "source": prior.get("source"),
                "candidates": prior.get("candidates", []),
                "count": entry["count"],
                "objects": sorted(entry["objects"]),
                "codes": {key: sorted(codes) for key, codes in sorted(entry["sites"].items())},
            }
        write_json(
            table_path,
            {
                "schemaVersion": 1,
                "family": family,
                "note": (
                    "shape id -> Unicode. 'unicode' is one character, or several where the "
                    "drawing is a conjunct. 'confidence', 'source' and 'candidates' are "
                    "drafted by label_shapes.py and preserved here. Empty 'unicode' means "
                    "the shape has no reviewed label yet."
                ),
                "shapes": dict(sorted(entries.items(), key=lambda item: -item[1]["count"])),
            },
        )

    census_out = {
        "schemaVersion": 1,
        "edition": edition_id,
        "attribution": attribution,
        "families": {
            family: {
                "objects": sorted(info["objects"]),
                "distinctCodes": info["sites"],
                "distinctShapesInUse": info["shapes"],
                "glyphs": info["glyphs"],
                "shapeLabelled": family in SHAPE_FAMILIES,
            }
            for family, info in sorted(census["families"].items())
        },
        "shapes": [
            {
                "family": family,
                "shape": shape,
                "count": entry["count"],
                "objects": sorted(entry["objects"]),
                "representative": list(entry["representative"]) if entry["representative"] else None,
                "sites": {key: sorted(codes) for key, codes in sorted(entry["sites"].items())},
            }
            for (family, shape), entry in sorted(
                census["shapes"].items(), key=lambda item: -item[1]["count"]
            )
            if entry["count"]
        ],
    }
    write_json(os.path.join(build_dir, f"{edition_id}.shapes.json"), census_out)

    sheet_path = os.path.join(build_dir, "review_sheet.html")
    write_review_sheet(census, objects, resolver, sheet_path, edition_id)
    doc.close()

    print(f"Legacy objects   : {len(legacy_objects)}")
    print(
        f"Attribution      : {attribution['agreed']}/{attribution['collisionPages']} "
        f"collision pages confirmed by advance width"
    )
    for mismatch in attribution["mismatches"]:
        print(f"  MISMATCH page {mismatch['page']}: {mismatch}")
    print("\nBy family:")
    for family, info in census_out["families"].items():
        flag = "shape-labelled" if info["shapeLabelled"] else "not shape-labelled"
        print(
            f"  {family:<11} objects={len(info['objects'])} codes={info['distinctCodes']:<4} "
            f"shapes-in-use={info['distinctShapesInUse']:<4} glyphs={info['glyphs']:<7} ({flag})"
        )
    total = sum(
        info["distinctShapesInUse"]
        for info in census_out["families"].values()
        if info["shapeLabelled"]
    )
    print(f"\nShapes in the shape tables: {total} (label_shapes.py drafts them)")
    print(f"Wrote {os.path.join(GLYPH_DIR, 'objects.json')}")
    for family in SHAPE_FAMILIES:
        print(f"Wrote {os.path.join(shapes_dir, family + '.json')}")
    print(f"Wrote {os.path.join(build_dir, edition_id + '.shapes.json')}")
    print(f"Wrote {sheet_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--edition", default="ppr2025")
    main(parser.parse_args().edition)
