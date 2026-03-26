import asyncio
import os
import re
from datetime import datetime
from database import rules_collection

async def seed_rules():
    print("Forcing update of rules from file...")
    file_path = "माँ जगदम्बा स्वयंसेवी समिति.txt"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_lines = f.readlines()

        # Basic Markdown Formatting
        formatted_lines = []
        for line in raw_lines:
            # Convert "1.1 Title" to "### 1.1 Title"
            if not re.match(r'^(Chapter|अध्याय)', line.strip(), re.IGNORECASE):
                line = re.sub(r'^\s*(\d+(\.\d+)+)\s+(.*)', r'### \1 \3', line)
            formatted_lines.append(line)
        
        rule_text = "".join(formatted_lines)

        # Insert as new version
        new_rule = {
            "content": {
                "text_hi": rule_text,
                "text": rule_text,
                "text_en": "" 
            },
            "updated_at": datetime.utcnow()
        }
        
        result = await rules_collection.insert_one(new_rule)
        print(f"Rules updated successfully. Inserted ID: {result.inserted_id}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_rules())
