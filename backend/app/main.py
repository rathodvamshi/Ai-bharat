from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from uuid import uuid4
import os
import time

from .config import mock_applications_db, S3_BUCKET_NAME
from .aws_client import synthesize_speech, users_table
from .services.bedrock_service import ask_didi_bedrock
from .schemas import (
    TextRequest, ApplicationSubmission, PhoneCheck, 
    LoginRequest, RegisterRequest, ProfileUpdate, PhoneUpdate
)
from passlib.context import CryptContext

app = FastAPI(
    title="Jan-Sahayak API",
    version="2.0.0",
    description="Voice-First Government Scheme Assistant — with Web Speech API STT"
)

# ==========================
# CORS & FOLDER SETUP
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
os.makedirs("temp_audio", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_phone(phone: str):
    response = users_table.query(
        IndexName='PhoneIndex',
        KeyConditionExpression="phone = :p",
        ExpressionAttributeValues={":p": phone}
    )
    items = response.get('Items', [])
    return items[0] if items else None

# ==========================
# IN-MEMORY SESSION STORE
# ==========================
user_sessions = {}


# ==========================
# HEALTH CHECK
# ==========================
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "services": {
            "bedrock": "connected",
            "polly": "connected",
            "transcribe": "NOT_SUBSCRIBED — using Web Speech API instead",
            "s3": "connected"
        }
    }


# ==========================
# PRIMARY ENDPOINT: TEXT INPUT FROM BROWSER STT
# This is called AFTER the browser does Speech-to-Text via Web Speech API
# ==========================
class TextRequest(BaseModel):
    text: str
    user_id: str = "9876543210"
    language: str = "hi-IN"


