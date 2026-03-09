"""
main.py — FastAPI application entry point for Jan-Sahayak.

Key responsibilities:
  • Receive citizen voice uploads, transcribe, run through Didi AI, return response.
  • Persist every data update immediately to database.json via database.py.
  • Expose admin sandbox endpoints for reviewing/approving/rejecting applications.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Any
from uuid import uuid4
from datetime import datetime
import os
import time
import logging
import hashlib
import secrets

from .config import S3_BUCKET_NAME, KNOWLEDGE_BASE_ID, AWS_REGION, BEDROCK_KB_MODEL_ARN
from .aws_client import synthesize_speech, transcribe_audio
from .services.bedrock_service import ask_didi_bedrock, retrieve_from_knowledge_base
from .database import load_db, save_db, get_db, add_conversation_message, get_conversation_history, get_last_scheme_context, get_pending_applications, get_application, update_application_status, get_user_applications
from .schemas import (
    CheckPhoneRequest, SignupRequest, LoginRequest,
    UpdateProfileRequest, UpdatePhoneRequest
)

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# App bootstrap
# ──────────────────────────────────────────────
app = FastAPI(title="Jan-Sahayak API", version="1.0.0")

# Load persistent DB on startup
@app.on_event("startup")
def startup_event():
    load_db()
    logger.info("Database loaded. Records: %d", len(get_db()))
    if KNOWLEDGE_BASE_ID:
        logger.info(
            "Bedrock KB: id=%s region=%s model=%s",
            KNOWLEDGE_BASE_ID,
            AWS_REGION,
            BEDROCK_KB_MODEL_ARN.split("/")[-1] if "/" in BEDROCK_KB_MODEL_ARN else "?",
        )

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Static file folders
# ──────────────────────────────────────────────
for folder in ("static", "temp_audio"):
    os.makedirs(folder, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")



# ══════════════════════════════════════════════
# GREETING ENDPOINT (called on page load)
# ══════════════════════════════════════════════
GREET_TEXT = (
    "Namaste! I am Didi — your government scheme assistant. "
    "I help you check eligibility and apply for government schemes like "
    "PM-Kisan, Ayushman Bharat, Pradhan Mantri Awas, and more. "
    "Would you like to know about schemes, apply for a scheme, or check application status?"
)

@app.get("/api/v1/test-knowledge-base")
def test_knowledge_base(query: str = "What are the requirements for PM-Kisan scheme?"):
    """
    Direct test of Bedrock Knowledge Base (jansahayak-kb).
    Use this to verify RAG connection: GET /api/v1/test-knowledge-base?query=PM+Kisan
    """
    if not KNOWLEDGE_BASE_ID:
        return {
            "status": "error",
            "message": "KNOWLEDGE_BASE_ID not configured in .env",
            "config": {"AWS_REGION": AWS_REGION},
        }
    try:
        result = retrieve_from_knowledge_base(query)
        if result:
            return {
                "status": "success",
                "query": query,
                "answer": result.get("answer", ""),
                "citations_count": len(result.get("citations", [])),
                "config": {
                    "knowledge_base_id": KNOWLEDGE_BASE_ID,
                    "region": AWS_REGION,
                    "model": BEDROCK_KB_MODEL_ARN.split("/")[-1] if "/" in BEDROCK_KB_MODEL_ARN else "unknown",
                },
            }
        return {
            "status": "empty",
            "message": "Knowledge base returned no answer (check logs for errors)",
            "query": query,
            "config": {"knowledge_base_id": KNOWLEDGE_BASE_ID, "region": AWS_REGION},
        }
    except Exception as exc:
        logger.exception("test-knowledge-base error: %s", exc)
        return {
            "status": "error",
            "message": str(exc),
            "query": query,
            "config": {"knowledge_base_id": KNOWLEDGE_BASE_ID, "region": AWS_REGION},
        }


@app.get("/api/v1/greet")
def greet():
    """
    Returns Didi's welcome audio. Called once when the frontend loads.
    No auth required — this is purely a TTS call to play the opening prompt.
    """
    try:
        mp3_bytes = synthesize_speech(GREET_TEXT)
        filename = f"greet_{uuid4().hex[:8]}.mp3"
        with open(f"static/{filename}", "wb") as f:
            f.write(mp3_bytes)
        return {"speech": GREET_TEXT, "audio_url": f"/static/{filename}"}
    except Exception as exc:
        logger.error("Greet TTS error: %s", exc)
        return {"speech": GREET_TEXT, "audio_url": None}


# ══════════════════════════════════════════════
# CITIZEN VOICE ENDPOINT
# ══════════════════════════════════════════════
@app.post("/api/v1/process-voice")
async def process_voice(
    audio_file: UploadFile = File(...),
    user_id: str = Form(...),          # Browser session/device fingerprint (not the real user ID)
    language: str = Form("hi-IN"),
):
    """
    Full pipeline:
      audio → Groq Whisper → Bedrock Didi → Polly TTS → JSON response
    """
    temp_path = f"temp_audio/{uuid4().hex}_{audio_file.filename}"
    try:
        # ── 1. Save upload ──────────────────────
        with open(temp_path, "wb") as buf:
            buf.write(await audio_file.read())

        # ── 2. Transcribe ───────────────────────
        try:
            citizen_text = transcribe_audio(temp_path)
            logger.info("Transcription: %r", citizen_text)
            if not citizen_text or len(citizen_text.strip()) < 2:
                raise ValueError("Empty transcription")
        except Exception as exc:
            logger.warning("Transcription failed: %s", exc)
            return _error_response("मुझे ठीक से सुनाई नहीं दिया। कृपया फिर से बोलें।")

        # ── 3. Didi AI (state machine + Bedrock) ─
        device_id = user_id.strip()
        bedrock_result = ask_didi_bedrock(citizen_text, device_id)

        ai_data          = bedrock_result["ai_data"]
        composite_id     = bedrock_result["composite_user_id"]
        show_form        = bedrock_result.get("show_form", False)
        speech_text      = ai_data.get("speech_response", "")
        extracted_info   = ai_data.get("extracted_data", {})
        is_ready         = ai_data.get("is_ready_to_submit", False)

        logger.info("Composite ID: %s | Extracted: %s", composite_id, extracted_info)

        # ── 4. Persist to database ──────────────
        db = get_db()
        active_form_data = {}
        application_status = "Authenticating..."

        if composite_id:
            if composite_id not in db:
                db[composite_id] = {
                    "id": f"APP-{uuid4().hex[:6].upper()}",
                    "user_id": composite_id,
                    "status": "In Progress",
                    "created_at": time.time(),
                    "updated_at": time.time(),
                    "form_data": {},
                }

            record = db[composite_id]

            if extracted_info:
                # .update() naturally OVERWRITES — this is Phase 4's correction fix
                record["form_data"].update(extracted_info)
                record["updated_at"] = time.time()

            if is_ready:
                record["status"] = "Submitted"
                logger.info("✅ Form submitted for %s", composite_id)

            # Persist to disk immediately after every mutation
            save_db()

            active_form_data   = record["form_data"]
            application_status = record["status"]

        # ── 5. Text-to-Speech ───────────────────
        audio_url = None
        try:
            mp3_bytes      = synthesize_speech(speech_text)
            audio_filename = f"response_{uuid4().hex[:8]}.mp3"
            with open(f"static/{audio_filename}", "wb") as f:
                f.write(mp3_bytes)
            audio_url = f"/static/{audio_filename}"
        except Exception as exc:
            logger.error("Polly TTS error: %s", exc)

        return {
            "status": "success",
            "ai_response": speech_text,
            "audio_url": audio_url,
            "extracted_data": active_form_data,
            "application_status": application_status,
            "show_form": show_form,
        }

    finally:
        # Always clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


def _error_response(message: str) -> dict:
    return {
        "status": "error",
        "ai_response": message,
        "audio_url": None,
        "extracted_data": {},
        "application_status": "Error",
    }


# ══════════════════════════════════════════════
# TEXT CHAT ENDPOINT (for typing / voice → text flow)
# ══════════════════════════════════════════════
class ProcessTextRequest(BaseModel):
    text: str
    user_id: str = "anonymous"
    language: str = "hi-IN"
    eligibility_answer: Optional[Any] = None
    form_field_value: Optional[str] = None
    document_uploaded: bool = False
    document_id: Optional[str] = None
    reset_session: bool = False


@app.post("/api/v1/process-text")
async def process_text(payload: ProcessTextRequest):
    """
    Process typed or transcribed text through Didi (Bedrock + RAG).
    Supports eligibility-first flow with eligibility_answer and form_field_value.
    Maintains conversation history per user_id for context awareness.
    Returns ai_response, ai_data (with action), and optional audio_url.
    """
    text = (payload.text or "").strip()
    if not text or len(text) < 1:
        return {
            "status": "error",
            "ai_response": "Please enter a message.",
            "ai_data": {},
            "audio_url": None,
        }

    device_id = (payload.user_id or "anonymous").strip() or "anonymous"
    
    if payload.reset_session:
        from .services.bedrock_service import reset_session
        reset_session(device_id)
        # We don't clear DB history, just the active runtime session
        # This allows "Starting New" while keeping the log of what happened before
    
    try:
        # Get conversation history and last scheme context for this user
        conv_history = get_conversation_history(device_id, limit=10)
        last_scheme = get_last_scheme_context(device_id)
        
        # Pass eligibility answer or form field value if provided
        bedrock_result = ask_didi_bedrock(
            text, 
            device_id,
            conversation_history=conv_history,
            last_scheme=last_scheme,
            eligibility_answer=payload.eligibility_answer,
            form_field_value=payload.form_field_value,
            document_uploaded=payload.document_uploaded,
            document_id=payload.document_id
        )
        ai_data = bedrock_result.get("ai_data", {})
        speech_text = ai_data.get("speech_response", "")

        # Store user message and assistant response in conversation history
        add_conversation_message(
            user_id=device_id,
            role="user",
            text=text,
            action=None,
            scheme=last_scheme
        )
        add_conversation_message(
            user_id=device_id,
            role="assistant",
            text=speech_text,
            action=ai_data.get("action"),
            scheme=ai_data.get("scheme_id")
        )
        save_db()

        logger.info("[process-text] device=%s action=%s", device_id, ai_data.get("action"))

        audio_url = None
        try:
            if speech_text:
                mp3_bytes = synthesize_speech(speech_text)
                audio_filename = f"response_{uuid4().hex[:8]}.mp3"
                with open(f"static/{audio_filename}", "wb") as f:
                    f.write(mp3_bytes)
                audio_url = f"/static/{audio_filename}"
        except Exception as exc:
            logger.warning("Polly TTS in process-text: %s", exc)

        return {
            "status": "success",
            "ai_response": speech_text,
            "ai_data": ai_data,
            "audio_url": audio_url,
            "transcribed_text": text,
            "history": conv_history + [{
                "role": "assistant",
                "text": speech_text,
                "action": ai_data.get("action"),
                "scheme": ai_data.get("scheme_id")
            }]
        }
    except Exception as exc:
        logger.exception("process-text error: %s", exc)
        return {
            "status": "error",
            "ai_response": "मुझे समस्या आई। कृपया फिर से कोशिश करें। (Something went wrong — please try again.)",
            "ai_data": {},
            "audio_url": None,
        }

@app.post("/api/v1/reset-session")
async def reset_session_endpoint(payload: dict):
    """Explicitly reset the AI session state for a user."""
    user_id = payload.get("user_id", "anonymous")
    from .services.bedrock_service import reset_session
    reset_session(user_id)
    return {"status": "success", "message": "Session reset"}

@app.get("/api/v1/conversation-history/{user_id}")
async def get_history_endpoint(user_id: str):
    """Retrieve full conversation history for a user to rebuild frontend state."""
    history = get_conversation_history(user_id, limit=50)
    return {"status": "success", "history": history}
# Document Upload Endpoint (legacy — keeps backward compat)
@app.post("/api/v1/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    user_id: str = Form(...),
):
    """
    Handle document uploads during application process.
    Returns ai_response and a file_url for the uploaded document.
    """
    try:
        from .services.bedrock_service import handle_document_upload

        # Read and save file
        file_content = await file.read()
        safe_name = f"{uuid4().hex[:8]}_{file.filename}"
        save_path = f"static/{safe_name}"
        with open(save_path, "wb") as f:
            f.write(file_content)
        file_url = f"/static/{safe_name}"

        file_info = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(file_content),
            "uploaded_at": datetime.now().isoformat(),
            "url": file_url,
        }

        result = handle_document_upload(
            device_id=user_id,
            document_id=document_id,
            file_info=file_info
        )

        ai_data = result.get("ai_data", {})
        speech_text = ai_data.get("speech_response", "")

        return {
            "status": "success",
            "ai_response": speech_text,
            "ai_data": ai_data,
            "file_url": file_url,
        }
    except Exception as exc:
        logger.exception("upload-document error: %s", exc)
        return {
            "status": "error",
            "ai_response": "Document upload failed. Please try again.",
            "ai_data": {},
        }


# New clean upload endpoint — returns a URL for the frontend to merge into form_data
@app.post("/api/v1/upload")
async def upload_file(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    user_id: str = Form(...),
):
    """
    Upload a document file and return a URL.
    Frontend should merge {document_id: url} into collected_data and re-send via process-text.
    """
    try:
        file_content = await file.read()
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        safe_name = f"{uuid4().hex[:8]}_{file.filename.replace(' ', '_')}"
        save_path = f"static/{safe_name}"
        with open(save_path, "wb") as f:
            f.write(file_content)

        file_url = f"/static/{safe_name}"
        logger.info("Uploaded %s for user=%s doc=%s → %s", file.filename, user_id, document_id, file_url)

        return {
            "status": "success",
            "document_id": document_id,
            "file_url": file_url,
            "filename": file.filename,
            "size": len(file_content),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("upload error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")



# ══════════════════════════════════════════════
# DUMMY-GOV SANDBOX ENDPOINTS (Admin Dashboard)
# No auth required — sandbox only
# ══════════════════════════════════════════════

@app.get("/api/v1/dummy-gov/applications")
def get_all_applications():
    """Return all applications for the admin sandbox dashboard."""
    db = get_db()
    apps_dict = db.get("applications", {})
    result = []
    for app_val in apps_dict.values():
        # Also expose any legacy top-level records (non-dict keys)
        if isinstance(app_val, dict) and app_val.get("application_id"):
            result.append(app_val)
    # Fallback: include legacy top-level records that have an 'id' field
    for key, val in db.items():
        if key not in ("conversations", "users", "applications") and isinstance(val, dict) and val.get("id"):
            result.append(val)
    return {"applications": result}


class RejectPayload(BaseModel):
    reason: str


@app.put("/api/v1/dummy-gov/applications/{application_id}/approve")
def dummy_approve_application(application_id: str):
    """Sandbox: Approve an application (no admin auth required)."""
    db = get_db()
    # Try structured applications dict first
    apps = db.get("applications", {})
    if application_id in apps:
        apps[application_id]["status"] = "Approved"
        save_db()
        return {"status": "success", "application_id": application_id}
    # Fallback: legacy top-level record
    record = _find_record(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="Application not found")
    record["status"] = "Approved"
    save_db()
    return {"status": "success", "application_id": application_id}


@app.put("/api/v1/dummy-gov/applications/{application_id}/reject")
def dummy_reject_application(application_id: str, payload: RejectPayload):
    """Sandbox: Reject an application (no admin auth required)."""
    db = get_db()
    apps = db.get("applications", {})
    if application_id in apps:
        apps[application_id]["status"] = "Rejected"
        apps[application_id]["rejection_reason"] = payload.reason
        save_db()
        return {"status": "success", "application_id": application_id}
    record = _find_record(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="Application not found")
    record["status"] = "Rejected"
    record["rejection_reason"] = payload.reason
    save_db()
    return {"status": "success", "application_id": application_id}


def _find_record(db: dict, application_id: str) -> dict | None:
    """Look up by composite key OR by the APP-XXXXXX id field."""
    if application_id in db:
        return db[application_id]
    for record in db.values():
        if isinstance(record, dict) and record.get("id") == application_id:
            return record
    return None


# ══════════════════════════════════════════════
# AUTHENTICATION ENDPOINTS
# ══════════════════════════════════════════════

def _hash_password(password: str) -> str:
    """Simple password hashing using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()

