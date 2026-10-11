#!/usr/bin/env python3
"""
Validates draw JSON files against schema and rules.
Checks:
- Expected count matches actual numbers count in each tier
- No duplicates within a draw
- Format is 7 digits
- Spot check sample output
"""

import os
import sys
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
DRAWS_DIR = os.path.join(ASSETS_DIR, "draws")
RULES_FILE = os.path.join(ASSETS_DIR, "rules.json")

NUMBER_REGEX = re.compile(r"^[0-9]{7}$")

def validate():
    with open(RULES_FILE, "r", encoding="utf-8") as f:
        rules = json.load(f)
        
    rule_tiers = {t["tier"]: t for t in rules.get("tiers", [])}
    
    draw_files = [f for f in os.listdir(DRAWS_DIR) if f.endswith(".json")]
    all_valid = True
    
    for filename in sorted(draw_files):
        draw_path = os.path.join(DRAWS_DIR, filename)
        with open(draw_path, "r", encoding="utf-8") as df:
            draw = json.load(df)
            
        print(f"\n--- Validating {filename} (Draw #{draw.get('drawNumber')}) ---")
        seen_numbers = set()
        
        for tier in draw.get("tiers", []):
            t_num = tier.get("tier")
            numbers = tier.get("numbers", [])
            expected = tier.get("expectedCount")
            amount = tier.get("amount")
            
            # Count check
            if len(numbers) != expected:
                print(f"[FAIL] Tier {t_num}: numbers count ({len(numbers)}) != expectedCount ({expected})")
                all_valid = False
            else:
                print(f"[OK] Tier {t_num}: count matches expected ({len(numbers)})")
                
            # Rule amount check
            if t_num in rule_tiers and rule_tiers[t_num]["amount"] != amount:
                print(f"[FAIL] Tier {t_num}: amount ({amount}) != rule amount ({rule_tiers[t_num]['amount']})")
                all_valid = False
                
            # Number format and uniqueness
            for num in numbers:
                if not NUMBER_REGEX.match(num):
                    print(f"[FAIL] Invalid number format: '{num}'")
                    all_valid = False
                if num in seen_numbers:
                    print(f"[FAIL] Duplicate number found in draw: {num}")
                    all_valid = False
                seen_numbers.add(num)
                
        print(f"[OK] Total unique winning numbers in draw: {len(seen_numbers)}")
        
    if all_valid:
        print("\nALL DRAWS VALIDATED SUCCESSFULLY!")
    else:
        print("\nVALIDATION FAILED! Check errors above.")
        sys.exit(1)

if __name__ == "__main__":
    validate()
