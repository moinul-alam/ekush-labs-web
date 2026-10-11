#!/usr/bin/env python3
"""
Manifest builder for Prize Bond draws.
Calculates content hashes (sha256-first 12 chars), total winners, and claimable dates from rules.json.
Generates assets/index.json.
"""

import os
import sys
import json
import hashlib
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
DRAWS_DIR = os.path.join(ASSETS_DIR, "draws")
RULES_FILE = os.path.join(ASSETS_DIR, "rules.json")
OUTPUT_MANIFEST = os.path.join(ASSETS_DIR, "index.json")

def hash_file(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        hasher.update(f.read())
    return "sha256-" + hasher.hexdigest()[:12]

def add_months(date_str, months):
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    year = dt.year + (dt.month + months - 1) // 12
    month = (dt.month + months - 1) % 12 + 1
    # Simple day clamp
    day = min(dt.day, 28)
    return f"{year:04d}-{month:02d}-{day:02d}"

def build_manifest():
    if not os.path.exists(RULES_FILE):
        print(f"Error: rules.json not found at {RULES_FILE}")
        sys.exit(1)
        
    with open(RULES_FILE, "r", encoding="utf-8") as f:
        rules = json.load(f)
        
    validity_months = rules.get("claim", {}).get("validityMonths", 24)
    
    draw_files = [f for f in os.listdir(DRAWS_DIR) if f.endswith(".json")]
    draws_data = []
    
    for filename in sorted(draw_files):
        draw_path = os.path.join(DRAWS_DIR, filename)
        with open(draw_path, "r", encoding="utf-8") as df:
            draw = json.load(df)
            
        total_winners = sum(len(tier.get("numbers", [])) for tier in draw.get("tiers", []))
        draw_date = draw.get("date")
        claimable_until = add_months(draw_date, validity_months) if draw_date else ""
        content_version = hash_file(draw_path)
        
        draws_data.append({
            "id": str(draw.get("id")),
            "drawNumber": draw.get("drawNumber"),
            "date": draw_date,
            "file": f"draws/{filename}",
            "version": content_version,
            "totalWinners": total_winners,
            "claimableUntil": claimable_until
        })
        
    # Sort descending by drawNumber
    draws_data.sort(key=lambda x: x["drawNumber"], reverse=True)
    latest_draw = draws_data[0]["drawNumber"] if draws_data else 0
    
    manifest = {
        "schemaVersion": 1,
        "generatedAt": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "latestDraw": latest_draw,
        "draws": draws_data
    }
    
    with open(OUTPUT_MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
        
    print(f"Successfully generated {OUTPUT_MANIFEST} with {len(draws_data)} draws.")

if __name__ == "__main__":
    build_manifest()
