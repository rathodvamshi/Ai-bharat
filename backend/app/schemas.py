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

# ==========================
# AUTH SCHEMAS
# ==========================

class CheckPhoneRequest(BaseModel):
    phone: str

class SignupRequest(BaseModel):
    phone: str
    password: str
    name: str

class LoginRequest(BaseModel):
    phone: str
    password: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    land: Optional[str] = None
    profile_image: Optional[str] = None

class UpdatePhoneRequest(BaseModel):
    current_password: str
    new_phone: str