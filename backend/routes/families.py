from fastapi import APIRouter, HTTPException, status, Depends, Body
from models.schemas import FamilyRegistration, RecommendationCreate, MemberDetails, NomineeDetails
from database import families_collection, users_collection, recommendations_collection, family_update_requests_collection
from utils.security import get_password_hash
from typing import List
import json
import uuid
from datetime import datetime
from dependencies import get_current_user, get_secretary_user, get_committee_user, get_president_user
from utils.audit import log_action
from bson import ObjectId

router = APIRouter()

from typing import List, Dict, Any

def parse_form_data(form_data: Any) -> Dict[str, Any]:
    """Safely parse form_data from DB which could be JSON string, dict, or None."""
    if form_data is None:
        return {}
    try:
        if isinstance(form_data, str):
            return dict(json.loads(form_data))
        if isinstance(form_data, dict):
            return dict(form_data)
    except Exception:
        pass
    return {}

@router.post("/recommend", response_model=dict)
async def recommend_family(req: RecommendationCreate, current_user: dict = Depends(get_current_user)):
    token = str(uuid.uuid4())[:8].upper()
    recommendation = {
        "token": token,
        "recommender_id": str(current_user.get("id")),
        "recommender_name": current_user.get("name"),
        "new_head_name": req.new_head_name,
        "father_name": req.father_name,
        "mobile": req.mobile,
        "email": req.email,
        "status": "Issued",
        "created_at": datetime.utcnow()
    }
    await recommendations_collection.insert_one(recommendation)
    return {"token": token, "message": "Recommendation generated. Share this token with the new family."}

@router.get("/recommendations/my", response_model=List[dict])
async def get_my_recommendations(current_user: dict = Depends(get_current_user)):
    cursor = recommendations_collection.find({"recommender_id": str(current_user.get("id"))})
    recs = await cursor.to_list(length=100)
    for r in recs: r["_id"] = str(r["_id"])
    return recs

@router.post("/verify-token/{token}", response_model=dict)
async def verify_recommendation_token(token: str):
    rec = await recommendations_collection.find_one({"token": token})
    if not rec:
        raise HTTPException(status_code=404, detail="Invalid token")
    return {
        "recommender_name": rec.get("recommender_name"),
        "new_head_name": rec.get("new_head_name"),
        "father_name": rec.get("father_name"),
        "mobile": rec.get("mobile"),
        "email": rec.get("email"),
        "status": rec.get("status")
    }

