import asyncio
from database import families_collection, users_collection
import datetime
from bson import ObjectId

async def export_credentials():
    print("Exporting credentials for recently created families...")
    
    # Fetch families created in the last hour
    one_hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    
    # We can filter by ID pattern F-5xxx since that's what we used
    params = {"family_id": {"$regex": "^F-5"}}
    cursor = families_collection.find(params).sort("family_id", 1)
    
    families = await cursor.to_list(length=200)
    
    output_file = "dummy_families_list.txt"
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"--- DUMMY FAMILIES CREDENTIALS ({len(families)}) ---\n")
        f.write("Format: Family ID | Head Name | Mobile | Password\n\n")
        
        for fam in families:
            user = await users_collection.find_one({"phone": str(fam.get("user_id"))}) # Wait user_id is _id
            # We need to fetch the user to get the phone number if not in family doc (it is in form_data)
            
            # Use form_data for details
            try:
                import json
                fname = fam.get("family_id")
                hname = fam.get("head_name")
                
                # Retrieve phone from user collection using user_id
                u = await users_collection.find_one({"_id": fam.get("user_id")})
                if not u:
                    u = await users_collection.find_one({"_id":  fam.get("user_id") if not isinstance(fam.get("user_id"), str) else  ObjectId(fam.get("user_id"))})
                
                phone = u.get("phone") if u else "N/A"
                
                line = f"{fname} | {hname} | Mobile: {phone} | Pass: family123"
                f.write(line + "\n")
                print(line)
            except Exception as e:
                print(f"Error processing {fam.get('family_id')}: {e}")

    print(f"\nSuccessfully exported to {output_file}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(export_credentials())