def _generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)

def _get_users_db() -> dict:
    """Get or initialize the users section of the database."""
    db = get_db()
    if "users" not in db:
        db["users"] = {}
    return db["users"]

def _find_user_by_phone(phone: str) -> dict | None:
    """Find a user by phone number."""
    users = _get_users_db()
    for user in users.values():
        if user.get("phone") == phone:
            return user
    return None


@app.post("/api/v1/auth/check-user")
def check_user(payload: CheckPhoneRequest):
    """Check if a user with the given phone number exists."""
    user = _find_user_by_phone(payload.phone)
    return {"exists": user is not None}


@app.post("/api/v1/auth/signup")
def signup(payload: SignupRequest):
    """Register a new user."""
    # Check if phone already exists
    if _find_user_by_phone(payload.phone):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    users = _get_users_db()
    user_id = f"USR-{uuid4().hex[:8].upper()}"
    
    new_user = {
        "user_id": user_id,
        "phone": payload.phone,
        "password_hash": _hash_password(payload.password),
        "name": payload.name,
        "village": "",
        "district": "",
        "land": "",
        "profile_image": "",
        "created_at": time.time(),
        "updated_at": time.time()
    }
    
    users[user_id] = new_user
    save_db()
    
    logger.info("New user registered: %s (%s)", user_id, payload.phone)
    
    return {
        "success": True,
        "user_id": user_id,
        "token": _generate_token()
    }


