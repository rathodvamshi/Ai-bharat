"""
bedrock_service.py — Eligibility-First AI orchestration for Jan-Sahayak.

Conversation flow: Greeting → Scheme Selection → Eligibility Check → Form Filling → Document Upload → Submission

  1. GREETING: User says hello → Didi introduces herself
  2. SCHEME_SELECTION: User picks a scheme (via intent or explicit selection)
  3. ELIGIBILITY_CHECK: Ask eligibility questions ONE BY ONE
     - If ANY question fails → REJECT with reason, suggest other schemes
     - If ALL pass → PROCEED to form
  4. FORM_FILLING: Dynamic form based on scheme (from schemes_config.json)
     - Auto-fill fields from eligibility answers
  5. DOCUMENT_UPLOAD: Request required documents
  6. SUBMISSION: Final confirmation and submit
"""

import boto3
import json
import re
import logging
import os
from datetime import datetime
from typing import Optional

from ..config import (
    AWS_REGION,
    KNOWLEDGE_BASE_ID,
    BEDROCK_KB_MODEL_ARN,
    DEBUG_MODE,
    BEDROCK_MODEL_ID,
)
from ..database import get_last_scheme_context, save_application, save_db

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Bedrock clients (Nova Pro + Knowledge Base)
# ──────────────────────────────────────────────
bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)
kb_client = (
    boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)
    if KNOWLEDGE_BASE_ID
    else None
)

MODEL_ID = BEDROCK_MODEL_ID
MAX_HISTORY = 10

# ──────────────────────────────────────────────
# Load Schemes Configuration
# ──────────────────────────────────────────────
SCHEMES_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "schemes_config.json")

def load_schemes_config() -> dict:
    """Load schemes configuration from JSON file."""
    try:
        with open(SCHEMES_CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load schemes_config.json: {e}")
        return {"schemes": {}, "intent_keywords": {}, "conversation_templates": {}}

SCHEMES_CONFIG = load_schemes_config()

def get_scheme_config(scheme_id: str) -> Optional[dict]:
    """Get configuration for a specific scheme."""
    return SCHEMES_CONFIG.get("schemes", {}).get(scheme_id)

def get_all_scheme_ids() -> list:
    """Get list of all available scheme IDs."""
    return list(SCHEMES_CONFIG.get("schemes", {}).keys())

# ──────────────────────────────────────────────
# Conversation Steps (State Machine)
# ──────────────────────────────────────────────
STEP_GREETING = "greeting"
STEP_SCHEME_SELECTION = "scheme_selection"
STEP_ELIGIBILITY_CHECK = "eligibility_check"
STEP_FORM_FILLING = "form_filling"
STEP_DOCUMENT_UPLOAD = "document_upload"
STEP_REVIEW_CONFIRMATION = "review_confirmation"  # NEW: Review all data before submission
STEP_EDIT_FIELD = "edit_field"  # NEW: Edit specific field
STEP_SUBMISSION = "submission"
STEP_COMPLETED = "completed"

# ──────────────────────────────────────────────
# Intent Types
# ──────────────────────────────────────────────
INTENT_GREETING = "greeting"
INTENT_INFO_REQUEST = "info_request"  # Phase 1: User asking to know about a scheme (tell me, explain, details)
INTENT_SCHEME_INFO = "scheme_info"
INTENT_APPLICATION = "application"
INTENT_STATUS = "status_check"
INTENT_AFFIRMATIVE = "affirmative"
INTENT_NEGATIVE = "negative"
INTENT_UNKNOWN = "unknown"

# ──────────────────────────────────────────────
# Session Store
# ──────────────────────────────────────────────
ACTIVE_SESSIONS: dict = {}

def _get_session(device_id: str) -> dict:
    """Get or create session for device."""
    if device_id not in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS[device_id] = {
            "step": STEP_GREETING,
            "history": [],
            "selected_scheme": None,
            "eligibility_answers": {},
            "eligibility_index": 0,
            "is_eligible": None,
            "form_data": {},
            "form_field_index": 0,
            "uploaded_documents": {},
            "document_index": 0,
            "language": "en",
            "reviewing": False,  # NEW: Is in review confirmation
            "editing_field": None,  # NEW: Which field is being edited
            "application_id": None,  # NEW: Generated application ID
        }
        # Restore selected_scheme from conversation history if available
        # This handles case where backend reloads but user continues conversation
        last_scheme = get_last_scheme_context(device_id)
        if last_scheme:
            ACTIVE_SESSIONS[device_id]["selected_scheme"] = last_scheme
            ACTIVE_SESSIONS[device_id]["step"] = STEP_SCHEME_SELECTION  # They were already shown scheme info
    
    return ACTIVE_SESSIONS[device_id]

def reset_session(device_id: str):
    """Reset session to initial state."""
    if device_id in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[device_id]

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _digits_only(text: str) -> str:
    return re.sub(r"\D", "", str(text))

def _extract_phone_from_text(text: str) -> Optional[str]:
    candidates = re.findall(r"\b\d[\d\s\-]{8,}\d\b", text)
    for c in candidates:
        digits = _digits_only(c)
        if len(digits) >= 10:
            return digits[-10:]
    all_digits = _digits_only(text)
    if len(all_digits) >= 10:
        return all_digits[-10:]
    return None

def _extract_aadhaar_from_text(text: str) -> Optional[str]:
    all_digits = _digits_only(text)
    if len(all_digits) >= 12:
        return all_digits[:12]
    return None

def _get_label(field: dict, lang: str = "en") -> str:
    """Get localized label for a field."""
    if lang == "hi" and field.get("label_hi"):
        return field["label_hi"]
    if lang == "te" and field.get("label_te"):
        return field["label_te"]
    return field.get("label", "")

def _get_question(question: dict, lang: str = "en") -> str:
    """Get localized question text."""
    if lang == "hi" and question.get("question_hi"):
        return question["question_hi"]
    if lang == "te" and question.get("question_te"):
        return question["question_te"]
    return question.get("question", "")

# ──────────────────────────────────────────────
# Intent Detection
# ──────────────────────────────────────────────
_GREETING_PATTERNS = (
    r"\b(hello|hi|hey|namaste|namaskar|hola)\b",
    r"\b(kaun\s+ho|who\s+are\s+you)\b",
    r"^\s*(hi|hello|hey)\s*[.!]?\s*$",
)

_AFFIRMATIVE_PATTERNS = (
    r"^\s*(yes|yeah|yep|haan|han|ji|ok|okay|theek|thik|sure|correct|right)\s*[,.]?\s*",
    r"\b(yes|haan|ji)\s+(hai|hoon|hun|karo|karein|apply|please|please|aage)\b",
)

_NEGATIVE_PATTERNS = (
    r"^\s*(no|nahi|nope|na|nahin)\s*[.!]?\s*$",
    r"\b(nahi|no)\s+(hai|hoon|hun)\b",
)

_APPLICATION_PATTERNS = (
    r"\b(apply|apply\s+karna|form\s+bharna|aavedan)\b",
    r"\b(registration|register)\b",
    r"\b(want\s+to\s+apply|chahta\s+hoon|chahiye)\b",
)

# Phase 1: Intent to get INFO about scheme (tell me, explain, details, etc.)
_INFO_REQUEST_PATTERNS = (
    r"\b(tell\s+me|explain|details|information|about|know|जानकारी|बताइए|बताओ|తెలుపు|చెప్పు)\b",
    r"^\s*(what\s+is|क्या\s+है|ఏమిటి)\b",
    r"\b(के\s+बारे\s+में|గురించి)\b",
)

def _detect_scheme_from_text(text: str) -> Optional[str]:
    """Detect which scheme the user is asking about."""
    text_lower = text.lower()
    intent_keywords = SCHEMES_CONFIG.get("intent_keywords", {})
    
    for scheme_id, keywords in intent_keywords.items():
        for keyword in keywords:
            if keyword.lower() in text_lower:
                return scheme_id
    return None

def _detect_intent(text: str, current_step: str) -> str:
    """Detect user intent from message."""
    t = (text or "").strip().lower()
    if not t:
        return INTENT_UNKNOWN

    for pat in _GREETING_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_GREETING

    for pat in _AFFIRMATIVE_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_AFFIRMATIVE

    for pat in _NEGATIVE_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_NEGATIVE

    # Phase 1: Check for info request (tell me, explain, details, etc.)
    for pat in _INFO_REQUEST_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            if _detect_scheme_from_text(text):
                return INTENT_INFO_REQUEST
            break

    for pat in _APPLICATION_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_APPLICATION

    # Check if user mentioned a scheme
    if _detect_scheme_from_text(text):
        return INTENT_SCHEME_INFO

    return INTENT_UNKNOWN

# ──────────────────────────────────────────────
# Bedrock API Helpers
# ──────────────────────────────────────────────

def _call_bedrock(messages: list[dict], system_prompt: str, max_tokens: int = 500) -> dict:
    """Call Bedrock and parse JSON response."""
    body = json.dumps({
        "system": [{"text": system_prompt}],
        "messages": messages,
        "inferenceConfig": {"maxTokens": max_tokens},
    })
    response = bedrock.invoke_model(modelId=MODEL_ID, body=body)
    raw = json.loads(response["body"].read())
    ai_text = raw["output"]["message"]["content"][0]["text"]
    
    cleaned = re.sub(r"```(?:json)?", "", ai_text).strip().strip("`")
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    
    match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    return {"speech_response": ai_text.strip(), "extracted_data": {}}

def _retrieve_from_knowledge_base(query: str) -> Optional[dict]:
    """Query the Bedrock Knowledge Base."""
    if not KNOWLEDGE_BASE_ID or not kb_client:
        return None
    
    try:
        cfg = {
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": KNOWLEDGE_BASE_ID,
                "modelArn": BEDROCK_KB_MODEL_ARN,
            },
        }
        response = kb_client.retrieve_and_generate(
            input={"text": query},
            retrieveAndGenerateConfiguration=cfg,
        )
        output = response.get("output", {}) or {}
        answer_text = (output.get("text") or "").strip()
        if answer_text:
            return {"answer": answer_text, "citations": response.get("citations", [])}
    except Exception as exc:
        logger.error(f"KB query failed: {exc}")
    return None

