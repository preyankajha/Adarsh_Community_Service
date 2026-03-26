
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import bcrypt

# Configuration
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "jagdama_samiti"

# Helper for password hashing
def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    return hashed.decode('utf-8')

async def remove_dummy_data():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Collections to clear
    collections_to_clear = [
        "users",
        "families",
        "assistance_requests",
        "recommendations",
        "family_update_requests",
        "contributions",
        "funds",
        "audit_logs",
        "inquiries",
        "notices",
        # "rules", # Configuration - keeping
        # "options" # Configuration - keeping
    ]
    
    print("\n" + "="*50)
    print("CLEARING DUMMY DATA")
    print("="*50)
    
    for coll_name in collections_to_clear:
        collection = db[coll_name]
        count = await collection.count_documents({})
        if count > 0:
            await collection.delete_many({})
            print(f"[OK] Cleared {count} documents from '{coll_name}'")
        else:
            print(f"- '{coll_name}' is already empty")

    print("\n" + "="*50)
    print("RE-SEEDING SYSTEM ACCOUNTS")
    print("="*50)

    # Re-seed Admin
    admin_phone = "9999999999"
    admin_user = {
        "name": "System Admin",
        "phone": admin_phone,
        "email": "admin@jagdambasamiti.org",
        "role": "admin",
        "position": "president",
        "hashed_password": get_password_hash("admin123"),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(admin_user)
    print(f"[OK] Re-created System Admin: {admin_phone} / admin123")
    
    # Re-seed Committee Members
    committee_positions = [
        ("president", "9990000001", "President User", "admin"),
        ("vice_president", "9990000002", "Vice President User", "admin"),
        ("secretary", "9990000003", "Secretary User", "admin"),
        ("joint_secretary", "9990000004", "Joint Secretary User", "admin"),
        ("treasurer", "9990000005", "Treasurer User", "admin"),
        ("executive_member", "9990000006", "Executive Member User", "admin"),
        ("coordinator", "9990000007", "Coordinator User", "admin")
    ]
    
    for pos, phone, name, role in committee_positions:
        new_user = {
            "name": name,
            "phone": phone,
            "role": role, # Usually they act as admins or specific roles
            "position": pos,
            "hashed_password": get_password_hash("admin123"),
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(new_user)
        print(f"[OK] Re-created {pos.replace('_', ' ').title()}: {phone} / admin123")

    print("\n" + "="*50)
    print("DONE! DATABASE IS CLEAN.")
    print("="*50)
    print("You can now login with:")
    print(" - Admin: 9999999999 / admin123")
    print(" - President: 9990000001 / admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_dummy_data())
