import asyncio
from database import users_collection

async def main():
    print("Checking for admins holding committee posts...")
    
    # Find admins/super_admins who have a position other than "none"
    query = {
        "role": {"$in": ["admin", "super_admin"]},
        "position": {"$nin": ["none", None, ""]}
    }
    
    count = await users_collection.count_documents(query)
    print(f"Found {count} users violating the rule.")

    if count > 0:
        cursor = users_collection.find(query)
        async for user in cursor:
            print(f"Updating user: {user.get('name')} (Role: {user.get('role')}, Position: {user.get('position')}) -> Position: none")
            
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"position": "none"}}
            )
            
    print("Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(main())