def _build_bedrock_messages(history: list[dict]) -> list[dict]:
    """Convert history to Bedrock format."""
    role_map = {"User": "user", "Didi": "assistant"}
    msgs = []
    
    for entry in history:
        role = role_map.get(entry["role"], "user")
        content = (entry.get("content") or "").strip()
        if not content:
            continue
        if msgs and msgs[-1]["role"] == role:
            msgs[-1]["content"][0]["text"] += "\n" + content
        else:
            msgs.append({"role": role, "content": [{"text": content}]})
    
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)
    while msgs and msgs[-1]["role"] != "user":
        msgs.pop()
    
    return msgs or [{"role": "user", "content": [{"text": "Hello"}]}]

# ──────────────────────────────────────────────
# Response Builders
# ──────────────────────────────────────────────

def _build_greeting_response(session: dict, lang: str = "en") -> dict:
    """Build greeting response."""
    templates = SCHEMES_CONFIG.get("conversation_templates", {}).get("greeting", {})
    speech = templates.get(lang, templates.get("en", 
        "Hello! I'm Jan Sahayak. How can I help? Ask about PM-KISAN, Ayushman Bharat, PM Awas, KCC, APY, PMFBY, MUDRA, or SVANidhi."
    ))
    return {
        "speech_response": speech,
        "action": "greeting",
        "available_schemes": [
            {"id": s["scheme_id"], "name": s["scheme_name"], "icon": s.get("icon", "📋")}
            for s in SCHEMES_CONFIG.get("schemes", {}).values()
        ]
    }

def _build_eligibility_question_response(session: dict, scheme_config: dict, question_index: int) -> dict:
    """Build eligibility question response."""
    questions = scheme_config.get("eligibility_questions", [])
    
    if question_index >= len(questions):
        return None  # All questions answered
    
    question = questions[question_index]
    lang = session.get("language", "en")
    question_text = _get_question(question, lang)
    
    # Include clarification and help text if available
    full_speech = question_text
    if question.get("clarification"):
        full_speech += f"\n\n📌 {question['clarification']}"
    if question.get("help_text"):
        full_speech += f"\n\n💡 Example: {question['help_text'].replace('Example: ', '')}"
    elif question.get("type") == "boolean":
        full_speech += "\n\n💡 Example: You can respond with 'Yes' or 'No'."
    elif question.get("type") in ["choice", "income_range"]:
        opts = question.get("options", [])
        if opts:
            opts_str = ", ".join(opts)
            full_speech += f"\n\n💡 Example: Please choose one from: {opts_str}."
    
    response = {
        "speech_response": full_speech,
        "question": question_text,  # For frontend EligibilityCard
        "clarification": question.get("clarification", ""),
        "help_text": question.get("help_text", ""),
        "action": "eligibility_question",
        "question_id": question["id"],
        "question_type": question.get("type", "boolean"),
        "current_question_index": question_index,
        "total_questions": len(questions),
        "scheme_id": scheme_config["scheme_id"],
        "scheme_name": scheme_config["scheme_name"],
    }
    
    if question.get("type") == "choice" or question.get("type") == "income_range":
        response["options"] = question.get("options", [])
    
    return response

