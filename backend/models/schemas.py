from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import List, Optional
from datetime import datetime, date
from typing_extensions import Annotated

# Helper to handle ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

# --- Shared Enumerations/Models ---
class Address(BaseModel):
    house_no: str
    locality: str
    village_town_city: str
    post_office: str
    police_station: Optional[str] = None
    block_tehsil: str
    district: str
    state: str
    pin_code: str
    landmark: Optional[str] = None

class EducationDetail(BaseModel):
    level: str # e.g. 10th, 12th, Graduation
    board_university: str
    year: str
    result: str # Percentage/CGPA

class MemberDetails(BaseModel):
    full_name: str
    full_name_hindi: Optional[str] = None
    father_husband_name: Optional[str] = None
    father_husband_name_hindi: Optional[str] = None
    relation: str
    gender: str
    dob: str # YYYY-MM-DD
    marital_status: str
    
    # Education
    education_level: Optional[str] = None # Current/Highest broadly
    education_school_college: Optional[str] = None
    education_class: Optional[str] = None
    education_history: List[EducationDetail] = []
    needs_scholarship: bool = False
    
    # Occupation
    occupation: str 
    occupation_type: Optional[str] = None
    occupation_sector: Optional[str] = None
    designation: Optional[str] = None
    
    # Contact & ID
    mobile: Optional[str] = None
    aadhaar: Optional[str] = None
    blood_group: Optional[str] = None
    
    # Health
    is_specially_abled: bool = False
    special_ability_details: Optional[str] = None
    has_serious_illness: bool = False
    illness_details: Optional[str] = None
    
    is_head: bool = False
    
    # New Functional Fields
    qualifications: List[str] = []
    specialization_courses: List[str] = []
    skills: List[str] = []

class FamilyHead(BaseModel):
    full_name: str
    full_name_hindi: Optional[str] = None
    father_name: str
    father_name_hindi: Optional[str] = None
    gender: str
    dob: str
    marital_status: str
    blood_group: Optional[str] = None
    
    # Contact
    mobile: str
    whatsapp: Optional[str] = None
    mobile_alt: Optional[str] = None
    email: Optional[str] = None
    aadhaar: Optional[str] = None
    
    # Family Details
    family_type: Optional[str] = "Nuclear" # Joint, Nuclear
    
    # Occupation
    occupation: str
    occupation_category: Optional[str] = None
    designation: Optional[str] = None
    organization: Optional[str] = None
    sector: Optional[str] = None
    income_range: Optional[str] = "Not Specified"
    
    # Nominee & Emergency
    nominee_name: Optional[str] = None
    nominee_relation: Optional[str] = None
    nominee_mobile: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_number: Optional[str] = None
    
    # New Functional Fields
    education_history: List[EducationDetail] = []
    qualifications: List[str] = []
    specialization_courses: List[str] = []
    skills: List[str] = []

class NomineeItem(BaseModel):
    is_family_member: bool = True
    selected_member_id: Optional[str] = None
    full_name: str
    relation: str
    relation_other: Optional[str] = None
    mobile: Optional[str] = None
    dob: Optional[str] = None
    share_percentage: float

class NomineeDetails(BaseModel):
    nominees: List[NomineeItem] = []
    emergency_name: Optional[str] = None
    emergency_mobile: Optional[str] = None

class Declarations(BaseModel):
    head_declared: bool = False
    member_declared: bool = False
    terms_accepted: bool = False

class FamilyRegistration(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    # Part 1: Head
    head_details: FamilyHead
    # Part 2: Address
    current_address: Address
    permanent_address: Address
    same_as_permanent: bool = False
    # Part 3: Nominee
    nominee_details: Optional[NomineeDetails] = None
    # Part 4: Members
    members: List[MemberDetails] = []
    # Part 5: Submission
    declarations: Optional[Declarations] = None
    
    # Metadata
    status: str = "Pending"
    verification_stage: str = "Coordinator Scrutiny"
    created_at: datetime = datetime.now()
    user_id: Optional[str] = None
    join_method: str = "Direct"
    recommendation_token: Optional[str] = None
    recommender_id: Optional[str] = None
    recommender_name: Optional[str] = None
    coordinator_id: Optional[str] = None
    coordinator_name: Optional[str] = None
    family_unique_id: Optional[str] = None
    pending_members: List[dict] = []

class UserBase(BaseModel):
    name: str
    phone: str
    role: str = "member"
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str
    recommendation_token: Optional[str] = None
    community_id: Optional[str] = None  # ID of the community to join

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str
    is_active: bool = True
    created_at: datetime = datetime.now()

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# --- New Module Schemas ---

class AssistanceCreate(BaseModel):
    request_type: str
    amount_requested: float
    description: str
    request_on_behalf_of: Optional[str] = None # Family ID/Unique ID if elevated user
    attachments: List[str] = [] # URLs/Paths to proof files

class AssistanceResponse(AssistanceCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    family_id: Optional[str] = None
    requester_role: Optional[str] = None # Who requested it
    status: str
    created_at: datetime
    attachments: List[str] = []
    
    class Config:
        populate_by_name = True
        from_attributes = True

class ContributionCreate(BaseModel):
    amount: float
    payment_type: str # Monthly, Donation

class ContributionResponse(ContributionCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    family_id: Optional[str] = None
    payment_date: datetime
    status: str
    
    class Config:
        populate_by_name = True
        from_attributes = True

class NoticeCreate(BaseModel):
    title: str
    content: str
    category: str = "General"
    priority: str = "normal" # low, normal, high, urgent
    type: str = "info" # info, warning, success, danger
    icon: Optional[str] = None
    visible_to: List[str] = ["all"] # committee, family_head, family_member, president, etc.
    is_active: bool = True
    scheduled_at: Optional[datetime] = None

class NoticeResponse(NoticeCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime
    created_by_name: Optional[str] = None
    
    class Config:
        populate_by_name = True
        from_attributes = True

class RuleSection(BaseModel):
    section_id: str
    title: str
    content: str

class RuleChapter(BaseModel):
    chapter_id: int
    title: str
    sections: List[RuleSection]

class RuleBook(BaseModel):
    chapters: List[RuleChapter]
    updated_at: datetime = datetime.now()

class RuleUpdate(BaseModel):
    text: Optional[str] = None
    text_hi: Optional[str] = None
    text_en: Optional[str] = None
    structured: Optional[List[dict]] = None

class RecommendationCreate(BaseModel):
    new_head_name: str
    father_name: str
    mobile: str
    email: Optional[str] = None

class MemberAddRequest(BaseModel):
    member: MemberDetails
    family_id: str
    request_id: str
    verification_stage: str # Coordinator Scrutiny, Committee Approval
    status: str
    created_at: datetime

class CollectionCampaignCreate(BaseModel):
    assistance_request_id: str
    target_amount: float
    title: str
    description: str
    upi_id: str
    qr_code_url: Optional[str] = None
    account_holder: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None

class CollectionCampaignResponse(CollectionCampaignCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    status: str # Active, Completed, Cancelled
    collected_amount: float = 0.0
    created_at: datetime
    created_by: str # User ID

    class Config:
        populate_by_name = True
        from_attributes = True

class ContributionProofCreate(BaseModel):
    campaign_id: str
    amount: float
    transaction_id: Optional[str] = None
    screenshot_url: str
    remarks: Optional[str] = None

class ContributionProofResponse(ContributionProofCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    family_id: str
    head_name: str
    status: str # Pending, Verified, Rejected
    submitted_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True

