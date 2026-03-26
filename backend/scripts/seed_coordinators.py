import asyncio
import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
import bcrypt

# Configuration
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "jagdamba_samiti")

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    return hashed.decode('utf-8')

async def seed_coordinators():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db["users"]

    print("Seeding 20 Coordinators...")
    
    coordinators = []
    credentials = []
    
    for i in range(1, 21):
        phone = f"88000000{i:02d}"
        name = f"Coordinator {i}"
        
        user = {
            "name": name,
            "phone": phone,
            "role": "coordinator",
            "position": "coordinator",
            "hashed_password": get_password_hash("coord123"),
            "is_active": True,
            "created_at": datetime.datetime.utcnow()
        }
        
        await users_collection.update_one({"phone": phone}, {"$set": user}, upsert=True)
        credentials.append(f"{name}: {phone} / coord123")

    print("\n--- SEEDING COMPLETE ---")
    print("\n".join(credentials))

if __name__ == "__main__":
    asyncio.run(seed_coordinators())