def _check_eligibility_answer(question: dict, answer: str, intent: str) -> tuple[bool, Optional[str]]:
    """Check if the answer passes eligibility."""
    q_type = question.get("type", "boolean")
    
    if q_type == "boolean":
        is_yes = intent == INTENT_AFFIRMATIVE or re.search(r"\b(yes|haan|ji|ha)\b", answer.lower())
        is_no = intent == INTENT_NEGATIVE or re.search(r"\b(no|nahi|na)\b", answer.lower())
        
        required_answer = question.get("required_answer")
        if required_answer is not None:
            if required_answer and is_no:
                return False, question.get("rejection_message", "You are not eligible based on this criteria.")
            if not required_answer and is_yes:
                return False, question.get("rejection_message", "You are not eligible based on this criteria.")
        
        return True, None
    
    elif q_type == "number":
        try:
            value = int(_digits_only(answer))
            validation = question.get("validation", {})
            min_val = validation.get("min")
            max_val = validation.get("max")
            
            rejection_cond = question.get("rejection_condition", {})
            if rejection_cond.get("operator") == "outside_range":
                r_min = rejection_cond.get("min", min_val)
                r_max = rejection_cond.get("max", max_val)
                if r_min is not None and value < r_min:
                    return False, question.get("rejection_message")
                if r_max is not None and value > r_max:
                    return False, question.get("rejection_message")
            
            return True, None
        except:
            return True, None  # Can't parse, assume ok
    
    elif q_type in ["choice", "income_range"]:
        # For choice questions, any selection is valid (we use it for auto-fill)
        return True, None
    
    return True, None

def _extract_answer_value(question: dict, answer: str, intent: str):
    """Extract the actual value from user's answer."""
    q_type = question.get("type", "boolean")
    
    if q_type == "boolean":
        is_yes = intent == INTENT_AFFIRMATIVE or re.search(r"\b(yes|haan|ji|ha)\b", answer.lower())
        return is_yes
    
    elif q_type == "number":
        try:
            return int(_digits_only(answer))
        except:
            return answer
    
    elif q_type in ["choice", "income_range"]:
        options = question.get("options", [])
        answer_lower = answer.lower().strip()
        
        # Check for number selection (1, 2, 3...)
        try:
            idx = int(answer) - 1
            if 0 <= idx < len(options):
                return options[idx]
        except:
            pass
        
        # Check for partial match
        for opt in options:
            if opt.lower() in answer_lower or answer_lower in opt.lower():
                return opt
        
        return answer
    
    return answer

def _build_not_eligible_response(session: dict, scheme_config: dict, rejection_message: str) -> dict:
    """Build response when user is not eligible."""
    lang = session.get("language", "en")
    templates = SCHEMES_CONFIG.get("conversation_templates", {}).get("not_eligible", {})
    
    base_msg = templates.get(lang, templates.get("en", 
        "I'm sorry, but based on your response, you may not be eligible for {scheme_name}. {reason}"
    ))
    
    speech = base_msg.format(
        scheme_name=scheme_config["scheme_name"],
        reason=rejection_message
    )
    
    # Suggest other schemes
    speech += " Would you like me to suggest other schemes that might suit you?"
    
    return {
        "speech_response": speech,
        "action": "not_eligible",
        "scheme_id": scheme_config["scheme_id"],
        "reason": rejection_message,
        "suggested_schemes": get_all_scheme_ids()
    }

def _build_eligible_response(session: dict, scheme_config: dict) -> dict:
    """Build response when user IS eligible."""
    lang = session.get("language", "en")
    templates = SCHEMES_CONFIG.get("conversation_templates", {}).get("eligible_proceed", {})
    
    base_msg = templates.get(lang, templates.get("en",
        "Congratulations! Based on your answers, you appear to be eligible for {scheme_name}. Would you like to proceed with the application?"
    ))
    
    speech = base_msg.format(scheme_name=scheme_config["scheme_name"])
    
    return {
        "speech_response": speech,
        "action": "eligible",
        "scheme_id": scheme_config["scheme_id"],
        "scheme_name": scheme_config["scheme_name"],
        "eligibility_answers": session.get("eligibility_answers", {})
    }

def _build_form_field_response(session: dict, scheme_config: dict, field_index: int) -> dict:
    """Build response asking for a form field - clean, without previous answers redundancy."""
    form_fields = scheme_config.get("form_fields", [])
    
    if field_index >= len(form_fields):
        return None  # All fields collected
    
    field = form_fields[field_index]
    lang = session.get("language", "en")
    label = _get_label(field, lang)
    
    # Check if field can be auto-filled from eligibility answers
    auto_fill_from = field.get("auto_fill_from")
    if auto_fill_from:
        eligibility_answers = session.get("eligibility_answers", {})
        if auto_fill_from in eligibility_answers:
            # Auto-fill this field and move to next
            session["form_data"][field["id"]] = eligibility_answers[auto_fill_from]
            return _build_form_field_response(session, scheme_config, field_index + 1)
    
    # Clean, conversational response without redundancy
    total_fields = len(form_fields)
    current_field_num = field_index + 1
    
    # Customize response based on field type
    example_text = ""
    f_type = field.get("type")
    
    # Try to provide a good, contextual example
    if field.get("placeholder"):
        example_text = f" For example: {field['placeholder']}."
    elif f_type == "phone":
        example_text = " For example: 9876543210."
    elif f_type == "aadhaar":
        example_text = " Please provide your 12-digit Aadhaar number. For example: 1234 5678 9012."
    elif f_type == "date":
        example_text = " For example: 15 August 1990."
    elif f_type == "number":
        example_text = " For example: 25000."
    elif "name" in field["id"].lower():
        example_text = " For example: Rahul Kumar."

    if f_type == "select":
        options_text = ", ".join(field.get("options", []))
        speech_response = f"Please tell me, what is your {label}? (Choose from: {options_text})"
    elif f_type == "boolean":
        speech_response = f"Please answer with Yes or No: What is your {label}?"
    else:
        speech_response = f"Please tell me, what is your {label}?{example_text}"
    
    # Add progress indicator
    if current_field_num > 1:
        speech_response += f" (Field {current_field_num} of {total_fields})"
    
    response = {
        "speech_response": speech_response,
        "action": "form_field",
        "field_id": field["id"],
        "field_type": field.get("type", "text"),
        "field_label": label,
        "field_index": current_field_num,
        "total_fields": total_fields,
        "required": field.get("required", True),
        "validation": field.get("validation"),
        "placeholder": field.get("placeholder"),
        "scheme_id": scheme_config["scheme_id"],
        # Include collected form data so frontend can sync its state
        "collected_form_data": session.get("form_data", {}),
    }
    
    if field.get("type") == "select":
        response["options"] = field.get("options", [])
    
    return response

def _validate_form_field(field: dict, value: str) -> tuple[bool, Optional[str]]:
    """Validate a form field value."""
    field_type = field.get("type", "text")
    validation = field.get("validation", {})
    
    if field_type == "aadhaar":
        digits = _digits_only(value)
        if len(digits) != 12:
            return False, "Please enter a valid 12-digit Aadhaar number."
        return True, None
    
    if field_type == "phone":
        digits = _digits_only(value)
        if len(digits) != 10:
            return False, "Please enter a valid 10-digit mobile number."
        return True, None
    
    if "pattern" in validation:
        if not re.match(validation["pattern"], value, re.IGNORECASE):
            return False, f"Invalid format for {field.get('label', 'this field')}."
    
    if "min_length" in validation:
        if len(value) < validation["min_length"]:
            return False, f"Please enter at least {validation['min_length']} characters."
    
    if "max_length" in validation:
        if len(value) > validation["max_length"]:
            return False, f"Please enter at most {validation['max_length']} characters."
    
    return True, None

