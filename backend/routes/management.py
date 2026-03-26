from fastapi import APIRouter, Depends, HTTPException, status, Body
from database import users_collection, families_collection, audit_logs_collection
from dependencies import get_president_user, get_committee_user
from typing import List, Optional
import datetime
from utils.audit import log_action
from bson import ObjectId

router = APIRouter()

@router.get("/users", response_model=List[dict])
async def get_all_users(community_id: Optional[str] = None, current_user: dict = Depends(get_committee_user)):
    query = {}
    if community_id and community_id != "all":
        query["community_id"] = community_id
    elif current_user.get("role") != "super_admin":
        query["community_id"] = current_user.get("community_id")
    
    # Optimized: Fetch all families once to avoid N+1 queries
    families_cursor = families_collection.find(query, {"head_name": 1, "user_id": 1, "_id": 1})
    families_list = await families_cursor.to_list(length=10000)
    
    # Use string conversion systematically to respect Pyre dict typing
    fam_by_id = {}
    fam_by_user = {}
    for f in families_list:
        fid = str(f.get("_id", ""))
        head = str(f.get("head_name", ""))
        uid = str(f.get("user_id", ""))
        
        if fid: fam_by_id[fid] = head
        if uid: fam_by_user[uid] = head

    cursor = users_collection.find(query)
    users = await cursor.to_list(length=1000)
    result = []
    for u in users:
        u_id_str = str(u.get("_id"))
        family_id = u.get("family_id")
        
        family_name = "N/A"
        if family_id and str(family_id) in fam_by_id:
            family_name = fam_by_id[str(family_id)]
        elif u.get("role") == 'family_head' and u_id_str in fam_by_user:
            family_name = fam_by_user[u_id_str]

        result.append({
            "id": u_id_str,
            "name": u.get("name"),
            "phone": u.get("phone"),
            "role": u.get("role"),
            "position": u.get("position", "none"),
            "is_active": u.get("is_active", True),
            "family": family_name
        })
    return result

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str, 
    new_role: str = Body(..., embed=True), 
    current_user: dict = Depends(get_president_user)
):
    target_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.get("position") == "president" and current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Cannot change President's role")

    old_role = target_user.get("role")
    
    update_data = {"role": new_role}
    if new_role in ["admin", "super_admin"]:
        update_data["position"] = "none"

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    await log_action(current_user.get("id"), "ROLE_CHANGE", "User", user_id, {
        "old_role": old_role,
        "new_role": new_role,
        "changed_by": current_user.get("name")
    })
    
    return {"message": f"Role updated from {old_role} to {new_role}"}

@router.put("/users/{user_id}/position")
async def update_user_position(
    user_id: str, 
    new_position: str = Body(..., embed=True), 
    current_user: dict = Depends(get_president_user)
):
    target_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only President or Super Admin can override posts
    if current_user.get("position") != "president" and current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only the President can override committee posts")

    target_role = target_user.get("role")
    if new_position != "none" and target_role in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail=f"System Administrators ({target_role}) cannot hold official committee positions.")

    old_pos = target_user.get("position", "none")
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"position": new_position}}
    )

    await log_action(current_user.get("id"), "POST_OVERRIDE", "User", user_id, {
        "old_position": old_pos,
        "new_position": new_position,
        "changed_by": current_user.get("name")
    })
    
    return {"message": f"Position updated from {old_pos} to {new_position}"}

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str, 
    is_active: bool = Body(..., embed=True), 
    current_user: dict = Depends(get_president_user)
):
    target_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.get("role") == "president" and current_user.get("role") != "super_admin":
         raise HTTPException(status_code=403, detail="Cannot suspend President")

    old_status = "Active" if target_user.get("is_active", True) else "Suspended"
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": is_active}}
    )

    new_status = "Active" if is_active else "Suspended"
    await log_action(current_user.get("id"), "STATUS_CHANGE", "User", user_id, {
        "old_status": old_status,
        "new_status": new_status,
        "changed_by": current_user.get("name")
    })

    return {"message": f"User status updated to {new_status}"}

@router.get("/role-logs", response_model=List[dict])
async def get_role_logs(current_user: dict = Depends(get_president_user)):
    cursor = audit_logs_collection.find({"action": {"$in": ["ROLE_CHANGE", "STATUS_CHANGE"]}}).sort("timestamp", -1)
    logs = await cursor.to_list(length=100)
    result = []
    for l in logs:
        target_user = await users_collection.find_one({"_id": ObjectId(l.get("target_id"))}) if l.get("target_id") else None
        user = await users_collection.find_one({"_id": ObjectId(l.get("user_id"))}) if l.get("user_id") else None
        
        result.append({
            "id": str(l.get("_id")),
            "user_name": target_user.get("name") if target_user else f"User #{l.get('target_id')}",
            "action": l.get("action"),
            "details": str(l.get("details")),
            "changed_by": user.get("name") if user else "System",
            "time": l.get("timestamp").strftime("%Y-%m-%d %H:%M:%S") if isinstance(l.get("timestamp"), datetime.datetime) else str(l.get("timestamp"))
        })
    return result