@app.post("/api/v1/auth/login")
def login(payload: LoginRequest):
    """Authenticate a user with phone and password."""
    user = _find_user_by_phone(payload.phone)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    
    if user.get("password_hash") != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    
    logger.info("User logged in: %s", user["user_id"])
    
    return {
        "success": True,
        "user_id": user["user_id"],
        "phone": user["phone"],
        "token": _generate_token()
    }


# ══════════════════════════════════════════════
# USER PROFILE ENDPOINTS
# ══════════════════════════════════════════════

@app.get("/api/v1/user/profile/{user_id}")
def get_user_profile(user_id: str):
    """Get user profile by user_id."""
    users = _get_users_db()
    
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users[user_id]
    
    # Return profile without password_hash
    return {
        "user_id": user["user_id"],
        "phone": user["phone"],
        "name": user.get("name", ""),
        "village": user.get("village", ""),
        "district": user.get("district", ""),
        "land": user.get("land", ""),
        "profile_image": user.get("profile_image", "")
    }


@app.put("/api/v1/user/profile/{user_id}")
def update_user_profile(user_id: str, payload: UpdateProfileRequest):
    """Update user profile."""
    users = _get_users_db()
    
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users[user_id]
    
    # Update only the fields that are provided
    if payload.name is not None:
        user["name"] = payload.name
    if payload.village is not None:
        user["village"] = payload.village
    if payload.district is not None:
        user["district"] = payload.district
    if payload.land is not None:
        user["land"] = payload.land
    if payload.profile_image is not None:
        user["profile_image"] = payload.profile_image
    
    user["updated_at"] = time.time()
    save_db()
    
    logger.info("Profile updated for user: %s", user_id)
    
    return {"success": True}