def _extract_form_value(field: dict, text: str) -> str:
    """Extract and normalize form field value."""
    field_type = field.get("type", "text")
    
    if field_type == "aadhaar":
        return _digits_only(text)[:12]
    
    if field_type == "phone":
        phone = _extract_phone_from_text(text)
        return phone or _digits_only(text)[-10:]
    
    if field_type == "number":
        try:
            return str(int(_digits_only(text)))
        except:
            return text.strip()
    
    if field_type == "select":
        options = field.get("options", [])
        text_lower = text.lower().strip()
        
        # Check number selection
        try:
            idx = int(text) - 1
            if 0 <= idx < len(options):
                return options[idx]
        except:
            pass
        
        # Partial match
        for opt in options:
            if opt.lower() in text_lower or text_lower in opt.lower():
                return opt
        
        return text.strip()
    
    return text.strip()

def _build_document_request_response(session: dict, scheme_config: dict, doc_index: int) -> dict:
    """Build response requesting document upload - clean and focused."""
    documents = scheme_config.get("required_documents", [])
    
    # Skip non-required documents for now
    required_docs = [d for d in documents if d.get("required", True)]
    
    if doc_index >= len(required_docs):
        return None  # All documents collected
    
    doc = required_docs[doc_index]
    lang = session.get("language", "en")
    label = _get_label(doc, lang)
    
    # Convert accept string to array
    accept_str = doc.get("accept", ".pdf,.jpg,.jpeg,.png")
    accept_types = [t.strip() for t in accept_str.split(",")]
    
    # Clean, simple message - no redundancy
    current_doc_num = doc_index + 1
    total_docs = len(required_docs)
    
    speech_response = f"Now let's upload your {label}"
    if current_doc_num > 1:
        speech_response += f" (Document {current_doc_num} of {total_docs})"
    
    return {
        "speech_response": speech_response,
        "action": "document_upload",
        "document_id": doc["id"],
        "document_label": label,
        "current_document_index": doc_index,
        "total_documents": total_docs,
        "accept_types": accept_types,
        "required": doc.get("required", True),
        "scheme_id": scheme_config["scheme_id"],
        "collected_form_data": session.get("form_data", {}),
    }

def _build_submission_response(session: dict, scheme_config: dict) -> dict:
    """Build final submission response."""
    ref_number = f"JS{datetime.now().strftime('%Y%m%d%H%M%S')}{session.get('selected_scheme', 'XXX')[:3].upper()}"
    
    lang = session.get("language", "en")
    templates = SCHEMES_CONFIG.get("conversation_templates", {}).get("submission_complete", {})
    
    base_msg = templates.get(lang, templates.get("en",
        "Your application for {scheme_name} has been submitted successfully! Reference: {ref_number}"
    ))
    
    speech = base_msg.format(
        scheme_name=scheme_config["scheme_name"],
        ref_number=ref_number
    )
    
    return {
        "speech_response": speech,
        "action": "submitted",
        "scheme_id": scheme_config["scheme_id"],
        "scheme_name": scheme_config["scheme_name"],
        "reference_number": ref_number,
        "form_data": session.get("form_data", {}),
        "documents": list(session.get("uploaded_documents", {}).keys()),
        "is_ready_to_submit": True
    }

# ──────────────────────────────────────────────
# NEW: Review Confirmation & Application Card
# ──────────────────────────────────────────────

def generate_application_id() -> str:
    """Generate unique application ID: APP-TIMESTAMP-RANDOM."""
    import random
    import string
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"APP-{timestamp}-{random_id}"

def _build_review_confirmation_response(session: dict, scheme_config: dict) -> dict:
    """Build review confirmation screen showing all form data and uploaded documents."""
    lang = session.get("language", "en")
    form_data = session.get("form_data", {})
    uploaded_docs = session.get("uploaded_documents", {})
    form_fields = scheme_config.get("form_fields", [])
    required_docs = [d for d in scheme_config.get("required_documents", []) if d.get("required", True)]
    
    # Clean AI response - just confirmation guidance
    speech_response = (
        f"Perfect! I've compiled your complete application for {scheme_config['scheme_name']}. "
        f"Everything is verified and ready to submit. Please review the details on the form card. "
        f"You can either click 'Submit' to finalize, or 'Edit' if you'd like to change anything."
    )
    
    return {
        "speech_response": speech_response,
        "action": "review_confirmation",
        "form_data": form_data,
        "uploaded_documents": uploaded_docs,
        "scheme_id": scheme_config["scheme_id"],
        "scheme_name": scheme_config["scheme_name"],
        "can_submit": len(uploaded_docs) >= len(required_docs),  # All docs uploaded?
    }

def _build_edit_field_response(session: dict, scheme_config: dict, field_id: str) -> dict:
    """Build response for editing a specific field."""
    lang = session.get("language", "en")
    form_fields = scheme_config.get("form_fields", [])
    
    # Find the field
    field = next((f for f in form_fields if f["id"] == field_id), None)
    if not field:
        return {
            "speech_response": "Field not found. Please specify which field to edit.",
            "action": "error"
        }
    
    label = _get_label(field, lang)
    current_value = session.get("form_data", {}).get(field_id, "")
    
    response = {
        "speech_response": f"Editing: **{label}**\n\nCurrent value: {current_value}\n\nPlease provide new value:",
        "action": "edit_field",
        "field_id": field_id,
        "field_label": label,
        "current_value": current_value,
        "field_type": field.get("type", "text"),
        "scheme_id": scheme_config["scheme_id"],
    }
    
    return response

def _build_application_card_response(session: dict, scheme_config: dict, application_id: str) -> dict:
    """Build application cards with all details and tracking information."""
    lang = session.get("language", "en")
    
    card_speech = (
        f"Excellent! Your application has been submitted successfully! 🎉 "
        f"Your Application ID is {application_id}. "
        f"Our team will review your application for {scheme_config['scheme_name']} within 2-3 working days. "
        f"You'll receive updates via SMS and email. Save your ID for tracking!"
    )
    
    return {
        "speech_response": card_speech,
        "action": "submitted",
        "application_id": application_id,
        "scheme_id": scheme_config["scheme_id"],
        "scheme_name": scheme_config["scheme_name"],
        "status": "submitted",
        "submitted_at": datetime.now().isoformat(),
        "form_data": session.get("form_data", {}),
        "uploaded_documents": session.get("uploaded_documents", {}),
        "show_card": True,
    }

# ──────────────────────────────────────────────
# Main Entry Point
# ──────────────────────────────────────────────