@app.post("/api/v1/process-text")
async def process_text(req: TextRequest):
    """
    Receives text (already transcribed by browser Web Speech API).
    Runs it through Bedrock Knowledge Base (Didi AI) + Polly TTS.
    Returns: AI speech text + audio URL + extracted form data.
    """
    citizen_question = req.text.strip()
    if not citizen_question:
        raise HTTPException(status_code=400, detail="Text input cannot be empty")

    print(f"\n--- NEW TEXT REQUEST ---")
    print(f"User [{req.user_id}] says: {citizen_question}")
    print(f"Language: {req.language}")

    # Step 1: Send to Bedrock (Didi AI State Machine via Knowledge Base)
    current_session_id = user_sessions.get(req.user_id)
    try:
        bedrock_result = ask_didi_bedrock(citizen_question, current_session_id)
    except Exception as e:
        print(f"Bedrock call failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    ai_data = bedrock_result["ai_data"]
    new_session_id = bedrock_result["session_id"]
    user_sessions[req.user_id] = new_session_id

    speech_text = ai_data.get("speech_response", "Mujhe samajhne mein thodi dikkat ho rahi hai. Kripya phir se bolein.")
    extracted_info = ai_data.get("extracted_data", {})
    is_ready_to_submit = ai_data.get("is_ready_to_submit", False)
    current_state = ai_data.get("current_state", "Explore")

    print(f"Didi State: {current_state}")
    print(f"Didi says: {speech_text}")
    print(f"Extracted: {extracted_info}")
    print(f"Ready to Submit: {is_ready_to_submit}")

    # Step 2: Update mock DB
    if req.user_id not in mock_applications_db:
        mock_applications_db[req.user_id] = {
            "id": f"APP-{uuid4().hex[:6].upper()}",
            "user_id": req.user_id,
            "status": "In Progress",
            "timestamp": time.time(),
            "form_data": {}
        }

    # Merge only non-null extracted values
    if extracted_info:
        for k, v in extracted_info.items():
            if v is not None and str(v).strip() not in ("", "null", "None"):
                mock_applications_db[req.user_id]["form_data"][k] = v

    if is_ready_to_submit:
        mock_applications_db[req.user_id]["status"] = "Submitted"
        print(f"✅ Application submitted for user {req.user_id}")

    # Step 3: AWS Polly TTS
    audio_url = None
    try:
        # Choose Polly voice based on language
        voice_map = {
            "hi-IN": "Aditi",   # Hindi female
            "te-IN": "Aditi",   # Telugu (Aditi supports hi/te via neural)
            "en-IN": "Aditi",
            "en-US": "Joanna",
        }
        voice_id = voice_map.get(req.language, "Aditi")

        mp3_audio_bytes = synthesize_speech(speech_text, voice_id=voice_id)
        audio_filename = f"response_{req.user_id}_{uuid4().hex[:6]}.mp3"
        audio_path = f"static/{audio_filename}"
        with open(audio_path, "wb") as f:
            f.write(mp3_audio_bytes)
        audio_url = f"/static/{audio_filename}"
        print(f"Polly audio saved: {audio_filename} ({len(mp3_audio_bytes)} bytes)")
    except Exception as e:
        print(f"⚠️ Polly TTS Error: {e}")
        audio_url = None  # Graceful degradation — text still shown

    return {
        "status": "success",
        "ai_response": speech_text,
        "audio_url": audio_url,
        "extracted_data": mock_applications_db[req.user_id]["form_data"],
        "application_status": mock_applications_db[req.user_id]["status"],
        "current_state": current_state,
        "is_ready_to_submit": is_ready_to_submit,
        "transcribed_text": citizen_question,  # Echo back what was understood
    }


# ==========================
# LEGACY ENDPOINT: Audio file upload (kept for compatibility)
# Now also accepts transcribed_text form field for Web Speech API flow
# ==========================
@app.post("/api/v1/process-voice")
async def process_voice(
    audio_file: UploadFile = File(None),
    transcribed_text: str = Form(None),
    user_id: str = Form("9876543210"),
    language: str = Form("hi-IN")
):
    """
    Legacy voice endpoint. Now accepts transcribed_text from browser Web Speech API.
    Falls back to a helpful error if no text and no transcribe subscription.
    """
    # If browser already transcribed the speech
    if transcribed_text and transcribed_text.strip():
        citizen_question = transcribed_text.strip()
        print(f"\n--- VOICE ENDPOINT (with transcribed text) ---")
        print(f"User [{user_id}]: {citizen_question}")
    else:
        # Old bypass: no real transcription available
        print(f"\n--- VOICE ENDPOINT (no transcription — Web Speech API not used) ---")
        citizen_question = "मुझे PM SVANidhi के बारे में बताएं"  # Default fallback
        print(f"Using default question: {citizen_question}")

    # Save audio file if provided (for logging/replay purposes)
    if audio_file and audio_file.filename:
        temp_path = f"temp_audio/{uuid4().hex}_{audio_file.filename}"
        try:
            content = await audio_file.read()
            with open(temp_path, "wb") as buffer:
                buffer.write(content)
            print(f"Audio saved to {temp_path} ({len(content)} bytes)")
        except Exception:
            pass

    # Delegate to the text processing logic
    req = TextRequest(text=citizen_question, user_id=user_id, language=language)
    return await process_text(req)


# ==========================
# ADMIN ROUTES — Dummy Gov Sandbox
# ==========================
@app.get("/api/v1/dummy-gov/applications")
def get_all_applications():
    apps = list(mock_applications_db.values())
    return {"applications": apps, "total": len(apps)}


@app.put("/api/v1/dummy-gov/applications/{application_id}/approve")
def approve_application(application_id: str):
    for key, app_data in mock_applications_db.items():
        if app_data.get("id") == application_id or key == application_id:
            mock_applications_db[key]["status"] = "Approved"
            print(f"✅ Application {application_id} APPROVED")
            return {"status": "success", "application_id": application_id}
    raise HTTPException(status_code=404, detail="Application Not Found")

# ==========================
# AUTHENTICATION & PROFILE
# ==========================

@app.post("/api/auth/check-user")
async def check_user(req: PhoneCheck):
    user = get_user_by_phone(req.phone)
    return {"exists": user is not None}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = get_user_by_phone(req.phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(req.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    return {
        "success": True,
        "token": f"dummy_jwt_{uuid4().hex}",
        "user_id": user['user_id'],
        "phone": user['phone'],
        "name": user.get('name')
    }

@app.post("/api/auth/signup")
async def signup(req: RegisterRequest):
    # Check if number exists
    if get_user_by_phone(req.phone):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    user_id = str(uuid4())
    user_data = {
        "user_id": user_id,
        "phone": req.phone,
        "password_hash": get_password_hash(req.password),
        "name": req.name,
        "created_at": int(time.time()),
        "village": "",
        "district": "",
        "land": "",
        "profile_image": ""
    }
    
    users_table.put_item(Item=user_data)
    return {"success": True, "user_id": user_id}

@app.get("/api/v1/user/profile/{user_id}")
async def get_profile(user_id: str):
    response = users_table.get_item(Key={'user_id': user_id})
    user = response.get('Item')
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't return password hash
    del user['password_hash']
    return user

@app.put("/api/v1/user/profile/{user_id}")
async def update_profile(user_id: str, req: ProfileUpdate):
    # Construct update expression
    update_expression = "SET "
    expression_attribute_values = {}
    
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        return {"status": "no updates"}
    
    for i, (key, value) in enumerate(updates.items()):
        update_expression += f"{key} = :v{i}, "
        expression_attribute_values[f":v{i}"] = value
    
    update_expression = update_expression.rstrip(", ")
    
    users_table.update_item(
        Key={'user_id': user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values
    )
    return {"status": "success"}

@app.post("/api/v1/user/update-phone/{user_id}")
async def update_phone(user_id: str, req: PhoneUpdate):
    response = users_table.get_item(Key={'user_id': user_id})
    user = response.get('Item')
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(req.current_password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check if NEW phone is already taken
    if get_user_by_phone(req.new_phone):
        raise HTTPException(status_code=400, detail="New phone number already in use")
    
    users_table.update_item(
        Key={'user_id': user_id},
        UpdateExpression="SET phone = :p",
        ExpressionAttributeValues={":p": req.new_phone}
    )
    return {"status": "success"}


class RejectPayload(BaseModel):
    reason: str


@app.put("/api/v1/dummy-gov/applications/{application_id}/reject")
def reject_application(application_id: str, payload: RejectPayload):
    for key, app_data in mock_applications_db.items():
        if app_data.get("id") == application_id or key == application_id:
            mock_applications_db[key]["status"] = "Rejected"
            mock_applications_db[key]["rejection_reason"] = payload.reason
            print(f"❌ Application {application_id} REJECTED: {payload.reason}")
            return {"status": "success", "application_id": application_id}
    raise HTTPException(status_code=404, detail="Application Not Found")