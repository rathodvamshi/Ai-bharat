from pydantic import BaseModel
from typing import Optional, Dict, Any

# ==========================
# API REQUEST SCHEMAS
# ==========================

# 1. Matches exactly what the Next.js frontend sends when the mic stops
class VoiceRequest(BaseModel):
    user_id: str
    s3_key: Optional[str] = None
    language: Optional[str] = "hi-IN"
    text: Optional[str] = None

# 2. Dictates what the AI extracts from the user's spoken words
class ExtractedEntities(BaseModel):
    name: Optional[str] = None
    aadhaar: Optional[str] = None
    scheme_name: Optional[str] = None
    address: Optional[str] = None

# 3. Dictates the format for the Dummy Government sandbox submissions
class ApplicationSubmission(BaseModel):
    user_id: str
    scheme_name: str
    application_json: Dict[str, Any]

# 4. Auth & User Profile Schemas
class PhoneCheck(BaseModel):
    phone: str

class LoginRequest(BaseModel):
    phone: str
    password: str

class RegisterRequest(BaseModel):
    phone: str
    password: str
    name: Optional[str] = ""

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    land: Optional[str] = None
    profile_image: Optional[str] = None

class PhoneUpdate(BaseModel):
    current_password: str
    new_phone: str
