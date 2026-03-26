import asyncio
import os
from database import rules_collection
import datetime

async def seed_rules():
    file_path = "data/niyamavali.txt"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Create the rule object
    # We will put the entire text into 'text_hi' (Hindi) or generic 'text'
    # Since the file name is niyamavali, it's likely Hindi/Marathi/English mixed or Hindi.
    
    rule_doc = {
        "content": {
            "text": content,
            "text_hi": content, # Assuming Hindi/Regional
            "text_en": "" 
        },
        "updated_at": datetime.datetime.utcnow(),
        "version": "1.0 (Auto-Seeded)"
    }

    # Insert
    await rules_collection.insert_one(rule_doc)
    print("Niyamavali seeded successfully into 'rules' collection.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_rules())
