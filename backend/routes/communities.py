from fastapi import APIRouter, HTTPException, Query
from database import communities_collection
from pydantic import BaseModel
from typing import List, Optional
import datetime
from bson import ObjectId
import uuid

router = APIRouter()

class CommunityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    # Address fields
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    objectives: Optional[str] = None
    rules_json: Optional[dict] = None
    # Professional Fields
    registration_number: Optional[str] = None
    foundation_date: Optional[str] = None
    approx_families: Optional[int] = None
    logo_url: Optional[str] = None
    # Initial Admin Setup
    admin_phone: Optional[str] = None
    admin_password: Optional[str] = None
    admin_name: Optional[str] = None

class CommunityResponse(BaseModel):
    id: str
    name: str
    slug: str
    society_code: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    objectives: Optional[str] = None
    rules_json: Optional[dict] = None
    is_active: bool
    created_at: datetime.datetime

def serialize_doc(doc):
    result = dict(doc)
    result["id"] = str(result.pop("_id"))
    # Ensure all optional fields exist
    optional_fields = ["description", "contact_email", "contact_phone", "address", "city", "state", "pincode", "objectives"]
    for field in optional_fields:
        if field not in result:
            result[field] = None
    if "rules_json" not in result:
        result["rules_json"] = {}
    return result

def make_slug(name: str) -> str:
    return name.lower().strip().replace(" ", "-")

async def generate_society_code(name: str) -> str:
    """
    Create a short unique code from community name initials.
    Example: 'Jagdamba Samiti'  -> 'JGSA'
             'Green Meadows RWA' -> 'GMRW'
    Ensures uniqueness by appending a number suffix if needed.
    """
    words = [w for w in name.strip().split() if w]
    code_chars = ''.join([w[:2].upper() for w in words[:4]])
    code = code_chars[:6] or "SOC"

    base_code = code
    suffix = 1
    while await communities_collection.find_one({"society_code": code}):
        code = f"{base_code}{suffix}"
        suffix += 1
    return code

# ─── Routes ────────────────────────────────────────────────────────────────────

@router.get("/search", response_model=CommunityResponse)
async def search_by_code(code: str = Query(..., description="Society code e.g. JGSA")):
    """Search for a community by its unique society code (case-insensitive)."""
    comm = await communities_collection.find_one({
        "society_code": {"$regex": f"^{code.strip().upper()}$", "$options": "i"},
        "is_active": True
    })
    if not comm:
        raise HTTPException(status_code=404, detail=f"No active society found with code '{code.upper()}'. Please check and try again.")
    return serialize_doc(comm)

@router.post("/register", response_model=CommunityResponse)
async def register_community(community: CommunityCreate):
    slug = make_slug(community.name)

    existing = await communities_collection.find_one({"slug": slug})
    if existing:
        unique_suffix = uuid.uuid4().hex[:6]
        slug = f"{slug}-{unique_suffix}"

    society_code = await generate_society_code(community.name)

    new_comm = {
        "name": community.name,
        "slug": slug,
        "society_code": society_code,
        "description": community.description,
        "contact_email": community.contact_email,
        "contact_phone": community.contact_phone,
        "address": community.address,
        "city": community.city,
        "state": community.state,
        "pincode": community.pincode,
        "objectives": community.objectives or "Promoting community welfare and transparency.",
        "rules_json": community.rules_json or {},
        "registration_number": community.registration_number,
        "foundation_date": community.foundation_date,
        "approx_families": community.approx_families,
        "logo_url": community.logo_url,
        "is_active": True,
        "created_at": datetime.datetime.utcnow()
    }

    res = await communities_collection.insert_one(new_comm)
    new_comm["_id"] = res.inserted_id
    
    # Automatic Admin Provisioning
    if community.admin_phone and community.admin_password:
        from database import users_collection
        from utils.security import get_password_hash
        
        admin_user = {
            "full_name": community.admin_name or f"{community.name} Admin",
            "phone": community.admin_phone,
            "password": get_password_hash(community.admin_password),
            "role": "super_admin",
            "is_founder": True,
            "is_active_committee": True,
            "community_id": str(new_comm["_id"]),
            "community_name": community.name,
            "status": "Active",
            "created_at": datetime.datetime.utcnow()
        }
        await users_collection.insert_one(admin_user)
        
    return serialize_doc(new_comm)

@router.get("/", response_model=List[CommunityResponse])
async def list_communities():
    """Public endpoint — returns all active communities."""
    cursor = communities_collection.find({"is_active": True})
    communities = await cursor.to_list(length=200)
    return [serialize_doc(c) for c in communities]

@router.get("/{slug_or_id}", response_model=CommunityResponse)
async def get_community(slug_or_id: str):
    # Try finding by ID first
    try:
        if len(slug_or_id) == 24: # Likely ObjectId
            comm = await communities_collection.find_one({"_id": ObjectId(slug_or_id)})
            if comm: return serialize_doc(comm)
    except: pass
    
    # Otherwise try by slug
    comm = await communities_collection.find_one({"slug": slug_or_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    return serialize_doc(comm)

@router.get("/code/{code}", response_model=CommunityResponse)
async def get_community_by_code(code: str):
    """Fetch community details by society code."""
    comm = await communities_collection.find_one({"society_code": code.upper()})
    if not comm:
        raise HTTPException(status_code=404, detail="Community code failed")
    return serialize_doc(comm)
