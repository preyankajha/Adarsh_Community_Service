import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_permissions():
    uri = "mongodb+srv://MaaJagdambaSamiti:Raushan236@cluster0.rwxvzfk.mongodb.net/jagdamba_samiti?retryWrites=true&w=majority&appName=Cluster0"
    client = AsyncIOMotorClient(uri)
    db = client['MaaJagdambaSamiti']
    families_collection = db.families
    
    # helper to simulate the logic in the route
    async def get_query_for_user(role, position, user_id="user123"):
        current_user = {"id": user_id, "role": role, "position": position}
        
        # Logic from backend/routes/families.py
        is_admin = current_user.get("role") in ["admin", "super_admin"] or current_user.get("position") in ["president", "vice_president", "secretary", "joint_secretary", "treasurer", "joint_treasurer"]
        is_coordinator = current_user.get("role") == "coordinator" or current_user.get("position") == "coordinator"
        
        query = {}
        filter_status = "ALL"
        
        if is_coordinator and not is_admin:
            query["coordinator_id"] = str(current_user.get("id"))
            filter_status = "ASSIGNED ONLY"
            
        # Check if they pass dependency
        committee_roles = ['admin', 'super_admin', 'president', 'vice_president', 'secretary', 'joint_secretary', 'treasurer', 'joint_treasurer', 'executive_member', 'coordinator']
        if role not in committee_roles and position not in committee_roles:
             return "ACCESS DENIED (Dependency)"
             
        # Count results
        count = await families_collection.count_documents(query)
        return f"{filter_status} ({count} records)"

    print("--- PERMISSION CHECK REPORT ---")
    print(f"Super Admin:  {await get_query_for_user('super_admin', 'none')}")
    print(f"President:    {await get_query_for_user('family_head', 'president')}")
    print(f"Vice Pres.:   {await get_query_for_user('family_head', 'vice_president')}")
    print(f"Secretary:    {await get_query_for_user('family_head', 'secretary')}")
    print(f"Jt. Secretary:{await get_query_for_user('family_head', 'joint_secretary')}")
    print(f"Treasurer:    {await get_query_for_user('family_head', 'treasurer')}")
    print(f"Jt. Treasurer:{await get_query_for_user('family_head', 'joint_treasurer')}")
    print(f"Exec. Member: {await get_query_for_user('family_head', 'executive_member')}")
    print(f"Coordinator:  {await get_query_for_user('family_head', 'coordinator')}")
    print(f"Regular Member:{await get_query_for_user('member', 'none')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_permissions())
