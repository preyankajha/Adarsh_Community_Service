import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Mock user: Joint Secretary
current_user = {
    "id": "mock_user_id",
    "role": "family_head", 
    "position": "joint_secretary"
}

async def text_logic():
    uri = "mongodb+srv://MaaJagdambaSamiti:Raushan236@cluster0.rwxvzfk.mongodb.net/jagdamba_samiti?retryWrites=true&w=majority&appName=Cluster0"
    client = AsyncIOMotorClient(uri)
    db = client['MaaJagdambaSamiti']
    families_collection = db.families
    
    # Logic from families.py get_all_families
    query = {}
    is_admin = current_user.get("role") in ["admin", "super_admin"] or current_user.get("position") in ["president", "vice_president", "secretary", "joint_secretary", "treasurer", "joint_treasurer"]
    is_coordinator = current_user.get("role") == "coordinator" or current_user.get("position") == "coordinator"
    
    print(f"Is Admin: {is_admin}, Is Coordinator: {is_coordinator}")
    
    if is_coordinator and not is_admin:
        query["coordinator_id"] = str(current_user.get("id"))
        
    print(f"Query: {query}")
    
    cursor = families_collection.find(query, {"form_data": 1, "status": 1, "verification_stage": 1, "coordinator_name": 1, "coordinator_id": 1, "head_name": 1, "family_id": 1, "remarks": 1})
    results = []
    
    count = 0
    errors = 0
    
    async for f in cursor:
        count += 1
        try:
            form_data = f.get("form_data")
            if form_data and isinstance(form_data, str):
                try:
                    data = json.loads(form_data)
                except:
                    data = {}
            elif isinstance(form_data, dict):
                data = form_data
            else:
                data = {}
            
            # Ensure critical fields are present from root document if not in data
            if "head_details" not in data:
                data["head_details"] = {"full_name": f.get("head_name")}
            if "head_name" not in data and "head_details" in data:
                data["head_name"] = data["head_details"].get("full_name")
            if "head_name" not in data:
                 data["head_name"] = f.get("head_name")

            if "family_unique_id" not in data:
                data["family_unique_id"] = f.get("family_id", "Pending")
            
            data["_id"] = str(f.get("_id"))
            data["status"] = f.get("status")
            data["verification_stage"] = f.get("verification_stage")
            data["coordinator_name"] = f.get("coordinator_name")
            data["coordinator_id"] = f.get("coordinator_id")
            
            # Ensure remarks are available
            if "remarks" not in data or not data["remarks"]:
                data["remarks"] = f.get("remarks", [])
                
            results.append(data)
        except Exception as e:
            print(f"Error processing family {f.get('_id')}: {e}")
            errors += 1
            continue
            
    print(f"Total processed: {count}")
    print(f"Total results: {len(results)}")
    print(f"Total errors: {errors}")
    if len(results) > 0:
        print(f"Sample result: {results[0]['head_name']}")

    client.close()

if __name__ == "__main__":
    asyncio.run(text_logic())
