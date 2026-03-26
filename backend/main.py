from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, families, core, finance, management, elections, governance, communities
from database import db, users_collection, families_collection, rules_collection
from utils.security import get_password_hash
import json
import datetime
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

app = FastAPI(title="Adarsh Society Service API")

# Configure CORS
from fastapi.staticfiles import StaticFiles
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(families.router, prefix="/api/families", tags=["families"])
app.include_router(core.router, prefix="/api", tags=["core"])
app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
app.include_router(management.router, prefix="/api/management", tags=["management"])
app.include_router(elections.router, prefix="/api/elections", tags=["elections"])
app.include_router(governance.router, prefix="/api/governance", tags=["governance"])
app.include_router(communities.router, prefix="/api/communities", tags=["communities"])

@app.on_event("startup")
async def on_startup():
    from database import communities_collection
    try:
        # 0. Seed Default Community if none exists
        default_community = await communities_collection.find_one({"slug": "jagdamba-samiti"})
        if not default_community:
            print("Seeding Default Community...")
            default_comm_data = {
                "name": "Jagdamba Samiti",
                "slug": "jagdamba-samiti",
                "society_code": "JGSA",   # Jagdamba Samiti -> JG + SA
                "is_active": True,
                "created_at": datetime.datetime.utcnow()
            }
            res = await communities_collection.insert_one(default_comm_data)
            default_community_id = str(res.inserted_id)
            print(f"Default Community Seeded with code JGSA: {default_community_id}")
        else:
            default_community_id = str(default_community["_id"])
            # Backfill society_code and objectives if missing
            updates = {}
            if not default_community.get("society_code"):
                updates["society_code"] = "JGSA"
            
            # Use getattr or or-fallback to avoid None issues
            community_objectives = default_community.get("objectives")
            if not community_objectives:
                # Try to load from file
                try:
                    niya_path = os.path.join(os.path.dirname(__file__), "data", "niyamavali.txt")
                    if os.path.exists(niya_path):
                        with open(niya_path, "r", encoding="utf-8") as f:
                            updates["objectives"] = f.read()
                except Exception:
                    pass
            
            if updates:
                await communities_collection.update_one({"_id": default_community["_id"]}, {"$set": updates})
                print(f"Updated default community with {list(updates.keys())}")

        # Backfill any other communities that don't have a society_code yet
        async for comm in communities_collection.find({"society_code": {"$exists": False}}):
            comm_name = comm.get("name") or "SOC"
            words = [w for w in str(comm_name).strip().split() if w]
            new_code = ''.join([w[:2].upper() for w in words[:4]])[:6] or "SOC"
            # Make unique
            base_code = new_code
            suffix = 1
            while await communities_collection.find_one({"society_code": new_code, "_id": {"$ne": comm["_id"]}}):
                new_code = f"{base_code}{suffix}"
                suffix += 1
            await communities_collection.update_one({"_id": comm["_id"]}, {"$set": {"society_code": new_code}})
            print(f"Backfilled society_code={new_code} for {comm_name}")

        # 1. Update existing data to have community_id if missing (migration)
        # This is a one-time migration for existing data
        collections_to_migrate = [
            users_collection, families_collection, rules_collection,
            db.get_collection("assistance_requests"), db.get_collection("contributions"),
            db.get_collection("expenses"), db.get_collection("notices"),
            db.get_collection("elections")
        ]
        for col in collections_to_migrate:
            await col.update_many({"community_id": {"$exists": False}}, {"$set": {"community_id": default_community_id}})

        # 2. Auto-seed Admin
        admin_exists = await users_collection.find_one({"phone": "9999999999"})
        if not admin_exists:
            print("Seeding Admin User...")
            admin = {
                "name": "System Admin", 
                "phone": "9999999999", 
                "role": "admin", 
                "hashed_password": get_password_hash("admin123"),
                "is_active": True,
                "community_id": default_community_id, # Link to community
                "created_at": datetime.datetime.utcnow()
            }
            await users_collection.insert_one(admin)
            print("Admin Seeded: 9999999999 / admin123")

        # 3. Migrate Global Rules to Default Community if needed
        if default_community and not default_community.get("rules_json"):
            latest_rule = await rules_collection.find_one(sort=[("updated_at", -1)])
            if latest_rule:
                await communities_collection.update_one(
                    {"_id": ObjectId(default_community_id)},
                    {"$set": {"rules_json": latest_rule.get("content")}}
                )
                print("Migrated global rules to Jagdamba Samiti")

    except Exception as e:
        print(f"Error seeding data: {e}")

    print("MongoDB Database Initialized!")

@app.get("/")
def read_root():
    return {"message": "Welcome to Adarsh Society Service API (Multi-Community Platform)"}

@app.get("/api/status")
def get_status():
    return {"status": "running", "service": "Adarsh Society Service Backend"}

# --- Database-backed Rules Implementation ---

from models.schemas import RuleUpdate

from dependencies import get_current_user_optional, get_current_user

@app.get("/api/rules")
async def get_rules(current_user: dict = Depends(get_current_user_optional)):
    community_id = current_user.get("community_id") if current_user else None
    
    from database import communities_collection
    
    # Fallback to default community if not logged in
    if not community_id:
        default_comm = await communities_collection.find_one({"slug": "jagdamba-samiti"})
        if default_comm:
            community_id = str(default_comm["_id"])

    if community_id:
        community = await communities_collection.find_one({"_id": ObjectId(community_id)})
        if community and community.get("rules_json"):
            return {
                "current": community.get("rules_json"),
                "history": [],
                "community_name": community.get("name")
            }
        
    return {
        "current": {
            "text_hi": "No rules defined for this community yet.",
            "text": "Please contact your society administrator.",
            "text_en": ""
        },
        "history": []
    }

@app.post("/api/rules")
async def update_rules(update: RuleUpdate, current_user: dict = Depends(get_current_user)):
    community_id = current_user.get("community_id")
    if not community_id:
        raise HTTPException(status_code=400, detail="User not linked to any community")
        
    content_dict = {}
    if update.text is not None: content_dict["text"] = update.text
    if update.text_hi is not None: content_dict["text_hi"] = update.text_hi
    if update.text_en is not None: content_dict["text_en"] = update.text_en
    if update.structured is not None: content_dict["structured"] = update.structured
    
    from database import communities_collection
    await communities_collection.update_one(
        {"_id": ObjectId(community_id)},
        {"$set": {
            "rules_json": content_dict, 
            "updated_at": datetime.datetime.utcnow()
        }}
    )
    
    return {"message": "Rules updated successfully", "current": content_dict}

if __name__ == "__main__":
    import uvicorn
    print("STARTING SERVER ON PORT 8001...")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
