#!/usr/bin/env python3
"""
Shared helpers for the PPR corpus pipeline.

Loads edition config and font-family classification, and resolves, for any
embedded PDF font, the glyph id -> glyph name mapping. Legacy Bangladeshi
fonts (SutonnyMJ / Nikosh / NikoshBAN) store Bengali glyphs in the Private Use
Area as `uniF0NN`, so the glyph name is the stable key for the decode table.
"""

import hashlib
import io
import json
import os

import pymupdf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(BASE_DIR, "build")
GLYPH_DIR = os.path.join(BASE_DIR, "scripts", "glyph_tables")
REFERENCE_DIR = os.path.join(BASE_DIR, "scripts", "reference_fonts")
EDITIONS_FILE = os.path.join(BASE_DIR, "editions.json")
FAMILIES_FILE = os.path.join(GLYPH_DIR, "families.json")


def ensure_build_dir():
    os.makedirs(BUILD_DIR, exist_ok=True)
    return BUILD_DIR


def load_editions():
    with open(EDITIONS_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


def get_edition(edition_id):
    for edition in load_editions()["editions"]:
        if edition["id"] == edition_id:
            return edition
    raise SystemExit(f"Error: edition '{edition_id}' not found in {EDITIONS_FILE}")


def edition_pdf_path(edition):
    return os.path.join(BASE_DIR, edition["sourcePdf"])


def load_families():
    with open(FAMILIES_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)["families"]


def strip_subset_prefix(font_name):
    """'WBFANC+NikoshBAN' -> 'NikoshBAN'"""
    return font_name.split("+", 1)[-1]


def font_object_key(base_font, xref):
    """'NikoshBAN', 175 -> 'NikoshBAN@175'. The unit the decode tables key on."""
    return f"{base_font}@{xref}"


def shape_id(recording):
    """
    Hash a decomposed glyph outline into a stable shape id.

    Components are decomposed first, so the same drawing hashes identically even
    when two font objects give it different names or glyph ids. Coordinates are
    rounded to 1/100 em; advance widths are deliberately excluded, because the
    same shape can be metricked differently across subsets.
    """
    canonical = []
    for operator, args in recording:
        points = tuple(
            round(float(value), 2) if isinstance(value, (int, float)) else value for value in args
        )
        canonical.append((operator, points))
    return hashlib.sha1(repr(canonical).encode("utf-8")).hexdigest()[:10]


def normalised_shape_key(recording, quantise=1000):
    """
    Shape fingerprint that survives translation and uniform scaling.

    `shape_id` compares raw coordinates, so it only matches glyphs drawn at the
    same size and origin. The embedded legacy fonts and the Unicode reference
    fonts are the same letterforms drawn at a different size/origin (measured:
    identical to 1/1000 em once normalised), so labelling has to compare them
    through this key, not `shape_id`. Returns None for a glyph that draws
    nothing.
    """
    points = [value for _operator, args in recording for value in args if isinstance(value, tuple)]
    if not points:
        return None
    x_min = min(point[0] for point in points)
    y_min = min(point[1] for point in points)
    scale = max(
        max(point[0] for point in points) - x_min,
        max(point[1] for point in points) - y_min,
    ) or 1
    canonical = []
    for operator, args in recording:
        scaled = tuple(
            (round((value[0] - x_min) / scale * quantise), round((value[1] - y_min) / scale * quantise))
            if isinstance(value, tuple)
            else value
            for value in args
        )
        canonical.append((operator, scaled))
    return tuple(canonical)


def font_object_for_span(candidates, chars, kind, resolver):
    """
    Which font object drew a span: the object its glyph ids were numbered in.

    A span carries only the stripped font name, and a page can mount two subsets
    of one family (NikoshBAN@175 and NikoshBAN@331), so the name does not say
    which object the content stream selected. The glyph ids do. They are numbered
    in the glyph order of the object that drew them, so the object that gives a
    code to every one of the span's glyphs is the one in use; an object whose
    cmap cannot name the glyphs cannot have drawn them.

    Where neither object names them - a glyph the cmap hides - the wider object
    is the safer reading, and a remaining tie keeps the last object listed, which
    is what the name-only lookup this replaces used to pick.
    """
    if not candidates:
        return None
    if len(candidates) == 1 or kind != "legacy":
        return candidates[0]

    def rank(index):
        xref = candidates[index]
        covered = sum(1 for _cp, gid, _o, _b in chars if resolver.code_for_gid(xref, gid))
        return covered, resolver.code_count(xref), index

    return candidates[max(range(len(candidates)), key=rank)]


def classify_family(font_name, families=None):
    """Return (family_id, kind) for a font name, or ('other', 'other')."""
    base = strip_subset_prefix(font_name)
    for family in families or load_families():
        for token in family["match"]:
            if token in base:
                return family["id"], family["kind"]
    return "other", "other"


class FontResolver:
    """
    Resolves glyph ids back to the original font's character codes, and to the
    outline shape the glyph draws.

    Legacy Bangladeshi fonts are single-byte encoded: the PDF stream carries the
    original font's code (0x01-0xFF). Glyph ids are per-subset and are NOT
    ordered by code, so the code must be recovered by inverting each subset's
    cmap. Several codepoints can share one glyph (0x4A and 0xF04A map to the same
    glyph); the low byte is the one the stream actually uses, so it wins.

    The cmap carries no Unicode entry for any Bengali letter, and the glyph
    *names* are assigned per font object, so neither is usable as a cross-object
    key. The rendering (`shape_for_gid`) is - see `shape_id`.
    """

    def __init__(self, doc):
        self.doc = doc
        self._glyph_order = {}
        self._gid_to_code = {}
        self._gid_to_shape = {}
        self._gid_to_norm = {}
        self._widths = {}

    def _load(self, xref):
        if xref in self._gid_to_code:
            return
        order, mapping, shapes, norms, widths = [], {}, {}, {}, []
        try:
            from fontTools.ttLib import TTFont

            _, _, _, content = self.doc.extract_font(xref)
            ttf = TTFont(io.BytesIO(content), lazy=True)
            order = ttf.getGlyphOrder()
            index_of = {name: gid for gid, name in enumerate(order)}
            for table in ttf["cmap"].tables:
                for code, name in table.cmap.items():
                    if code > 0xFF:
                        continue
                    gid = index_of.get(name)
                    if gid is None:
                        continue
                    if gid not in mapping or code < mapping[gid]:
                        mapping[gid] = code

            glyph_set = ttf.getGlyphSet()
            hmtx = ttf["hmtx"].metrics
            units_per_em = ttf["head"].unitsPerEm
            for gid, name in enumerate(order):
                widths.append(hmtx[name][0] / units_per_em)
                try:
                    from fontTools.pens.recordingPen import DecomposingRecordingPen

                    pen = DecomposingRecordingPen(glyph_set)
                    glyph_set[name].draw(pen)
                    shapes[gid] = shape_id(pen.value)
                    norms[gid] = normalised_shape_key(pen.value)
                except Exception:
                    pass
            ttf.close()
        except Exception:
            pass
        self._glyph_order[xref] = order
        self._gid_to_code[xref] = mapping
        self._gid_to_shape[xref] = shapes
        self._gid_to_norm[xref] = norms
        self._widths[xref] = widths

    def glyph_count(self, xref):
        self._load(xref)
        return len(self._glyph_order[xref])

    def code_for_gid(self, xref, gid):
        self._load(xref)
        return self._gid_to_code[xref].get(gid)

    def code_count(self, xref):
        """How many codes the object's cmap maps: its size as a text font."""
        self._load(xref)
        return len(self._gid_to_code[xref])

    def shape_for_gid(self, xref, gid):
        self._load(xref)
        return self._gid_to_shape[xref].get(gid)

    def normalised_key(self, xref, gid):
        """Scale/translation-invariant outline key, for cross-font shape matching."""
        self._load(xref)
        return self._gid_to_norm[xref].get(gid)

    def advance_width(self, xref, gid):
        self._load(xref)
        widths = self._widths[xref]
        return widths[gid] if gid < len(widths) else None

    def outline(self, xref, gid):
        """Decomposed SVG path + bounds of a glyph, for the review sheet."""
        from fontTools.pens.boundsPen import BoundsPen
        from fontTools.pens.recordingPen import DecomposingRecordingPen
        from fontTools.pens.svgPathPen import SVGPathPen
        from fontTools.ttLib import TTFont

        self._load(xref)
        name = self._glyph_order[xref][gid]
        _, _, _, content = self.doc.extract_font(xref)
        ttf = TTFont(io.BytesIO(content), lazy=True)
        glyph_set = ttf.getGlyphSet()
        recording = DecomposingRecordingPen(glyph_set)
        glyph_set[name].draw(recording)
        svg_pen = SVGPathPen(glyph_set)
        recording.replay(svg_pen)
        bounds_pen = BoundsPen(glyph_set)
        recording.replay(bounds_pen)
        ttf.close()
        return svg_pen.getCommands(), bounds_pen.bounds


def code_key(code):
    """Legacy code -> stable 2-digit hex key used by the decode tables."""
    return f"{code:02X}"



def legacy_table_path(family_id):
    return os.path.join(GLYPH_DIR, f"{family_id}.json")


def load_legacy_table(family_id):
    path = legacy_table_path(family_id)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh).get("glyphs", {})


def write_json(path, payload):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
