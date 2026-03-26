"""
Fix specific family - Reset Raushan Kumar Jha to correct stage
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGO_URI = "mongodb://localhost:27017"
DATABASE_NAME = "jagdama_samiti"

async def fix_raushan_family():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]
    families_collection = db["families"]
    
    # Find the family by name
    family = await families_collection.find_one({"head_name": "Raushan Kumar Jha"})
    
    if not family:
        print("Family 'Raushan Kumar Jha' not found!")
        client.close()
        return
    
    print(f"Found family: {family['head_name']}")
    print(f"Current stage: {family.get('verification_stage')}")
    print(f"Current coordinator: {family.get('coordinator_name', 'Not Assigned')}")
    
    # Reset to President Scrutiny (correct initial stage)
    await families_collection.update_one(
        {"_id": family["_id"]},
        {
            "$set": {
                "verification_stage": "President Scrutiny",
                "coordinator_id": None,
                "coordinator_name": None,
                "remarks": []
            }
        }
    )
    
    print("\nFamily reset successfully!")
    print("New stage: President Scrutiny")
    print("Coordinator: None (will be assigned by Secretary)")
    print("\nRefresh your browser to see the changes!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_raushan_family())
