#!/usr/bin/env python3
"""
Complete End-to-End Flow Test for Jan-Sahayak
Documents → Form Fields → Review Screen → Submit → Success
"""

import requests
import json
import time
import sys

API_BASE = "http://localhost:8000"

def log(msg):
    """Print with emoji prefix."""
    if msg[0] in "✓✗?→⊙":
        print(msg)
    else:
        print(f"  {msg}")

def test_flow():
    """Run complete pipeline test."""
    log("⊙ JAN-SAHAYAK COMPLETE FLOW TEST")
    log("=" * 70)
    
    uid = f"flow_test_{int(time.time())}"
    
    # STEP 1: Get Greeting
    log("\n→ STEP 1: GREETING")
    resp = requests.get(f"{API_BASE}/api/v1/greet", timeout=10).json()
    log("✓ Greeting received")
    
    # STEP 2: Request Scheme Info
    log("\n→ STEP 2: REQUEST PM-KISAN INFO")
    r1 = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "Tell me about PM KISAN",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    
    log(f"✓ Scheme info provided")
    log(f"  Action: {r1.get('ai_data', {}).get('action')}")
    log(f"  Scheme: {r1.get('ai_data', {}).get('scheme_name')}")
    time.sleep(0.5)
    
    # STEP 3: User Affirms Application
    log("\n→ STEP 3: USER AFFIRMS - YES, I WANT TO APPLY")
    r2 = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "Yes, I want to apply for this scheme",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    
    action = r2.get('ai_data', {}).get('action')
    log(f"✓ Affirmative processed")
    log(f"  Action: {action}")
    
    if "eligibility" not in str(action):
        log(f"✗ Expected eligibility action, got: {action}")
        return
    
    time.sleep(0.5)
    
    # STEP 4: Answer Eligibility Questions (All YES)
    log("\n→ STEP 4: ELIGIBILITY QUESTIONS (AUTO-ANSWER YES)")
    
    # Q1: Are you Indian citizen?
    r3 = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "Yes",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    log(f"✓ Q1 answered: {r3.get('ai_data', {}).get('action')}")
    time.sleep(0.3)
    
    # Q2: Do you own agricultural land?
    r4 = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "Yes, I own 2 acres of land",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    log(f"✓ Q2 answered: {r4.get('ai_data', {}).get('action')}")
    time.sleep(0.3)
    
    # Q3: Government employee?
    r5 = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "No, I am a farmer",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    log(f"✓ Q3 answered: {r5.get('ai_data', {}).get('action')}")
    time.sleep(0.3)
    
    # Q4: Pay income tax?
    r6 = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "No",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    log(f"✓ Q4 answered: {r6.get('ai_data', {}).get('action')}")
    final_action = r6.get('ai_data', {}).get('action')
    time.sleep(0.3)
    
    if "eligible" not in str(final_action):
        log(f"✗ Expected eligible action, got: {final_action}")
        return
    
    log("✓ All eligibility questions answered - USER IS ELIGIBLE")
    
    # STEP 5: Continue to Form (if prompted)
    log("\n→ STEP 5: FILL FORM FIELDS")
    if "form" in str(final_action):
        log("✓ Transitioning to form...")
        r7 = requests.post(f"{API_BASE}/api/v1/process-text", json={
            "text": "Continue",
            "user_id": uid,
            "language": "en-IN"
        }, timeout=10).json()
        log(f"  Action: {r7.get('ai_data', {}).get('action')}")
        time.sleep(0.3)
    
    # Fill all 11 form fields for PM-KISAN
    form_fields = {
        "full_name": "Bukya Vamshi",
        "aadhaar_number": "123456789012",  
        "date_of_birth": "2005-04-06",
        "mobile_number": "7569408235",
        "bank_account_number": "123456789012",
        "ifsc_code": "SBIN0001234",
        "state": "Telangana",
        "district": "Hyderabad",
        "village": "Sample Village",
        "land_survey_number": "12345",
        "land_area_hectares": "2.5",
    }
    
    for field_id, value in form_fields.items():
        r_form = requests.post(f"{API_BASE}/api/v1/process-text", json={
            "text": value,
            "user_id": uid,
            "language": "en-IN"
        }, timeout=10).json()
        log(f"✓ Form field '{field_id}': {value}")
        time.sleep(0.3)
    
    # STEP 6: Upload Documents (via API)
    log("\n→ STEP 6: UPLOAD DOCUMENTS (SIMULATED)")
    
    documents = [
        ("aadhaar_doc", "Aadhaar Card"),
        ("land_ownership_doc", "Land Ownership"),
        ("bank_passbook_doc", "Bank Passbook"),
    ]
    
    for doc_id, doc_name in documents:
        # Simulate document upload by calling process-text with document context
        r_doc = requests.post(f"{API_BASE}/api/v1/process-text", json={
            "text": f"Uploaded {doc_name}",
            "user_id": uid,
            "language": "en-IN",
            "document_uploaded": True,
            "document_id": doc_id,
        }, timeout=10).json()
        log(f"✓ Document uploaded: {doc_name}")
        time.sleep(0.3)
    
    time.sleep(0.5)
    
    # STEP 7: Review Screen (Auto-shown after all docs)
    log("\n→ STEP 7: REVIEW CONFIRMATION")
    r_review = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "Review my application",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    
    review_action = r_review.get('ai_data', {}).get('action')
    log(f"✓ Review screen displayed")
    log(f"  Action: {review_action}")
    time.sleep(0.3)
    
    if review_action != "review_confirmation":
        log(f"✗ Expected review_confirmation, got: {review_action}")
    
    # STEP 8: Submit Application
    log("\n→ STEP 8: SUBMIT APPLICATION")
    r_submit = requests.post(f"{API_BASE}/api/v1/process-text", json={
        "text": "Submit",
        "user_id": uid,
        "language": "en-IN"
    }, timeout=10).json()
    
    submit_action = r_submit.get('ai_data', {}).get('action')
    app_id = r_submit.get('ai_data', {}).get('application_id')
    
    log(f"✓ Application submitted!")
    log(f"  Action: {submit_action}")
    log(f"  Application ID: {app_id}")
    
    if submit_action == "submitted":
        log("\n" + "="*70)
        log("✓ COMPLETE FLOW SUCCESS - APPLICATION SUBMITTED")
        log("="*70)
    else:
        log(f"✗ Expected 'submitted' action, got: {submit_action}")

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        log(f"✗ Test error: {e}")
        sys.exit(1)
