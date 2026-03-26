import asyncio
import os
import re
import math
from database import rules_collection, db
import datetime

async def parse_and_seed():
    file_path = "data/niyamavali.txt"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    chapters = []
    
    # Split by "अध्याय"
    # This might need adjustment if there are false positives, but based on the file view it looks standard.
    # We look for "अध्याय <number>" at the start of a line.
    
    chapter_splits = re.split(r'\nअध्याय\s+(\d+)', '\n' + content) # Add newline to start to catch first one if needed
    
    # Result: [preamble, chapter_num, chapter_content, chapter_num, chapter_content...]
    
    # Process preamble if any (ignoring for now as typical preamble is just title)
    
    current_chapter = None
    
    for i in range(1, len(chapter_splits), 2):
        chapter_num = int(chapter_splits[i])
        chapter_body = chapter_splits[i+1]
        
        # Extract Chapter Title (Usually bolded on first logical line)
        # Format: \n**Title**\n
        title_match = re.search(r'\*\*(.*?)\*\*', chapter_body)
        chapter_title = title_match.group(1) if title_match else f"Chapter {chapter_num}"
        
        # Remove the title from body to process sections
        if title_match:
            chapter_body = chapter_body[title_match.end():]

        sections = []
        
        # Split sections by "**x.y Title**"
        # We need to capture the ID and Title
        
        # Using a pattern that finds the section headers
        # We iterate to find all matches and their indices
        section_pattern = re.compile(r'\*\*(\d+\.\d+)\s+(.*?)\*\*')
        
        matches = list(section_pattern.finditer(chapter_body))
        
        for j, match in enumerate(matches):
            sec_id = match.group(1)
            sec_title = match.group(2)
            
            start_index = match.end()
            end_index = matches[j+1].start() if j + 1 < len(matches) else len(chapter_body)
            
            sec_content = chapter_body[start_index:end_index].strip()
            
            sections.append({
                "section_id": sec_id,
                "title": sec_title,
                "content": sec_content
            })
            
        # If no sections found, maybe it's just text
        if not sections and chapter_body.strip():
             sections.append({
                "section_id": f"{chapter_num}.0",
                "title": "General",
                "content": chapter_body.strip()
            })

        chapters.append({
            "chapter_id": chapter_num,
            "title": chapter_title,
            "sections": sections
        })

    # Construct Rule Document
    rule_doc = {
        "content": {
            "text": content, # Keep original text as backup/downloadable
            "structured": chapters 
        },
        "updated_at": datetime.datetime.utcnow(),
        "version": "2.0 (Structured)"
    }

    # Clear old rules to avoid confusion? Or just add new one.
    # Let's add new one.
    await rules_collection.insert_one(rule_doc)
    print(f"Seeded {len(chapters)} structured chapters into DB.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(parse_and_seed())