@router.get("/me", response_model=dict)
async def get_my_family(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    family = await families_collection.find_one({"user_id": user_id})
    
    if not family:
         family = await families_collection.find_one({"_id": ObjectId(current_user.get("family_id"))}) if current_user.get("family_id") else None
         
    if not family:
        raise HTTPException(status_code=404, detail="Family profile not found for this user")

    try:
        form_data = family.get("form_data")
        data: Dict[str, Any] = parse_form_data(form_data)

        data["_id"] = str(family.get("_id"))
        data["status"] = family.get("status")
        data["verification_stage"] = family.get("verification_stage")
        data["family_unique_id"] = family.get("family_id", data.get('family_unique_id', 'Pending'))
        # Include pending members if any
        data["pending_members"] = family.get("pending_members", [])

        # Get coordinator details if assigned
        coordinator_id = family.get("coordinator_id")
        if coordinator_id:
            try:
                coord_user = await users_collection.find_one({"_id": ObjectId(coordinator_id)})
                if coord_user:
                    data["assigned_coordinator"] = {
                        "id": str(coord_user["_id"]),
                        "name": coord_user.get("name"),
                        "phone": coord_user.get("phone"),
                        "position": coord_user.get("position", "Coordinator"),
                        "profile_photo": coord_user.get("profile_photo")
                    }
            except: pass

        return data
    except Exception as e:
        print(f"Error parsing family data: {e}")
        return {}

@router.post("/members/add", response_model=dict)
async def add_member_request(member: MemberDetails, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    family = await families_collection.find_one({"user_id": user_id})
    if not family: raise HTTPException(status_code=404, detail="Family profile not found")
    
    request_id = str(uuid.uuid4())
    req = {
        "request_id": request_id,
        "member": member.dict(),
        "verification_stage": "Coordinator Scrutiny",
        "status": "Pending",
        "created_at": datetime.utcnow()
    }
    
    await families_collection.update_one(
        {"_id": family["_id"]},
        {"$push": {"pending_members": req}}
    )
    return {"message": "Member addition request submitted.", "request_id": request_id}

@router.get("/members/requests", response_model=List[dict])
async def get_member_requests(current_user: dict = Depends(get_committee_user)):
    cursor = families_collection.find({"pending_members": {"$exists": True, "$not": {"$size": 0}}})
    requests = []
    async for f in cursor:
        p_mems = f.get("pending_members", [])
        for pm in p_mems:
            pm['family_id'] = str(f["_id"])
            pm['head_name'] = f.get('head_name')
            pm['family_unique_id'] = f.get('family_id', 'Pending')
            requests.append(pm)
    return requests

@router.post("/members/requests/{request_id}/action", response_model=dict)
async def action_member_request(request_id: str, action: str, current_user: dict = Depends(get_current_user)):
    # Find family with this request
    family = await families_collection.find_one({"pending_members.request_id": request_id})
    if not family: raise HTTPException(status_code=404, detail="Request not found")
    
    # Find the specific request
    req = next((r for r in family.get("pending_members", []) if r["request_id"] == request_id), None)
    if not req: raise HTTPException(status_code=404, detail="Request data invalid")
    
    current_stage = req.get("verification_stage")
    
    # Coordinator Action
    if current_stage == "Coordinator Scrutiny" and action == "verify":
        is_coord = current_user.get("role") in ["admin", "super_admin", "coordinator"] or current_user.get("position") == "coordinator"
        if not is_coord: raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update stage
        await families_collection.update_one(
            {"_id": family["_id"], "pending_members.request_id": request_id},
            {"$set": {"pending_members.$.verification_stage": "Committee Approval"}}
        )
        return {"message": "Verified and forwarded to Committee"}

    # Committee Action (Approve)
    elif current_stage == "Committee Approval" and action == "approve":
        # Check permission (committee only)
        # Assuming get_committee_user checks generally, but explicit check:
        # (Already handled by dependency usage if we used get_committee_user, but we used get_current_user to allow Coordinators too)
        # So check here:
        role = current_user.get("role")
        pos = current_user.get("position")
        is_comm = role in ['super_admin', 'president', 'vice_president', 'secretary', 'treasurer'] or pos in ['president', 'vice_president', 'secretary', 'treasurer']
        if not is_comm: raise HTTPException(status_code=403, detail="Committee approval required")

        # 1. Add to main members list
        member_data = req['member']
        
        # Generate ID
        fam_uid = family.get("family_id")
        current_members = len(json.loads(family.get("form_data")).get("members", []))
        suffix = current_members + 1 + len(family.get("members", [])) # rough count logic, better fetch form_data count
        # Re-parse form data to be safe
        form_data = json.loads(family.get("form_data"))
        real_count = len(form_data.get("members", [])) + 1
        member_id = f"{fam_uid}-M{real_count:02d}"
        member_data['member_id'] = member_id
        
        # Update Form Data
        form_data['members'].append(member_data)
        
        await families_collection.update_one(
            {"_id": family["_id"]},
            {
                "$set": {"form_data": json.dumps(form_data, default=str)},
                "$pull": {"pending_members": {"request_id": request_id}}
            }
        )
        return {"message": "Member approved and added to family."}
        
    # Reject
    elif action == "reject":
         # Allow coordinator or committee to reject
         await families_collection.update_one(
            {"_id": family["_id"]},
            {"$pull": {"pending_members": {"request_id": request_id}}}
        )
         return {"message": "Request rejected and removed."}

    raise HTTPException(status_code=400, detail="Invalid action or stage")



@router.post("/complete-profile", response_model=dict)
async def complete_profile(family: FamilyRegistration, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    existing_fam = await families_collection.find_one({"user_id": user_id, "status": "Profile Incomplete"})
    
    if not existing_fam:
        # Check if they are already pending/approved
        fam = await families_collection.find_one({"user_id": user_id})
        if fam:
            raise HTTPException(status_code=400, detail="Profile already submitted or active")
        raise HTTPException(status_code=404, detail="Preliminary record not found")

    join_method = "Direct"
    v_stage = "President Scrutiny"
    recommender_id = None
    recommender_name = None
    
    if family.recommendation_token:
        rec = await recommendations_collection.find_one({"token": family.recommendation_token})
        if rec:
            join_method = "Recommendation"
            v_stage = "Recommender Verification"
            recommender_id = rec["recommender_id"]
            recommender_name = rec["recommender_name"]
            await recommendations_collection.update_one({"token": family.recommendation_token}, {"$set": {"status": "Used"}})

    family_dict = family.dict(exclude={"id"})
    family_dict["join_method"] = join_method
    family_dict["verification_stage"] = v_stage
    family_dict["recommender_id"] = recommender_id
    family_dict["recommender_name"] = recommender_name
    
    await families_collection.update_one(
        {"_id": existing_fam["_id"]},
        {"$set": {
            "head_name": family.head_details.full_name,
            "status": "Pending",
            "form_data": json.dumps(family_dict, default=str),
            "verification_stage": v_stage,
            "join_method": join_method,
            "recommender_id": recommender_id,
            "recommender_name": recommender_name
        }}
    )
    return {"message": "Profile submitted successfully for verification."}

@router.post("/save-progress", response_model=dict)
async def save_progress(family: dict = Body(...), current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    # We allow saving even if already pending, or just incomplete
    existing_fam = await families_collection.find_one({"user_id": user_id})
    if not existing_fam:
        raise HTTPException(status_code=404, detail="Family record not found")

    # Update head_name if present in partial data
    update_data: Dict[str, Any] = {
        "form_data": json.dumps(family, default=str),
        "updated_at": datetime.utcnow()
    }
    
    head_details = family.get("head_details", {})
    if isinstance(head_details, dict) and head_details.get("full_name"):
        update_data["head_name"] = head_details.get("full_name")

    await families_collection.update_one(
        {"_id": existing_fam["_id"]},
        {"$set": update_data}
    )
    return {"message": "Progress saved successfully."}

@router.post("/register", response_model=dict)
async def register_family(family: FamilyRegistration):
    join_method = "Direct"
    v_stage = "President Scrutiny"
    recommender_id = None
    recommender_name = None
    
    if family.recommendation_token:
        rec = await recommendations_collection.find_one({"token": family.recommendation_token})
        if rec:
            join_method = "Recommendation"
            v_stage = "Recommender Verification"
            recommender_id = rec["recommender_id"]
            recommender_name = rec["recommender_name"]
            await recommendations_collection.update_one({"token": family.recommendation_token}, {"$set": {"status": "Used"}})
    else:
        # Default stage for direct join
        v_stage = "President Scrutiny"

    family_dict = family.dict(exclude={"id"})
    family_dict["join_method"] = join_method
    family_dict["verification_stage"] = v_stage
    family_dict["recommender_id"] = recommender_id
    family_dict["recommender_name"] = recommender_name
    family_dict["remarks"] = [] # Initialize remarks list
    
    new_family = {
        "head_name": family.head_details.full_name,
        "user_id": None, 
        "status": "Pending",
        "created_at": datetime.utcnow(),
        "form_data": json.dumps(family_dict, default=str),
        "join_method": join_method,
        "verification_stage": v_stage,
        "recommender_id": recommender_id,
        "remarks": []
    }
    
    result = await families_collection.insert_one(new_family)
    return {"id": str(result.inserted_id), "message": "Application submitted successfully."}

from models.requests import VerifyStageRequest

@router.post("/{family_id}/verify-stage", response_model=dict)
async def verify_family_stage(
    family_id: str, 
    verify_req: VerifyStageRequest = None, 
    current_user: dict = Depends(get_current_user)
):
    family = await families_collection.find_one({"_id": ObjectId(family_id)})
    if not family: raise HTTPException(status_code=404, detail="Family not found")
    
    current_stage = family.get("verification_stage")
    
    # Consistency Check: Ensure user is acting on the correct stage
    if verify_req and verify_req.current_stage:
        if verify_req.current_stage != current_stage:
            raise HTTPException(
                status_code=400, 
                detail=f"Stage mismatch. Application is already at '{current_stage}'. Please refresh."
            )
            
    next_stage = None
    
    if current_stage == "Recommender Verification":
        if str(current_user.get("id")) != family.get("recommender_id"):
             raise HTTPException(status_code=403, detail="Only the recommender can verify this application")
        next_stage = "President Scrutiny"  # After recommendation, goes to President first
    
    elif current_stage == "President Scrutiny":
        # President receives application first and forwards to Secretary for coordinator assignment
        role = current_user.get("role")
        pos = current_user.get("position")
        if role not in ["president", "vice_president", "super_admin"] and pos not in ["president", "vice_president"]:
            raise HTTPException(status_code=403, detail="Only President or Vice President can verify this stage")
        next_stage = "Secretary Scrutiny"  # Forward to Secretary for coordinator assignment
        
    elif current_stage == "Secretary Scrutiny":
        # Secretary assigns coordinator and forwards to coordinator
        role = current_user.get("role")
        pos = current_user.get("position")
        if role not in ["secretary", "super_admin"] and pos != "secretary":
             raise HTTPException(status_code=403, detail="Only Secretary can verify this stage")
        
        assigned_coord_id = family.get("coordinator_id")
        if not assigned_coord_id:
             raise HTTPException(status_code=400, detail="Please assign a coordinator before forwarding.")
             
        next_stage = "Coordinator Scrutiny"  # Forward to assigned coordinator

    elif current_stage == "Coordinator Scrutiny":
        # Coordinator verifies and sends back to President for final approval
        assigned_coord_id = family.get("coordinator_id")
        if not assigned_coord_id:
             raise HTTPException(status_code=400, detail="Coordinator must be assigned before verification")
             
        is_assigned = str(current_user.get("id")) == assigned_coord_id
        is_super = current_user.get("role") == "super_admin"
        
        if not (is_assigned or is_super):
             raise HTTPException(status_code=403, detail="Only the assigned coordinator or Super Admin can verify this stage")
             
        next_stage = "President Approval"  # Send back to President for final approval
    
    elif current_stage == "President Approval":
        # President gives final approval
        role = current_user.get("role")
        pos = current_user.get("position")
        if role not in ["president", "vice_president", "super_admin"] and pos not in ["president", "vice_president"]:
            raise HTTPException(status_code=403, detail="Only President or Vice President can give final approval")
        # This will be handled by the approve endpoint, not here
        raise HTTPException(status_code=400, detail="Use the Final Approval button for this stage")
    
    # If we got here, next_stage should be set
    if not next_stage:
        raise HTTPException(status_code=400, detail="No verification action available for this stage or user")
        
    # Always log the action
    log_entry = {
        "stage": current_stage,
        "action": f"Moved to {next_stage}",
        "remark": verify_req.remarks if verify_req and verify_req.remarks else "",
        "by": current_user.get("name"),
        "role": current_user.get("position") or current_user.get("role"),
        "date": datetime.utcnow()
    }

    # Update both root level and form_data to keep them in sync
    try:
        form_data = family.get("form_data")
        data = json.loads(form_data) if isinstance(form_data, str) else form_data
        data["verification_stage"] = next_stage
        
        # Ensure remarks exist in data
        if "remarks" not in data: data["remarks"] = []
        data["remarks"].append(log_entry)

        await families_collection.update_one(
            {"_id": ObjectId(family_id)}, 
            {
                "$set": {
                    "verification_stage": next_stage,
                    "form_data": json.dumps(data, default=str)
                },
                "$push": {"remarks": log_entry}
            }
        )
    except Exception as e:
        # Fallback
        await families_collection.update_one(
            {"_id": ObjectId(family_id)}, 
            {
                "$set": {"verification_stage": next_stage},
                "$push": {"remarks": log_entry}
            }
        )
        
    # Log audit trail
    try:
        await log_action(
            user_id=str(current_user.get("id")),
            action="VERIFY",
            target_type="Family",
            target_id=family_id,
            details={
                "user_name": current_user.get("name"),
                "user_role": current_user.get("position") or current_user.get("role"),
                "from_stage": current_stage,
                "to_stage": next_stage
            }
        )
    except Exception as e:
        print(f"Audit log failed: {e}")
        # Proceed without failing the request
        
    return {"message": f"Application verified and moved to {next_stage}"}

@router.post("/{family_id}/approve", response_model=dict)
async def approve_family_application(
    family_id: str,
    current_user: dict = Depends(get_president_user)
):
    """
    Final approval by President.
    1. Generates Family ID
    2. Generates Member IDs
    3. Creates User Account for Head
    4. Updates Family Status to Approved
    """
    # 1. Fetch Family
    family = await families_collection.find_one({"_id": ObjectId(family_id)})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
        
    if family.get("status") == "Approved":
        return {"message": "Family is already approved."}
        
    # 2. Generate Family ID (Format: SOCIETYCODE-F-Sequence)
    # Get count of approved families FOR THIS COMMUNITY for sequence
    community_id = family.get("community_id")
    society_code = "ASS"  # Fallback default

    if community_id:
        try:
            from database import communities_collection
            from bson import ObjectId as ObjId
            community = await communities_collection.find_one({"_id": ObjId(community_id)})
            if community and community.get("society_code"):
                society_code = community.get("society_code")
        except Exception as e:
            print(f"Could not fetch society_code: {e}")

    # Count approved families scoped to this community
    count_query = {"status": "Approved"}
    if community_id:
        count_query["community_id"] = community_id
    count = await families_collection.count_documents(count_query)
    seq = count + 1
    family_unique_id = f"{society_code}-F-{seq:04d}"
    
    # 3. Process Members and Generate Member IDs
    form_data = family.get("form_data")
    data = parse_form_data(form_data)

    members = data.get("members", [])
    updated_members = []
    for idx, mem in enumerate(members):
        mem["member_id"] = f"{family_unique_id}-M{idx+1:02d}"
        updated_members.append(mem)
        
    data["members"] = updated_members
    data["family_unique_id"] = family_unique_id
    data["status"] = "Approved"
    
    # 4. Create User Account for Head
    head_details = data.get("head_details", {})
    head_phone = head_details.get("mobile")
    head_name = head_details.get("full_name")
    
    if not head_phone:
        # Fallback to root level if not in details
        head_phone = family.get("mobile") # unlikely but possible
        if not head_phone:
             # Try to find from existing user user search?
             pass

    if not head_phone:
        raise HTTPException(status_code=400, detail="Head mobile number missing in application")
        
    # Check if user already exists
    existing_user = await users_collection.find_one({"phone": head_phone})
    user_id = existing_user.get("_id") if existing_user else None
    
    # Default password: FAM + last 4 digits of phone
    auto_password = f"FAM{head_phone[-4:]}" 
    hashed_password = get_password_hash(auto_password)
    
    if not existing_user:
        new_user = {
            "name": head_name,
            "phone": head_phone,
            "role": "family_head",
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        ur = await users_collection.insert_one(new_user)
        user_id = ur.inserted_id
    else:
        # Update existing user role if needed
        if existing_user.get("role") not in ["admin", "super_admin", "family_head"]:
             await users_collection.update_one({"_id": user_id}, {"$set": {"role": "family_head"}})

    # 5. Update Family Record
    log_entry = {
        "stage": "President Approval",
        "action": "Final Approval Granted",
        "remark": f"Approved. ID: {family_unique_id}",
        "by": current_user.get("name"),
        "role": current_user.get("position"),
        "date": datetime.utcnow()
    }
    
    if "remarks" not in data: data["remarks"] = []
    data["remarks"].append(log_entry)

    # Convert objectID to str for JSON serialization if needed, though json.dumps handles basic types, 
    # we need to ensure no ObjectId remains in data
    
    await families_collection.update_one(
        {"_id": ObjectId(family_id)},
        {
            "$set": {
                "status": "Approved",
                "verification_stage": "Approved",
                "family_id": family_unique_id, # Store at root
                "user_id": str(user_id),       # Link to User
                "form_data": json.dumps(data, default=str)
            },
           "$push": {"remarks": log_entry}
        }
    )
    
    return {
        "message": f"Family Approved! ID: {family_unique_id}",
        "credentials": {
            "username": head_phone,
            "password": auto_password
        }
    }

@router.post("/{family_id}/assign-coordinator", response_model=dict)
async def assign_coordinator_to_family(
    family_id: str,
    coordinator_id: str = Body(...),
    coordinator_name: str = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Assign a coordinator to a family application (Secretary/President/Admin only)"""
    # Check permissions
    role = current_user.get("role")
    pos = current_user.get("position")
    
    is_authorized = (
        role in ["admin", "super_admin"] or 
        pos in ["president", "vice_president", "secretary"]
    )
    
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Only Secretary, President, or Admin can assign coordinators")
    
    # Find the family
    family = await families_collection.find_one({"_id": ObjectId(family_id)})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Update the family with coordinator info and log the action
    log_entry = {
        "stage": family.get("verification_stage", "Secretary Scrutiny"),
        "action": "Coordinator Assigned",
        "remark": f"Assigned to {coordinator_name}",
        "by": current_user.get("name"),
        "role": current_user.get("position") or current_user.get("role"),
        "date": datetime.utcnow()
    }

    form_data = family.get("form_data")
    data = json.loads(form_data) if isinstance(form_data, str) else form_data
    if "remarks" not in data: data["remarks"] = []
    data["remarks"].append(log_entry)
    
    await families_collection.update_one(
        {"_id": ObjectId(family_id)},
        {
            "$set": {
                "coordinator_id": coordinator_id,
                "coordinator_name": coordinator_name,
                "form_data": json.dumps(data, default=str)
            },
            "$push": {"remarks": log_entry}
        }
    )
    
    return {"message": f"Coordinator {coordinator_name} assigned successfully"}

@router.get("", response_model=List[dict])
async def get_all_families(current_user: dict = Depends(get_committee_user)):
    print(f"DEBUG: get_all_families called by {current_user.get('name')}")
    # Filter for Coordinators
    query = {}
    role = current_user.get("role", "").lower()
    pos = current_user.get("position", "").lower()
    
    is_admin = role in ["admin", "super_admin"] or pos in ["president", "vice_president", "secretary", "joint_secretary", "treasurer", "joint_treasurer"]
    is_coordinator = role == "coordinator" or pos == "coordinator"
    
    if is_coordinator and not is_admin:
        query["coordinator_id"] = str(current_user.get("id"))
        
    print(f"DEBUG: query: {query}")
    cursor = families_collection.find(query, {"form_data": 1, "status": 1, "verification_stage": 1, "coordinator_name": 1, "coordinator_id": 1, "head_name": 1, "family_id": 1, "remarks": 1, "recommender_name": 1, "join_method": 1})
    results = []
    async for f in cursor:
        try:
            form_data = f.get("form_data")
            data = parse_form_data(form_data)
            
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
            continue
    print(f"DEBUG: Returning {len(results)} families")
    return results



@router.get("/{family_id}", response_model=dict)
async def get_family(family_id: str, current_user: dict = Depends(get_committee_user)):
    family = await families_collection.find_one({"_id": ObjectId(family_id)})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    form_data = family.get("form_data")
    data = json.loads(form_data) if isinstance(form_data, str) else form_data
    data["_id"] = str(family.get("_id"))
    data["status"] = family.get("status")
    data["verification_stage"] = family.get("verification_stage")
    data["remarks"] = family.get("remarks", [])
    if "remarks" in data and not data["remarks"]:
         # Fallback to form_data remarks if root remarks empty
         data["remarks"] = data.get("remarks", [])
         
    return data

@router.put("/me/nominees", response_model=dict)
async def update_nominee_details(nominee_data: NomineeDetails, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    family = await families_collection.find_one({"user_id": user_id})
    if not family:
        raise HTTPException(status_code=404, detail="Family profile not found")

    try:
        form_data = family.get("form_data")
        data = json.loads(form_data) if isinstance(form_data, str) else form_data
        
        # Update nominee details
        data["nominee_details"] = nominee_data.dict()
        
        await families_collection.update_one(
            {"_id": family["_id"]},
            {"$set": {"form_data": json.dumps(data, default=str)}}
        )
        return {"message": "Nominee details updated successfully"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error updating nominees: {str(e)}")
@router.post("/requests/update", response_model=dict)
async def create_update_request(
    update_data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a request to update family/member details.
    Workflow:
    - If Address Change -> To Secretary
    - If General Change -> To Coordinator
    """
    family = await families_collection.find_one({"_id": ObjectId(current_user["id"])})
    if not family:
        # Try fetching by associated user_id if current_user is a user document
        family = await families_collection.find_one({"user_id": str(current_user["_id"])})
    
    if not family:
        raise HTTPException(status_code=404, detail="Family profile not found")

    request_type = update_data.get("request_type", "General") # General or Address
    target_member_id = update_data.get("member_id") # 'HEAD' or specific member_id
    changes = update_data.get("changes", {})
    
    if not changes:
        raise HTTPException(status_code=400, detail="No changes provided")

    # Determine Routing
    is_address_change = False
    if "current_address" in changes or "permanent_address" in changes:
        is_address_change = True
        
    if is_address_change:
        verification_stage = "Secretary Verification"
        stage_role = "Secretary"
    else:
        verification_stage = "Coordinator Approval"
        stage_role = "Coordinator"

    req_doc = {
        "family_id": str(family["_id"]),
        "family_unique_id": family.get("family_unique_id"),
        "requester_id": str(current_user["_id"]),
        "requester_name": current_user["name"],
        "target_member_id": target_member_id,
        "changes": changes,
        "reason": update_data.get("reason", ""),
        "status": "Pending",
        "current_stage": verification_stage,
        "assigned_to_role": stage_role,
        "created_at": datetime.utcnow(),
        "history": [{
            "action": "Request Created",
            "by": current_user["name"],
            "date": datetime.utcnow()
        }]
    }
    
    result = await family_update_requests_collection.insert_one(req_doc)
    
    return {"message": "Update request submitted successfully.", "request_id": str(result.inserted_id), "stage": verification_stage}

@router.get("/requests/my-updates", response_model=List[dict])
async def get_my_update_requests(current_user: dict = Depends(get_current_user)):
    family = await families_collection.find_one({"user_id": str(current_user["_id"])})
    if not family:
        return []
        
    cursor = family_update_requests_collection.find({"family_id": str(family["_id"])}).sort("created_at", -1)
    return await cursor.to_list(length=50)

@router.get("/requests/updates/all", response_model=List[dict])
async def get_all_update_requests(current_user: dict = Depends(get_current_user)):
    """
    Get all update requests relevant to the user's role.
    Secretary sees Address changes.
    Coordinator sees General changes.
    Admin sees all.
    """
    role = current_user.get("position") or current_user.get("role")
    query = {}
    
    if role == "Secretary":
        query = {"assigned_to_role": "Secretary", "status": "Pending"}
    elif role == "Coordinator":
        query = {"assigned_to_role": "Coordinator", "status": "Pending"}
    elif role in ["admin", "president", "super_admin"]:
        query = {"status": "Pending"}
    else:
        # If coordinator but role just says 'coordinator' in user record
        if current_user.get("role") == "coordinator":
            query = {"assigned_to_role": "Coordinator", "status": "Pending"}
        else:
            return []
            
    cursor = family_update_requests_collection.find(query).sort("created_at", -1)
    return await cursor.to_list(length=100)

@router.post("/requests/updates/{req_id}/process", response_model=dict)
async def process_update_request(
    req_id: str,
    action: str, # 'Approve' or 'Reject'
    remark: str = Body(None),
    current_user: dict = Depends(get_current_user)
):
    req = await family_update_requests_collection.find_one({"_id": ObjectId(req_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if action == "Reject":
        await family_update_requests_collection.update_one(
            {"_id": ObjectId(req_id)},
            {
                "$set": {"status": "Rejected", "processed_at": datetime.utcnow()},
                "$push": {"history": {
                    "action": "Rejected",
                    "by": current_user["name"],
                    "remark": remark,
                    "date": datetime.utcnow()
                }}
            }
        )
        return {"message": "Request rejected"}
        
    # Approval Logic: Merge changes into family record
    family_id = req["family_id"]
    target_member_id = req["target_member_id"]
    changes = req["changes"]
    
    family = await families_collection.find_one({"_id": ObjectId(family_id)})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
        
    form_data = family.get("form_data")
    data = parse_form_data(form_data)

    if target_member_id == 'HEAD':
        # Update head details
        head = data.get("head_details", {})
        head.update(changes)
        data["head_details"] = head
    else:
        # Update specific member
        members = data.get("members", [])
        for i, m in enumerate(members):
            if m.get("member_id") == target_member_id:
                m.update(changes)
                members[i] = m
                break
        data["members"] = members

    # If it was an address change, update root level too if necessary
    if "current_address" in changes:
        # Update root level address fields if they exist
        addr = changes["current_address"]
        # Maybe handle root level separately if needed
        pass

    # Update Family Document
    log_entry = {
        "stage": req["current_stage"],
        "action": "Profile Updated (Approved Request)",
        "remark": f"Approved by {current_user['name']}. {remark or ''}",
        "by": current_user["name"],
        "role": current_user.get("position") or current_user.get("role"),
        "date": datetime.utcnow()
    }

    if "remarks" not in data: data["remarks"] = []
    data["remarks"].append(log_entry)

    await families_collection.update_one(
        {"_id": ObjectId(family_id)},
        {
            "$set": {
                "form_data": json.dumps(data, default=str)
            },
            "$push": {"remarks": log_entry}
        }
    )
    
    # Mark request as approved
    await family_update_requests_collection.update_one(
        {"_id": ObjectId(req_id)},
        {
            "$set": {"status": "Approved", "processed_at": datetime.utcnow()},
            "$push": {"history": {
                "action": "Approved",
                "by": current_user["name"],
                "remark": remark,
                "date": datetime.utcnow()
            }}
        }
    )
    
    return {"message": "Update request approved and profile updated."}
