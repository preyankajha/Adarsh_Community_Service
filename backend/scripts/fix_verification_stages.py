"""
Fix script to reset family applications to correct verification stage
This fixes applications that are at Coordinator Scrutiny without a coordinator assigned
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGO_URI = "mongodb://localhost:27017"
DATABASE_NAME = "jagdama_samiti"

async def fix_verification_stages():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]
    families_collection = db["families"]
    
    # Find all families at Coordinator Scrutiny without a coordinator assigned
    cursor = families_collection.find({
        "status": "Pending",
        "verification_stage": "Coordinator Scrutiny",
        "$or": [
            {"coordinator_id": {"$exists": False}},
            {"coordinator_id": None},
            {"coordinator_id": ""}
        ]
    })
    
    families = await cursor.to_list(length=None)
    
    print(f"Found {len(families)} families at Coordinator Scrutiny without coordinator assigned")
    
    for family in families:
        family_id = family["_id"]
        family_name = family.get("head_name", "Unknown")
        
        # Reset to Secretary Scrutiny so coordinator can be assigned
        await families_collection.update_one(
            {"_id": family_id},
            {
                "$set": {
                    "verification_stage": "Secretary Scrutiny"
                }
            }
        )
        
        print(f"✅ Reset {family_name} (ID: {family_id}) to Secretary Scrutiny")
    
    # Also fix any at Committee Approval - change to President Approval
    cursor2 = families_collection.find({
        "status": "Pending",
        "verification_stage": "Committee Approval"
    })
    
    committee_families = await cursor2.to_list(length=None)
    
    print(f"\nFound {len(committee_families)} families at old 'Committee Approval' stage")
    
    for family in committee_families:
        family_id = family["_id"]
        family_name = family.get("head_name", "Unknown")
        
        # Change to President Approval
        await families_collection.update_one(
            {"_id": family_id},
            {
                "$set": {
                    "verification_stage": "President Approval"
                }
            }
        )
        
        print(f"✅ Updated {family_name} (ID: {family_id}) to President Approval")
    
    client.close()
    print("\n✅ Database fix completed!")

if __name__ == "__main__":
    asyncio.run(fix_verification_stages())
