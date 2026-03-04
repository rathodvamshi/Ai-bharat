from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from uuid import uuid4
import os
import time

from .config import mock_applications_db, S3_BUCKET_NAME
from .aws_client import synthesize_speech, transcribe_audio
from .services.bedrock_service import ask_didi_bedrock

app = FastAPI()

# ==========================
# CORS
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# FOLDER SETUP
# ==========================
if not os.path.exists("static"):
    os.makedirs("static")
if not os.path.exists("temp_audio"):
    os.makedirs("temp_audio")

app.mount("/static", StaticFiles(directory="static"), name="static")

# ==========================
# CITIZEN VOICE ENDPOINT
# ==========================
@app.post("/api/v1/process-voice")
async def process_voice(
    audio_file: UploadFile = File(...), 
    user_id: str = Form("9876543210"),
    language: str = Form("hi-IN")
):
    # 1. Save the incoming audio file locally
    temp_path = f"temp_audio/{uuid4().hex}_{audio_file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await audio_file.read())
        
    print(f"\n--- NEW REQUEST ---")
    print(f"Processing audio from user: {user_id}")

    # 2. AWS Transcribe (With Hackathon Bypass)
    try:
        citizen_question = transcribe_audio(temp_path, S3_BUCKET_NAME, language)
        print(f"Citizen asked (Real): {citizen_question}")
    except Exception as e:
        print(f"⚠️ AWS Transcribe Error: {e}")
        print("🚀 HACKATHON BYPASS ACTIVATED: Using simulated text.")
        # Fallback text so Bedrock and Polly still work for the demo
        citizen_question = "I am a street vendor in the city. What loan can I get?"
        print(f"Citizen asked (Simulated): {citizen_question}")

    # 3. AWS Bedrock: Get AI response from Knowledge Base
    try:
        ai_text_response = ask_didi_bedrock(citizen_question)
        print(f"Didi's Answer: {ai_text_response}")
    except Exception as e:
        print(f"Bedrock Error: {e}")
        ai_text_response = "I'm sorry, I am having trouble thinking right now."

    # 4. Update Mock Database
    mock_applications_db[user_id] = {
        "id": f"PM-{uuid4().hex[:6].upper()}",
        "user_id": user_id,
        "scheme": "PM SVANidhi", # Hardcoded for the bypass demo
        "status": "In Progress",
        "timestamp": time.time()
    }

    # 5. AWS Polly: Convert AI text to speech
    try:
        mp3_audio_bytes = synthesize_speech(ai_text_response)
        audio_filename = f"response_{user_id}_{uuid4().hex[:4]}.mp3"
        with open(f"static/{audio_filename}", "wb") as f:
            f.write(mp3_audio_bytes)
        audio_url = f"/static/{audio_filename}"
    except Exception as e:
        print(f"Polly Error: {e}")
        audio_url = None # Frontend will fallback to text-only if Polly fails

    # ==========================================
    # LIVE FORM DATA FOR THE FRONTEND
    # ==========================================
    current_extracted_data = {
        "Name": "रामू (Ramu)",
        "Mobile Number": user_id,
        "Aadhaar Number": None,
        "Status": "Voice Processed"
    }

    # Clean up the temporary uploaded file
    if os.path.exists(temp_path):
        os.remove(temp_path)

    # Return the final JSON payload
    return {
        "status": "success",
        "ai_response": ai_text_response,
        "audio_url": audio_url,
        "extracted_data": current_extracted_data
    }

# ==========================
# DUMMY GOV SANDBOX (Admin Routes)
# ==========================
@app.get("/api/v1/dummy-gov/applications")
def get_all_applications():
    apps = [{"id": k, **v} for k, v in mock_applications_db.items()]
    return {"applications": apps}

@app.put("/api/v1/dummy-gov/applications/{application_id}/approve")
def approve_application(application_id: str):
    for key, app_data in mock_applications_db.items():
        if app_data.get("id") == application_id or key == application_id:
            mock_applications_db[key]["status"] = "Approved"
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Application Not Found")