def ask_didi_bedrock(user_input: str, device_id: str, conversation_history: list = None, last_scheme: str = None, eligibility_answer: Optional[any] = None, form_field_value: Optional[str] = None, document_uploaded: bool = False, document_id: Optional[str] = None) -> dict:
    """
    Process user input through the eligibility-first flow.
    
    Flow: Greeting → Scheme Selection → Eligibility → Form → Documents → Submit
    
    Args:
        user_input: Text input from user
        device_id: Session device ID
        conversation_history: List of recent conversation messages for context
        last_scheme: The scheme_id from the most recent scheme mention
        eligibility_answer: Direct eligibility answer (boolean, string, or number)
        form_field_value: Direct form field value
        document_uploaded: Whether a document was uploaded
        document_id: ID of the uploaded document
    """
    session = _get_session(device_id)
    session["history"].append({"role": "User", "content": user_input})
    
    current_step = session["step"]
    
    # If eligibility answer is provided, use it as the input for eligibility check
    if eligibility_answer is not None and current_step == STEP_ELIGIBILITY_CHECK:
        user_input = str(eligibility_answer)
    
    # If form field value is provided, use it as the input for form filling
    if form_field_value is not None and current_step == STEP_FORM_FILLING:
        user_input = form_field_value
    
    intent = _detect_intent(user_input, current_step)
    detected_scheme = _detect_scheme_from_text(user_input)
    
    # ── CONTEXT AWARENESS: If last_scheme is set and user says "Yes", use that scheme ──
    if last_scheme and not detected_scheme and intent in [INTENT_AFFIRMATIVE, INTENT_APPLICATION, None]:
        # Check if user is giving affirmative response (Yes, Ok, Sure, etc.)
        affirmative_patterns = ["yes", "ok", "okay", "sure", "start", "apply", "yep", "yeah", "sahi", "हाँ", "जी", "ठीक"]
        user_lower = user_input.lower()
        if any(pattern in user_lower for pattern in affirmative_patterns):
            detected_scheme = last_scheme  # Use the scheme from context
    
    logger.info(f"[{device_id}] step={current_step} intent={intent} scheme={detected_scheme}")
    
    # ── PHASE 1: INFO REQUEST Handler (Tell me about scheme) - CHECK FIRST ──
    # If user is asking for information about a scheme, show details WITHOUT starting eligibility
    # This should be checked BEFORE the greeting step so users can ask about schemes immediately
    if intent == INTENT_INFO_REQUEST and detected_scheme:
        session["selected_scheme"] = detected_scheme  # Store for later if they want to apply
        session["step"] = STEP_SCHEME_SELECTION  # Next step: wait for affirmative response
        scheme_config = get_scheme_config(detected_scheme)
        if scheme_config:
            # Build comprehensive info response with detailed information
            scheme_name = scheme_config.get('scheme_name', 'Government Scheme')
            short_desc = scheme_config.get('short_description', '')
            detailed_desc = scheme_config.get('detailed_description', '')
            who_can_apply = scheme_config.get('who_can_apply', '')
            key_benefits = scheme_config.get('key_benefits', [])
            not_eligible = scheme_config.get('not_eligible', '')
            
            # Format benefits as bullet points
            benefits_text = ""
            if isinstance(key_benefits, list):
                for benefit in key_benefits:
                    benefits_text += f"\n{benefit}"
            
            # Build the response
            speech = f"""📋 **{scheme_name}**

💡 {short_desc}

📖 About This Scheme:
{detailed_desc}

✅ Who Can Apply?
{who_can_apply}{benefits_text}

❌ NOT Eligible If:
{not_eligible}

Would you like to apply for {scheme_name}? Just say 'Yes' to start your application."""
            
            info_response = {
                "speech_response": speech,
                "action": "info_response",
                "scheme_id": detected_scheme,
                "scheme_details": {
                    "scheme_name": scheme_name,
                    "description": short_desc,
                    "detailed_info": detailed_desc,
                    "eligibility": who_can_apply,
                    "benefits": key_benefits,
                }
            }
            session["history"].append({"role": "Didi", "content": info_response["speech_response"]})
            return {"ai_data": info_response, "composite_user_id": device_id, "show_form": False}
    
    # ── STEP 1: GREETING ──
    # Show greeting if: it's a greeting intent, OR we're at greeting step with no selected scheme
    should_show_greeting = intent == INTENT_GREETING or (current_step == STEP_GREETING and not session.get("selected_scheme"))
    
    if should_show_greeting:
        session["step"] = STEP_SCHEME_SELECTION
        response = _build_greeting_response(session)
        session["history"].append({"role": "Didi", "content": response["speech_response"]})
        return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
    
    # ── STEP 2: SCHEME SELECTION ──
    if current_step == STEP_SCHEME_SELECTION:
        # Use newly detected scheme, or fall back to previously selected scheme if user is responding affirmatively/applying
        scheme_to_apply = detected_scheme
        if not scheme_to_apply and session.get("selected_scheme") and intent in [INTENT_AFFIRMATIVE, INTENT_APPLICATION]:
            scheme_to_apply = session["selected_scheme"]
        
        if scheme_to_apply:
            session["selected_scheme"] = scheme_to_apply
            session["step"] = STEP_ELIGIBILITY_CHECK
            session["eligibility_index"] = 0
            session["eligibility_answers"] = {}
            
            scheme_config = get_scheme_config(scheme_to_apply)
            if not scheme_config:
                response = {
                    "speech_response": "Sorry, I couldn't find that scheme. Please try again.",
                    "action": "error"
                }
                session["history"].append({"role": "Didi", "content": response["speech_response"]})
                return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
            
            # Announce eligibility check
            intro = f"Great! Let me check your eligibility for {scheme_config['scheme_name']}. I'll ask you a few questions."
            
            # Get first eligibility question
            question_response = _build_eligibility_question_response(session, scheme_config, 0)
            if question_response:
                full_speech = f"{intro} {question_response['speech_response']}"
                question_response["speech_response"] = full_speech
                session["history"].append({"role": "Didi", "content": full_speech})
                return {"ai_data": question_response, "composite_user_id": device_id, "show_form": False, "show_eligibility": True}
            else:
                # No eligibility questions, go to form
                session["step"] = STEP_FORM_FILLING
                session["is_eligible"] = True
        else:
            # Use RAG to answer scheme question
            kb_result = _retrieve_from_knowledge_base(user_input)
            if kb_result and kb_result.get("answer"):
                response = {
                    "speech_response": kb_result["answer"] + "\n\nWould you like to apply for any scheme?",
                    "action": "scheme_info",
                    "kb_context": kb_result["answer"]
                }
            else:
                response = {
                    "speech_response": "Which scheme would you like to know about or apply for? I can help with PM-KISAN, Ayushman Bharat, PM Awas Yojana, KCC, APY, PMFBY, MUDRA, or PM SVANidhi.",
                    "action": "ask_scheme"
                }
            session["history"].append({"role": "Didi", "content": response["speech_response"]})
            return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
    
    # ── STEP 3: ELIGIBILITY CHECK ──
    if current_step == STEP_ELIGIBILITY_CHECK:
        scheme_id = session.get("selected_scheme")
        scheme_config = get_scheme_config(scheme_id)
        
        if not scheme_config:
            session["step"] = STEP_SCHEME_SELECTION
            response = {"speech_response": "Something went wrong. Please select a scheme again.", "action": "error"}
            return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
        
        questions = scheme_config.get("eligibility_questions", [])
        current_q_index = session.get("eligibility_index", 0)
        
        if current_q_index < len(questions):
            current_question = questions[current_q_index]
            
            # ── CLARIFICATION CHECK ──
            # If user asks for clarification (e.g., "what is mean by rural", "explain"), provide it
            clarification_patterns = [
                r"\b(what|what's|whats|explain|meaning|mean|what\s+do\s+you|clarify|clear)\b",
                r"\b(by|of|is|are)\s+(rural|urban|income|occupation|ration|citizen)\b",
                r"\b(don't understand|don't know|confused|समझ नहीं|తెలుసుకోలేదు)\b"
            ]
            is_asking_for_clarification = any(re.search(pat, user_input.lower()) for pat in clarification_patterns)
            
            if is_asking_for_clarification and current_question.get("clarification"):
                clarification_response = {
                    "speech_response": f"📌 {current_question['clarification']}\n\n{current_question.get('help_text', '')}",
                    "action": "clarification_provided",
                    "question_id": current_question["id"],
                    "question_type": current_question.get("type", "boolean"),
                }
                session["history"].append({"role": "Didi", "content": clarification_response["speech_response"]})
                return {"ai_data": clarification_response, "composite_user_id": device_id, "show_form": False}
            
            # Phase 1: If eligibility_answer is explicitly provided (from frontend button click), use it directly
            # This avoids parsing ambiguity (e.g., "1" could mean integer or the word "yes")
            if eligibility_answer is not None:
                # Convert explicit answer to proper format for checking
                answer_text_for_check = str(eligibility_answer).lower()
                is_passed, rejection_msg = _check_eligibility_answer(current_question, answer_text_for_check, INTENT_AFFIRMATIVE if answer_text_for_check in ["yes", "true", "1"] else INTENT_NEGATIVE)
                answer_value = eligibility_answer
            else:
                # Otherwise, parse from user_input
                is_passed, rejection_msg = _check_eligibility_answer(current_question, user_input, intent)
                answer_value = _extract_answer_value(current_question, user_input, intent)
            
            # Store the answer value
            session["eligibility_answers"][current_question["id"]] = answer_value
            
            # Also store auto_fill mapping
            if current_question.get("auto_fill"):
                session["eligibility_answers"][current_question["auto_fill"]] = answer_value
            
            if not is_passed:
                # User is NOT eligible
                session["is_eligible"] = False
                session["step"] = STEP_SCHEME_SELECTION
                response = _build_not_eligible_response(session, scheme_config, rejection_msg)
                session["history"].append({"role": "Didi", "content": response["speech_response"]})
                return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
            
            # Move to next question
            session["eligibility_index"] = current_q_index + 1
            
            if session["eligibility_index"] < len(questions):
                # More questions
                question_response = _build_eligibility_question_response(session, scheme_config, session["eligibility_index"])
                session["history"].append({"role": "Didi", "content": question_response["speech_response"]})
                return {"ai_data": question_response, "composite_user_id": device_id, "show_form": False, "show_eligibility": True}
            else:
                # All questions passed - user is ELIGIBLE!
                session["is_eligible"] = True
                eligible_response = _build_eligible_response(session, scheme_config)
                session["history"].append({"role": "Didi", "content": eligible_response["speech_response"]})
                return {"ai_data": eligible_response, "composite_user_id": device_id, "show_form": False, "show_eligibility": True}
    
    # ── STEP 3.5: After eligibility confirmed, waiting for "yes" to proceed ──
    if session.get("is_eligible") and current_step == STEP_ELIGIBILITY_CHECK:
        # Check for affirmative intent (Yes, Continue, Proceed, Go ahead, etc.)
        affirmative_words = ["yes", "ok", "okay", "continue", "जारी", "కొనసాగించు", "proceed", "go", "ahead", "आगे", "ఆગে", "1", "sure"]
        user_lower = user_input.lower().strip()
        is_affirmative = any(word in user_lower for word in affirmative_words) or intent == INTENT_AFFIRMATIVE
        
        if is_affirmative:
            session["step"] = STEP_FORM_FILLING
            session["form_field_index"] = 0
            session["form_data"] = {}
            
            scheme_config = get_scheme_config(session["selected_scheme"])
            
            # Auto-fill from eligibility answers
            for field in scheme_config.get("form_fields", []):
                auto_fill_from = field.get("auto_fill_from")
                if auto_fill_from and auto_fill_from in session.get("eligibility_answers", {}):
                    session["form_data"][field["id"]] = session["eligibility_answers"][auto_fill_from]
            
            # Get first non-auto-filled field
            form_fields = scheme_config.get("form_fields", [])
            for i, field in enumerate(form_fields):
                if field["id"] not in session["form_data"]:
                    session["form_field_index"] = i
                    break
            
            # Ask first form field conversationally using the builder
            response = _build_form_field_response(session, scheme_config, session["form_field_index"])
            # Add a transition prefix to the FIRST field of the form
            response["speech_response"] = f"Great! Based on your answers, you are eligible. Let's fill in the application form.\n\n{response['speech_response']}"
            
            session["history"].append({"role": "Didi", "content": response["speech_response"]})
            return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
        elif intent == INTENT_NEGATIVE or user_lower in ["no", "नहीं", "లేదు"]:
            session["step"] = STEP_SCHEME_SELECTION
            response = {"speech_response": "No problem! Would you like to check eligibility for a different scheme?", "action": "ask_scheme"}
            session["history"].append({"role": "Didi", "content": response["speech_response"]})
            return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
    
    # ── STEP 4: FORM FILLING ──
    if current_step == STEP_FORM_FILLING:
        scheme_config = get_scheme_config(session["selected_scheme"])
        form_fields = scheme_config.get("form_fields", [])
        current_field_index = session.get("form_field_index", 0)
        
        # Find the current field (skip auto-filled ones)
        while current_field_index < len(form_fields):
            if form_fields[current_field_index]["id"] not in session["form_data"]:
                break
            current_field_index += 1
        
        if current_field_index < len(form_fields):
            current_field = form_fields[current_field_index]
            
            # Extract and validate the value
            # Phase 1: Prefer explicit form_field_value from frontend (from button clicks or direct input)
            if form_field_value is not None:
                value = form_field_value
            else:
                value = _extract_form_value(current_field, user_input)
            
            is_valid, error_msg = _validate_form_field(current_field, value)
            
            if not is_valid:
                response = {
                    "speech_response": error_msg,
                    "action": "validation_error",
                    "field_id": current_field["id"],
                    "collected_form_data": session.get("form_data", {}),
                }
                session["history"].append({"role": "Didi", "content": error_msg})
                save_db()  # ✓ CRITICAL: Persist validation error state
                return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
            
            # Store the value
            session["form_data"][current_field["id"]] = value
            
            # Move to next field
            current_field_index += 1
            lang = session.get("language", "en")
            
            # Find next non-auto-filled field
            while current_field_index < len(form_fields):
                if form_fields[current_field_index]["id"] not in session["form_data"]:
                    break
                current_field_index += 1
            session["form_field_index"] = current_field_index
            
            if current_field_index < len(form_fields):
                # Ask next field conversationally in chat
                next_field = form_fields[current_field_index]
                field_label = _get_label(next_field, lang)
                response = _build_form_field_response(session, scheme_config, current_field_index)
                session["history"].append({"role": "Didi", "content": response["speech_response"]})
                save_db()  # ✓ CRITICAL: Persist form data and history
                return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
            else:
                # All fields collected, move to document upload
                session["step"] = STEP_DOCUMENT_UPLOAD
                session["document_index"] = 0
                save_db()  # ✓ CRITICAL: Persist step change to database
                
                # Immediately transition to document upload
                doc_response = _build_document_request_response(session, scheme_config, 0)
                if doc_response:
                    session["history"].append({"role": "Didi", "content": doc_response["speech_response"]})
                    save_db()  # ✓ CRITICAL: Persist history
                    return {
                        "ai_data": doc_response,
                        "composite_user_id": device_id,
                        "show_form": False,
                        "show_document_upload": False,
                        "action": doc_response.get("action")
                    }
    
    # ── STEP 5: DOCUMENT UPLOAD ──
    if current_step == STEP_DOCUMENT_UPLOAD:
        scheme_config = get_scheme_config(session["selected_scheme"])
        
        # Detect document upload: either the flag is set OR the frontend sent the sentinel text
        doc_was_uploaded = document_uploaded or user_input.strip().lower() == "document_uploaded"

        # If document was uploaded, record it and advance to next
        if doc_was_uploaded:
            if "uploaded_documents" not in session:
                session["uploaded_documents"] = {}

            # Use provided document_id, or infer from current index
            if not document_id:
                doc_fields = [f for f in scheme_config.get("form_fields", []) if f.get("type") == "file"]
                idx = session.get("document_index", 0)
                if idx < len(doc_fields):
                    document_id = doc_fields[idx]["id"]

            if document_id:
                # Store the file URL if provided, otherwise mark as uploaded
                doc_value = form_field_value if form_field_value else True
                session["uploaded_documents"][document_id] = doc_value
                # Also store in form_data so it shows in the review card
                if form_field_value:
                    session["form_data"][document_id] = form_field_value

            # Advance to next document
            current_doc_index = session.get("document_index", 0) + 1
            session["document_index"] = current_doc_index
            save_db()

        current_doc_index = session.get("document_index", 0)
        doc_response = _build_document_request_response(session, scheme_config, current_doc_index)
        
        if doc_response:
            # Still more documents to collect
            session["history"].append({"role": "Didi", "content": doc_response["speech_response"]})
            return {
                "ai_data": doc_response,
                "composite_user_id": device_id,
                "show_form": False,
                "show_document_upload": True,
                "collected_data": session["form_data"]
            }
        else:
            # All documents collected! Auto-transition to REVIEW CONFIRMATION
            session["step"] = STEP_REVIEW_CONFIRMATION
            review_response = _build_review_confirmation_response(session, scheme_config)
            
            session["history"].append({"role": "Didi", "content": review_response["speech_response"]})
            save_db()
            return {
                "ai_data": review_response,
                "composite_user_id": device_id,
                "show_form": False,
                "show_review": True,
            }
    
    # ── STEP 5.5: REVIEW CONFIRMATION (NEW) ──
    if current_step == STEP_REVIEW_CONFIRMATION:
        scheme_config = get_scheme_config(session["selected_scheme"])
        lang = session.get("language", "en")
        
        # First time showing review (from document collection) - AUTO-SHOW without waiting for input
        if not session.get("reviewing"):
            session["reviewing"] = True
            review_response = _build_review_confirmation_response(session, scheme_config)
            session["history"].append({"role": "Didi", "content": review_response["speech_response"]})
            save_db()
            return {
                "ai_data": review_response,
                "composite_user_id": device_id,
                "show_review": True,
            }
        
        # User HAS provided input on the review screen - process their choice
        submit_patterns = [r"\b(submit|confirm|ok|okay|sure|proceed|go|continue|finaliz)\b", r"^\s*(yes|हाँ|ಹೌದು|అవున్నవ)\s*$"]
        wants_to_submit = any(re.search(pat, user_input.lower()) for pat in submit_patterns)
        
        edit_patterns = [r"\b(edit|change|modify|update|fix)\s+(.+)", r"^edit\s+(.+)", r"^change\s+(.+)"]
        wants_to_edit = any(re.search(pat, user_input.lower()) for pat in edit_patterns)
        
        if wants_to_submit:
            session["step"] = STEP_SUBMISSION
            current_step = STEP_SUBMISSION
            # Fall through to process SUBMISSION immediately
        elif wants_to_edit:
            match = re.search(r"\b(edit|change|modify|update|fix)\s+(.+)", user_input.lower())
            if match:
                field_name = match.group(2).strip()
                form_fields = scheme_config.get("form_fields", [])
                
                matching_field = None
                for field in form_fields:
                    label = _get_label(field, lang).lower()
                    if field_name in label or label.find(field_name) >= 0:
                        matching_field = field
                        break
                
                if matching_field:
                    session["step"] = STEP_EDIT_FIELD
                    session["editing_field"] = matching_field["id"]
                    edit_response = _build_edit_field_response(session, scheme_config, matching_field["id"])
                    session["history"].append({"role": "Didi", "content": edit_response["speech_response"]})
                    save_db()
                    return {
                        "ai_data": edit_response,
                        "composite_user_id": device_id,
                    }
            
            # Field not found, ask for clarification
            review_response = _build_review_confirmation_response(session, scheme_config)
            response = {
                "speech_response": f"I didn't find that field. Please try again or say 'Submit' to finalize.\n\n{review_response['speech_response']}",
                "action": "review_confirmation",
            }
            session["history"].append({"role": "Didi", "content": response["speech_response"]})
            save_db()
            return {
                "ai_data": response,
                "composite_user_id": device_id,
                "show_review": True,
            }
        else:
            # Invalid input, show review again with guidance
            review_response = _build_review_confirmation_response(session, scheme_config)
            response = {
                "speech_response": f"Ready? Say 'Submit' to confirm or 'Edit [field]' to make changes.\n\n{review_response['speech_response']}",
                "action": "review_confirmation",
            }
            session["history"].append({"role": "Didi", "content": response["speech_response"]})
            save_db()
            return {
                "ai_data": response,
                "composite_user_id": device_id,
                "show_review": True,
            }
            # Extract field name from input
            match = re.search(r"\b(edit|change|modify|update|fix)\s+(.+)", user_input.lower())
            if match:
                field_name = match.group(2).strip()
                # Try to find matching field
                form_fields = scheme_config.get("form_fields", [])
                lang = session.get("language", "en")
                
                matching_field = None
                for field in form_fields:
                    label = _get_label(field, lang).lower()
                    if field_name in label or label.find(field_name) >= 0:
                        matching_field = field
                        break
                
                if matching_field:
                    session["step"] = STEP_EDIT_FIELD
                    session["editing_field"] = matching_field["id"]
                    edit_response = _build_edit_field_response(session, scheme_config, matching_field["id"])
                    session["history"].append({"role": "Didi", "content": edit_response["speech_response"]})
                    return {
                        "ai_data": edit_response,
                        "composite_user_id": device_id,
                        "show_form": False,
                    }
        
        if not wants_to_submit and not wants_to_edit:
            # Invalid input, show review again with guidance
            review_response = _build_review_confirmation_response(session, scheme_config)
            response = {
                "speech_response": f"Ready? Say 'Submit' to confirm or 'Edit [field]' to make changes.\n\n{review_response['speech_response']}",
                "action": "review_confirmation",
            }
            session["history"].append({"role": "Didi", "content": response["speech_response"]})
            save_db()
            return {
                "ai_data": response,
                "composite_user_id": device_id,
                "show_review": True,
            }
        
        # If wants_to_submit, fall through to SUBMISSION handler
        current_step = session["step"]
    
    # ── STEP 5.6: EDIT FIELD (NEW) ──
    if current_step == STEP_EDIT_FIELD:
        scheme_config = get_scheme_config(session["selected_scheme"])
        editing_field = session.get("editing_field")
        
        if not editing_field:
            # Ask which field to edit
            form_fields = scheme_config.get("form_fields", [])
            fields_list = "\n".join([f"- {_get_label(f, session.get('language', 'en'))}" for f in form_fields])
            
            response = {
                "speech_response": f"Which field would you like to edit?\n\n{fields_list}",
                "action": "choose_field_to_edit",
                "fields": [f["id"] for f in form_fields],
            }
            return {"ai_data": response, "composite_user_id": device_id, "show_form": False}
        else:
            # User has chosen field, now capturing the new value
            new_value = user_input.strip()
            if new_value:
                session["form_data"][editing_field] = new_value
                session["editing_field"] = None
                session["step"] = STEP_REVIEW_CONFIRMATION
                
                # Go back to review
                review_response = _build_review_confirmation_response(session, scheme_config)
                session["history"].append({"role": "Didi", "content": f"✅ Updated! Back to review screen...\n\n{review_response['speech_response']}"})
                return {
                    "ai_data": review_response,
                    "composite_user_id": device_id,
                    "show_form": False,
                    "show_review": True,
                }
    
    # ── STEP 6: SUBMISSION (Enhanced) ──
    if current_step == STEP_SUBMISSION:
        scheme_config = get_scheme_config(session["selected_scheme"])
        
        # Generate application ID
        application_id = generate_application_id()
        session["application_id"] = application_id
        
        # Build application record
        application_record = {
            "application_id": application_id,
            "scheme_id": session.get("selected_scheme"),
            "scheme_name": scheme_config.get("scheme_name"),
            "user_id": device_id,
            "status": "submitted",
            "form_data": session.get("form_data", {}),
            "uploaded_documents": session.get("uploaded_documents", {}),
            "eligibility_answers": session.get("eligibility_answers", {}),
            "submitted_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "admin_notes": "",
            "admin_id": None,
        }
        
        # Save to database
        save_application(application_record)
        save_db()
        
        # Build application card response
        app_card_response = _build_application_card_response(session, scheme_config, application_id)
        
        session["step"] = STEP_COMPLETED
        session["history"].append({"role": "Didi", "content": app_card_response["speech_response"]})
        return {
            "ai_data": app_card_response,
            "composite_user_id": device_id,
            "show_form": False,
            "submitted": True,
            "application_id": application_id,
        }
    
    # ── FALLBACK: Only use RAG if not in active flow steps ──
    # Don't fall back to RAG if we're in the middle of eligibility, form, document, review, or edit steps
    if current_step not in [STEP_ELIGIBILITY_CHECK, STEP_FORM_FILLING, STEP_DOCUMENT_UPLOAD, STEP_REVIEW_CONFIRMATION, STEP_EDIT_FIELD]:
        kb_result = _retrieve_from_knowledge_base(user_input)
        if kb_result and kb_result.get("answer"):
            response = {
                "speech_response": kb_result["answer"],
                "action": "info",
                "kb_context": kb_result["answer"]
            }
        else:
            response = {
                "speech_response": "I'm not sure I understand. Would you like to know about any government scheme or apply for one?",
                "action": "clarify"
            }
    else:
        # In active flow but no handler matched - ask user to clarify
        response = {
            "speech_response": "Please provide your response to continue.",
            "action": "clarify"
        }
    
    session["history"].append({"role": "Didi", "content": response["speech_response"]})
    return {"ai_data": response, "composite_user_id": device_id, "show_form": False}