@app.put("/api/v1/user/update-phone/{user_id}")
def update_user_phone(user_id: str, payload: UpdatePhoneRequest):
    """Update user's phone number (requires current password)."""
    users = _get_users_db()
    
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users[user_id]
    
    # Verify current password
    if user.get("password_hash") != _hash_password(payload.current_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check if new phone is already taken
    existing = _find_user_by_phone(payload.new_phone)
    if existing and existing["user_id"] != user_id:
        raise HTTPException(status_code=400, detail="Phone number already in use")
    
    user["phone"] = payload.new_phone
    user["updated_at"] = time.time()
    save_db()
    
    logger.info("Phone updated for user: %s -> %s", user_id, payload.new_phone)
    
    return {"success": True}


# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/v1/admin/applications")
def get_pending_applications_endpoint(skip: int = 0, limit: int = 20, admin_id: str = None):
    """Get all pending applications for admin review."""
    if not admin_id:
        raise HTTPException(status_code=401, detail="Admin ID required")
    
    try:
        applications = get_pending_applications()
        
        # Sort by submitted_at (newest first)
        sorted_apps = sorted(
            applications,
            key=lambda x: x.get("submitted_at", ""),
            reverse=True
        )
        
        # Paginate
        paginated = sorted_apps[skip : skip + limit]
        
        logger.info("Admin %s retrieved %d pending applications", admin_id, len(paginated))
        
        return {
            "success": True,
            "total": len(applications),
            "skip": skip,
            "limit": limit,
            "applications": paginated
        }
    except Exception as e:
        logger.error("Error retrieving pending applications: %s", str(e))
        raise HTTPException(status_code=500, detail="Error retrieving applications")


@app.get("/api/v1/admin/applications/{application_id}")
def get_application_details(application_id: str, admin_id: str = None):
    """Get full details of a specific application."""
    if not admin_id:
        raise HTTPException(status_code=401, detail="Admin ID required")
    
    try:
        application = get_application(application_id)
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        logger.info("Admin %s viewed application: %s", admin_id, application_id)
        
        return {
            "success": True,
            "application": application
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error retrieving application %s: %s", application_id, str(e))
        raise HTTPException(status_code=500, detail="Error retrieving application")


@app.put("/api/v1/admin/applications/{application_id}/approve")
def approve_application(application_id: str, payload: dict = None, admin_id: str = None):
    """Approve an application."""
    if not admin_id:
        raise HTTPException(status_code=401, detail="Admin ID required")
    
    try:
        admin_notes = ""
        if payload and isinstance(payload, dict):
            admin_notes = payload.get("notes", "")
        
        update_application_status(
            application_id=application_id,
            status="approved",
            admin_notes=admin_notes,
            admin_id=admin_id
        )
        
        logger.info("Admin %s approved application: %s", admin_id, application_id)
        
        return {
            "success": True,
            "message": "Application approved successfully",
            "application_id": application_id,
            "status": "approved"
        }
    except Exception as e:
        logger.error("Error approving application %s: %s", application_id, str(e))
        raise HTTPException(status_code=500, detail="Error approving application")


@app.put("/api/v1/admin/applications/{application_id}/reject")
def reject_application(application_id: str, payload: dict = None, admin_id: str = None):
    """Reject an application."""
    if not admin_id:
        raise HTTPException(status_code=401, detail="Admin ID required")
    
    try:
        admin_notes = ""
        if payload and isinstance(payload, dict):
            admin_notes = payload.get("notes", "")
            if not admin_notes:
                raise HTTPException(status_code=400, detail="Rejection notes are required")
        
        update_application_status(
            application_id=application_id,
            status="rejected",
            admin_notes=admin_notes,
            admin_id=admin_id
        )
        
        logger.info("Admin %s rejected application: %s", admin_id, application_id)
        
        return {
            "success": True,
            "message": "Application rejected successfully",
            "application_id": application_id,
            "status": "rejected"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error rejecting application %s: %s", application_id, str(e))
        raise HTTPException(status_code=500, detail="Error rejecting application")


@app.get("/api/v1/user/applications")
def get_user_applications_endpoint(user_id: str):
    """Get all submitted applications for a specific user."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        applications = get_user_applications(user_id)
        
        # Sort by submitted_at (newest first)
        sorted_apps = sorted(
            applications,
            key=lambda x: x.get("submitted_at", ""),
            reverse=True
        )
        
        logger.info("User %s retrieved their %d applications", user_id, len(sorted_apps))
        
        return {
            "success": True,
            "user_id": user_id,
            "total": len(sorted_apps),
            "applications": sorted_apps
        }
    except Exception as e:
        logger.error("Error retrieving user applications for %s: %s", user_id, str(e))
        raise HTTPException(status_code=500, detail="Error retrieving applications")


@app.delete("/api/v1/user/applications/{application_id}/cancel")
def cancel_application_endpoint(application_id: str, user_id: str):
    """Cancel a pending application for a specific user."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    if not application_id:
        raise HTTPException(status_code=400, detail="Application ID required")
    
    try:
        # Get the application first to verify ownership and status
        db = load_db()
        applications = db.get("applications", [])
        
        app_index = None
        application = None
        for idx, app in enumerate(applications):
            if app.get("id") == application_id:
                app_index = idx
                application = app
                break
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Verify user owns this application
        if application.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this application")
        
        # Only allow cancellation of pending/submitted applications
        current_status = application.get("status", "").lower()
        if current_status not in ["pending", "submitted"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot cancel application with status '{current_status}'. Only pending/submitted applications can be cancelled."
            )
        
        # Update the application status to cancelled
        applications[app_index]["status"] = "cancelled"
        applications[app_index]["cancelled_at"] = datetime.now().isoformat()
        applications[app_index]["cancelled_by"] = "user"
        
        # Save back to database
        db["applications"] = applications
        save_db(db)
        
        logger.info("User %s cancelled application %s", user_id, application_id)
        
        return {
            "success": True,
            "message": "Application cancelled successfully",
            "application_id": application_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error cancelling application %s: %s", application_id, str(e))
        raise HTTPException(status_code=500, detail="Error cancelling application")