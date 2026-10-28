import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
recs = [json.loads(l) for l in open(os.path.join(HERE, "ppr2025.text.jsonl"), encoding="utf-8") if l.strip()]
seen, deduped = set(), []
for r in recs:
    key = (r["p"], tuple(r["bbox"]), r["visual"], r["o"])
    if key in seen: continue
    seen.add(key); deduped.append(r)
from collections import Counter
c = Counter()
fam = Counter()
for r in deduped:
    for ch in r["logical"]:
        if ch in "∑\uf0d8\uf0b7\uf0be":
            c[hex(ord(ch))] += 1
            fam[(hex(ord(ch)), r["fam"], r["f"])] += 1
print("counts:", dict(c))
print("by family:", dict(fam))
for r in deduped:
    if "∑" in r["logical"]:
        print("ctx:", r["g"], repr(r["logical"][:60]), r["fam"], r["f"])
        break