# ──────────────────────────────────────────────
# Document Upload Handler
# ──────────────────────────────────────────────

def handle_document_upload(device_id: str, document_id: str, file_info: dict) -> dict:
    """Handle document upload and move to next document or submission."""
    session = _get_session(device_id)
    
    if session["step"] != STEP_DOCUMENT_UPLOAD:
        return {"error": "Not in document upload phase"}
    
    session["uploaded_documents"][document_id] = file_info
    session["document_index"] = session.get("document_index", 0) + 1
    
    scheme_config = get_scheme_config(session["selected_scheme"])
    
    # Check if more documents needed
    doc_response = _build_document_request_response(session, scheme_config, session["document_index"])
    
    if doc_response:
        return {"ai_data": doc_response, "show_document_upload": True}
    else:
        # All documents uploaded, ready for submission
        session["step"] = STEP_SUBMISSION
        response = _build_submission_response(session, scheme_config)
        session["step"] = STEP_COMPLETED
        return {"ai_data": response, "show_form": False, "submitted": True}


# ──────────────────────────────────────────────
# Skip Documents Handler (for testing)
# ──────────────────────────────────────────────

def skip_documents(device_id: str) -> dict:
    """Skip document upload phase for testing."""
    session = _get_session(device_id)
    session["step"] = STEP_SUBMISSION
    
    scheme_config = get_scheme_config(session["selected_scheme"])
    response = _build_submission_response(session, scheme_config)
    session["step"] = STEP_COMPLETED
    
    return {"ai_data": response, "show_form": False, "submitted": True}


# ──────────────────────────────────────────────
# Public KB Access
# ──────────────────────────────────────────────

def retrieve_from_knowledge_base(query: str) -> Optional[dict]:
    """Public wrapper for KB access."""
    return _retrieve_from_knowledge_base(query)
