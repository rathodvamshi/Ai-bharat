"""
bedrock_service.py — Intent-first AI orchestration for Jan-Sahayak.

Conversation flow: Intent → Action → Form (NOT Form → Form → Form)

  1. GREETING: User says hello → Didi introduces herself, asks intent.
  2. INTENT: User asks about schemes → RAG-grounded answer (mandatory from KB).
  3. APPLICATION: Only when user wants to apply → collect name, phone, village, aadhaar, scheme.

Intent detection, conversation memory (last 10 turns), and dynamic step control
ensure the AI never forces form questions when the user is greeting or asking info.
"""

import boto3
import json
import re
import logging

from ..config import (
    AWS_REGION,
    KNOWLEDGE_BASE_ID,
    BEDROCK_KB_MODEL_ARN,
    DEBUG_MODE,
    BEDROCK_MODEL_ID,
)

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
MAX_HISTORY = 10   # last N user+assistant turns for context memory

# ──────────────────────────────────────────────
# Conversation steps (state machine)
# ──────────────────────────────────────────────
STEP_GREETING = "greeting"      # Intro + ask intent
STEP_INTENT = "intent"         # Answer scheme questions, offer to apply
STEP_APPLICATION = "application"  # Collect form fields

# ──────────────────────────────────────────────
# Session store: device_id → { step, history, collected_data }
# ──────────────────────────────────────────────
ACTIVE_SESSIONS: dict = {}

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _digits_only(text: str) -> str:
    """Strip every non-digit character from a string."""
    return re.sub(r"\D", "", str(text))


def _extract_phone_from_text(text: str) -> str | None:
    """
    Pure-Python phone extraction — no AI needed.
    Handles localised number words → digits for common Indic patterns via
    regex.  Returns a 10-digit string or None.
    """
    # 1. Prefer an explicit 10-digit run already in the text
    candidates = re.findall(r"\b\d[\d\s\-]{8,}\d\b", text)
    for c in candidates:
        digits = _digits_only(c)
        if len(digits) >= 10:
            return digits[-10:]   # take last 10 in case ISD prefix present

    # 2. Check if the entire utterance, once cleaned, is ≥10 digits
    all_digits = _digits_only(text)
    if len(all_digits) >= 10:
        return all_digits[-10:]

    return None


def _extract_name_from_text(text: str) -> str | None:
    """
    Lightweight name extraction — only fires on unambiguous explicit patterns.
    """
    _NON_NAMES = {
        "hello", "hi", "yes", "no", "okay", "ok", "thank", "thanks", "please",
        "sorry", "good", "fine", "haan", "nahi", "theek", "acha", "accha",
        "namaste", "helo", "hey", "sure", "done", "what", "how", "when",
    }
    patterns = [
        r"(?:my name is|i am called|mera naam hai|naam hai|mera naam)\s+([A-Za-z\u0900-\u097F]{2,30})",
        r"(?:main|mai)\s+([A-Za-z\u0900-\u097F]{2,30})\s+(?:hoon|hun|hu|hai|hain)",
        r"(?:i am|i'm)\s+([A-Za-z]{2,30})(?:\s|$)",
        r"^([A-Za-z\u0900-\u097F]{2,30})\s*[.!]?$",
    ]
    for pat in patterns:
        m = re.search(pat, text.strip(), re.IGNORECASE)
        if m:
            candidate = m.group(1).strip().capitalize()
            if candidate.lower() not in _NON_NAMES and len(candidate) >= 2:
                return candidate
    return None


# ──────────────────────────────────────────────
# Intent detection (CRITICAL: do NOT force form questions)
# ──────────────────────────────────────────────
INTENT_GREETING = "greeting"
INTENT_SCHEME_INFO = "scheme_info"
INTENT_APPLICATION = "application"
INTENT_STATUS = "status_check"
INTENT_UNKNOWN = "unknown"

_GREETING_PATTERNS = (
    r"\b(hello|hi|hey|namaste|namaskar|hola)\b",
    r"\b(kaun\s+ho|who\s+are\s+you|aap\s+kaun|tum\s+kaun)\b",
    r"\b(kya\s+karte\s+ho|what\s+do\s+you\s+do)\b",
    r"^\s*(hi|hello|hey)\s*[.!]?\s*$",
)
_SCHEME_PATTERNS = (
    r"\b(scheme|yojana|yojna)\b",
    r"\b(pm\s*[- ]?kisan|kisan|pmkisan)\b",
    r"\b(ayushman|bharat|awas|pmay)\b",
    r"\b(eligibility|eligible|kya\s+milega)\b",
    r"\b(batao|bataye|tell\s+me|about)\b.*\b(scheme|yojana)\b",
)
_APPLICATION_PATTERNS = (
    r"\b(apply|apply\s+karna|form\s+bharna)\b",
    r"\b(registration|register|aavedan)\b",
    r"\b(haan|yes|ji\s+haan|theek\s+hai)\b.*\b(apply|karna)\b",
)
_STATUS_PATTERNS = (
    r"\b(status|application\s+status|kya\s+hua)\b",
    r"\b(aavedan\s+ka\s+status|check\s+status)\b",
)


def _detect_intent(text: str, current_step: str) -> str:
    """
    Detect user intent from message.

    Order:
      1. Cheap regex heuristics.
      2. If still unknown → Bedrock classifier (LLM-based).
    """
    t = (text or "").strip().lower()
    if not t:
        return INTENT_UNKNOWN

    # 1. Regex / keyword heuristics
    for pat in _GREETING_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_GREETING

    for pat in _STATUS_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_STATUS

    for pat in _SCHEME_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_SCHEME_INFO

    for pat in _APPLICATION_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return INTENT_APPLICATION

    # Short affirmative after scheme_info → application
    if current_step == STEP_INTENT and re.search(r"^\s*(haan|yes|ji|ok|theek)\s*[.!]?\s*$", t):
        return INTENT_APPLICATION

    # 2. Fallback: Bedrock-based intent classification
    try:
        classified = _classify_intent_with_bedrock(t)
        if classified:
            return classified
    except Exception as exc:
        logger.warning("Intent classification via Bedrock failed: %s", exc)

    return INTENT_UNKNOWN


def _classify_intent_with_bedrock(text: str) -> str | None:
    """
    Use Nova Pro to classify high-level intent.

    Returns one of INTENT_* constants or None.
    """
    messages = [
        {"role": "user", "content": [{"text": text}]},
    ]
    system_prompt = (
        "You are an intent classifier for an Indian government assistant called Didi.\n"
        "Classify the user's LAST message into exactly one of these intents:\n"
        "  - greeting\n"
        "  - scheme_info   (asking about schemes, eligibility, benefits)\n"
        "  - application   (wants to apply, fill form, register)\n"
        "  - status_check  (asks about application status)\n"
        "  - other\n\n"
        'Return ONLY raw JSON: {"intent": "greeting|scheme_info|application|status_check|other"}.\n'
        "No explanation, no markdown."
    )

    result = _call_bedrock(messages=messages, system_prompt=system_prompt, max_tokens=40)
    label = (result.get("intent") or "").strip().lower()
    mapping = {
        "greeting": INTENT_GREETING,
        "hello": INTENT_GREETING,
        "scheme_info": INTENT_SCHEME_INFO,
        "info": INTENT_SCHEME_INFO,
        "information": INTENT_SCHEME_INFO,
        "application": INTENT_APPLICATION,
        "apply": INTENT_APPLICATION,
        "form": INTENT_APPLICATION,
        "status_check": INTENT_STATUS,
        "status": INTENT_STATUS,
        "track": INTENT_STATUS,
    }
    return mapping.get(label)


# Form fields in collection order (used for step-by-step prompting)
FORM_FIELDS = ["name", "phone", "village", "aadhaar", "scheme"]


def _get_next_form_field(collected: dict) -> str | None:
    """Return the next empty form field key, or None if all collected."""
    for key in FORM_FIELDS:
        val = collected.get(key)
        if not val or (isinstance(val, str) and not val.strip()):
            return key
    return None


def _normalize_form_key(raw: str) -> str:
    """Map LLM output keys to our form field names."""
    m = {
        "name": "name", "full_name": "name", "fullname": "name",
        "phone": "phone", "mobile": "phone", "phone_number": "phone",
        "village": "village", "gaon": "village",
        "aadhaar": "aadhaar", "aadhar": "aadhaar",
        "scheme": "scheme", "scheme_name": "scheme",
    }
    k = (raw or "").strip().lower().replace(" ", "_")
    return m.get(k, k)


def _default_collected_data() -> dict:
    return {k: None for k in FORM_FIELDS}


def _call_bedrock(messages: list[dict], system_prompt: str, max_tokens: int = 500) -> dict:
    """
    Thin wrapper around Bedrock invoke_model using the Nova converse format.
    Returns the parsed JSON dict from the AI, or raises on failure.

    Robust JSON extraction:
    - Strips markdown fences
    - Scans for the first {...} block in the response (handles prose wrappers)
    - If no valid JSON found, wraps the prose reply as a speech_response.
    """
    body = json.dumps(
        {
            "system": [{"text": system_prompt}],
            "messages": messages,
            "inferenceConfig": {"maxTokens": max_tokens},
        }
    )
    response = bedrock.invoke_model(modelId=MODEL_ID, body=body)
    raw = json.loads(response["body"].read())
    ai_text = raw["output"]["message"]["content"][0]["text"]

    # 1. Strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", ai_text).strip().strip("`")

    # 2. Try direct parse
    if cleaned:
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

    # 3. Scan for the first {...} block inside any surrounding prose
    #    This handles cases where the model says "Sure! Here is the JSON: {...}"
    match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # 4. Nothing worked — model replied in prose instead of JSON.
    #    Rather than raising (which triggers the generic error fallback),
    #    we wrap the prose text directly as the speech_response.
    #    The user still HEARS Didi's answer via Polly; form data is just empty.
    logger.warning("Bedrock returned prose instead of JSON — wrapping as speech_response")
    prose = ai_text.strip()
    return {
        "speech_response": prose,
        "extracted_data": {},
        "is_ready_to_submit": False,
    }


def _retrieve_from_knowledge_base(query: str, session_id: str | None = None) -> dict | None:
    """
    Query the configured Bedrock Knowledge Base (jansahayak-kb) so that Didi
    is grounded on your S3 PDFs and scheme data.

    Returns a dict:
        { "answer": str, "citations": list } or None on failure/disabled.
    """
    if not KNOWLEDGE_BASE_ID or not kb_client:
        logger.warning("[KB] Disabled: KNOWLEDGE_BASE_ID=%r, kb_client=%s", KNOWLEDGE_BASE_ID, "ok" if kb_client else "None")
        return None

    try:
        cfg = {
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": KNOWLEDGE_BASE_ID,
                "modelArn": BEDROCK_KB_MODEL_ARN,
            },
        }

        if DEBUG_MODE:
            logger.info(
                "[KB] Query=%r | region=%s | kb_id=%s | model=%s",
                query[:80],
                AWS_REGION,
                KNOWLEDGE_BASE_ID,
                BEDROCK_KB_MODEL_ARN.split("/")[-1] if "/" in BEDROCK_KB_MODEL_ARN else BEDROCK_KB_MODEL_ARN,
            )

        response = kb_client.retrieve_and_generate(
            input={"text": query},
            retrieveAndGenerateConfiguration=cfg,
        )

        output = response.get("output", {}) or {}
        answer_text = (output.get("text") or "").strip()
        citations = response.get("citations") or []

        if DEBUG_MODE and answer_text:
            logger.info("[KB] Success (len=%d): %s", len(answer_text), answer_text[:300].replace("\n", " "))
        elif DEBUG_MODE and not answer_text:
            logger.warning("[KB] Empty answer from retrieve_and_generate")

        if not answer_text:
            return None

        return {"answer": answer_text, "citations": citations}

    except Exception as exc:
        logger.error(
            "[KB] retrieve_and_generate FAILED: %s | query=%r | kb_id=%s | region=%s",
            exc,
            query[:50],
            KNOWLEDGE_BASE_ID,
            AWS_REGION,
        )
        if DEBUG_MODE:
            logger.exception("Full traceback for KB failure")
        return None


def retrieve_from_knowledge_base(query: str) -> dict | None:
    """Public wrapper for testing and direct KB access."""
    return _retrieve_from_knowledge_base(query)


def _build_bedrock_messages(history: list[dict]) -> list[dict]:
    """
    Convert our internal history (role: User/Didi) into Bedrock's
    [{"role": "user"/"assistant", "content": [{"text": "..."}]}] format.

    Bedrock strict rules enforced:
      1. First message MUST be role "user".
      2. Last message MUST be role "user".
      3. Roles must strictly alternate (no two consecutive same roles).
    """
    role_map = {"User": "user", "Didi": "assistant"}
    msgs = []

    for entry in history:
        role = role_map.get(entry["role"], "user")
        content = (entry.get("content") or "").strip()
        if not content:
            continue  # skip empty turns

        if msgs and msgs[-1]["role"] == role:
            # Merge consecutive same-role entries — bookkeeping artefact
            msgs[-1]["content"][0]["text"] += "\n" + content
        else:
            msgs.append({"role": role, "content": [{"text": content}]})

    # Rule 1: Strip any leading assistant messages — Bedrock must start with user
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)

    # Rule 2: Strip any trailing non-user messages — final turn must be user
    while msgs and msgs[-1]["role"] != "user":
        msgs.pop()

    # Fallback: empty history
    return msgs or [{"role": "user", "content": [{"text": "Hello"}]}]


# ──────────────────────────────────────────────
# Main entry point — Intent → Action → Form
# ──────────────────────────────────────────────

def ask_didi_bedrock(user_input: str, device_id: str) -> dict:
    """
    Process one user turn. Flow: Greeting → Intent → Application.

    - GREETING: User says hello → introduce Didi, ask what they want.
    - INTENT: User asks about schemes → RAG-grounded answer (mandatory from KB).
    - APPLICATION: User wants to apply → collect name, phone, village, aadhaar, scheme.

    Returns:
        {
            "ai_data": { "speech_response", "extracted_data", "is_ready_to_submit" },
            "composite_user_id": str  # device_id or phone when available
        }
    """
    # ── 1. Initialise session with intent-first state ──────────────────
    if device_id not in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS[device_id] = {
            "step": STEP_GREETING,
            "history": [],
            "collected_data": _default_collected_data(),
        }

    session = ACTIVE_SESSIONS[device_id]
    if "collected_data" not in session:
        session["collected_data"] = _default_collected_data()
    if "step" not in session:
        session["step"] = STEP_GREETING

    session["history"].append({"role": "User", "content": user_input})
    recent_history = session["history"][-MAX_HISTORY:]
    current_step = session["step"]
    collected = session["collected_data"]

    # ── 2. Intent detection (NEVER force form questions) ─────────────────
    intent = _detect_intent(user_input, current_step)
    logger.info("[%s] intent=%s step=%s", device_id, intent, current_step)

    # ── 3. GREETING: Introduce Didi + ask intent ───────────────────────────
    if intent == INTENT_GREETING or (current_step == STEP_GREETING and intent == INTENT_UNKNOWN):
        session["step"] = STEP_INTENT
        speech = (
            "Namaste! I am Didi — your government scheme assistant. "
            "I help you check eligibility and apply for government schemes like "
            "PM-Kisan, Ayushman Bharat, Pradhan Mantri Awas, and more. "
            "Would you like to: 1) Know about schemes, 2) Apply for a scheme, or 3) Check application status?"
        )
        didi_reply = {"speech_response": speech, "extracted_data": {}, "is_ready_to_submit": False}
        session["history"].append({"role": "Didi", "content": speech})
        return {"ai_data": didi_reply, "composite_user_id": device_id, "show_form": False}

    # ── 4. SCHEME_INFO: RAG-grounded answer (MANDATORY from Knowledge Base) ─
    if intent == INTENT_SCHEME_INFO or (current_step == STEP_INTENT and intent == INTENT_UNKNOWN):
        # If user is in the middle of form filling and asks a scheme question,
        # answer it but keep them in application step so they can resume.
        if current_step != STEP_APPLICATION:
            session["step"] = STEP_INTENT
        # ALWAYS query RAG for scheme questions — this is mandatory
        kb_result = _retrieve_from_knowledge_base(user_input, session_id=device_id)
        kb_context = (kb_result.get("answer") or "").strip() if kb_result else ""

        if not kb_context and KNOWLEDGE_BASE_ID:
            logger.warning("[%s] RAG returned empty for scheme query — using fallback", device_id)

        # Build messages with conversation memory
        bedrock_msgs = _build_bedrock_messages(recent_history)
        system_prompt = _build_scheme_info_prompt(kb_context, user_input)

        try:
            ai_data = _call_bedrock(
                messages=bedrock_msgs,
                system_prompt=system_prompt,
                max_tokens=600,
            )
        except Exception as exc:
            logger.error("[%s] Bedrock scheme_info error: %s", device_id, exc)
            ai_data = {
                "speech_response": (
                    "मुझे जानकारी लाने में समस्या आई। कृपया फिर से पूछें। "
                    "(I had trouble fetching info — please ask again.)"
                ),
                "extracted_data": {},
                "is_ready_to_submit": False,
            }

        _enforce_ai_data_types(ai_data)
        speech = ai_data.get("speech_response", "")
        session["history"].append({"role": "Didi", "content": speech})
        if kb_context:
            ai_data["kb_context"] = kb_context
        return {"ai_data": ai_data, "composite_user_id": device_id, "show_form": False}

    # ── 5. APPLICATION: User wants to apply — start/continue form collection ─
    if intent == INTENT_APPLICATION or current_step == STEP_APPLICATION:
        session["step"] = STEP_APPLICATION
        next_field = _get_next_form_field(collected)

        # If user just said "yes" to apply, give a warm intro before asking name
        if intent == INTENT_APPLICATION and not next_field:
            next_field = "name"  # restart flow (edge case)
        if intent == INTENT_APPLICATION and collected.get("name") is None and not _has_form_data(user_input):
            speech = (
                "Great! I will help you apply. "
                "What is your full name?"
            )
            didi_reply = {"speech_response": speech, "extracted_data": {}, "is_ready_to_submit": False}
            session["history"].append({"role": "Didi", "content": speech})
            return {"ai_data": didi_reply, "composite_user_id": device_id, "show_form": True}

        # RAG for eligibility/context during application too
        kb_result = _retrieve_from_knowledge_base(user_input, session_id=device_id)
        kb_context = (kb_result.get("answer") or "").strip() if kb_result else ""

        bedrock_msgs = _build_bedrock_messages(recent_history)
        system_prompt = _build_application_prompt(kb_context, collected, next_field)

        try:
            ai_data = _call_bedrock(
                messages=bedrock_msgs,
                system_prompt=system_prompt,
                max_tokens=600,
            )
        except Exception as exc:
            logger.error("[%s] Bedrock application error: %s", device_id, exc)
            ai_data = {
                "speech_response": "मुझे समस्या आई। कृपया फिर से बोलें।",
                "extracted_data": {},
                "is_ready_to_submit": False,
            }

        _enforce_ai_data_types(ai_data)
        extracted = ai_data.get("extracted_data") or {}
        for raw_key, v in extracted.items():
            if v is None or not str(v).strip():
                continue
            key = _normalize_form_key(raw_key)
            if key in FORM_FIELDS:
                collected[key] = str(v).strip()

        # Validate and normalise phone / Aadhaar before persisting
        collected, validation_msg = _validate_and_normalise_numbers(collected)
        session["collected_data"] = collected

        # If validation failed, override the model's reply to clearly ask again
        if validation_msg:
            ai_data["speech_response"] = validation_msg
            ai_data["is_ready_to_submit"] = False

        speech = ai_data.get("speech_response", "")
        session["history"].append({"role": "Didi", "content": speech})
        if kb_context:
            ai_data["kb_context"] = kb_context

        # Use merged collected_data as extracted_data for frontend/DB
        ai_data["extracted_data"] = {k: v for k, v in collected.items() if v}
        return {"ai_data": ai_data, "composite_user_id": device_id, "show_form": True}

    # ── 6. STATUS_CHECK or fallback ─────────────────────────────────────
    session["step"] = STEP_INTENT
    kb_result = _retrieve_from_knowledge_base(user_input, session_id=device_id)
    kb_context = (kb_result.get("answer") or "").strip() if kb_result else ""
    bedrock_msgs = _build_bedrock_messages(recent_history)
    system_prompt = _build_generic_prompt(kb_context)

    try:
        ai_data = _call_bedrock(
            messages=bedrock_msgs,
            system_prompt=system_prompt,
            max_tokens=600,
        )
    except Exception as exc:
        logger.error("[%s] Bedrock generic error: %s", device_id, exc)
        ai_data = {
            "speech_response": "मुझे समस्या आई। कृपया फिर से बोलें।",
            "extracted_data": {},
            "is_ready_to_submit": False,
        }

    _enforce_ai_data_types(ai_data)
    speech = ai_data.get("speech_response", "")
    session["history"].append({"role": "Didi", "content": speech})
    return {"ai_data": ai_data, "composite_user_id": device_id, "show_form": False}


def _has_form_data(text: str) -> bool:
    """Quick check if user likely provided name/phone/etc."""
    if _extract_phone_from_text(text):
        return True
    if _extract_name_from_text(text):
        return True
    return False


def _validate_and_normalise_numbers(collected: dict) -> tuple[dict, str]:
    """
    Validate phone and Aadhaar numbers and normalise them to digits-only.

    - phone: must be exactly 10 digits
    - aadhaar: must be exactly 12 digits
    """
    fixed = dict(collected)
    messages: list[str] = []

    phone = fixed.get("phone")
    if phone:
        digits = _digits_only(str(phone))
        if len(digits) != 10:
            fixed["phone"] = None
            messages.append(
                "Yeh phone number sahi nahi lag raha. Kripya 10 ank ka mobile number batayein."
            )
        else:
            fixed["phone"] = digits

    aadhaar = fixed.get("aadhaar")
    if aadhaar:
        digits = _digits_only(str(aadhaar))
        if len(digits) != 12:
            fixed["aadhaar"] = None
            messages.append(
                "Yeh Aadhaar number sahi nahi lag raha. Kripya 12 ank ka Aadhaar number batayein."
            )
        else:
            fixed["aadhaar"] = digits

    validation_message = " ".join(messages).strip()
    return fixed, validation_message


def _enforce_ai_data_types(ai_data: dict) -> None:
    if not isinstance(ai_data.get("extracted_data"), dict):
        ai_data["extracted_data"] = {}
    if not isinstance(ai_data.get("is_ready_to_submit"), bool):
        ai_data["is_ready_to_submit"] = False


def _build_scheme_info_prompt(kb_context: str, user_query: str) -> str:
    """System prompt for scheme-info phase. RAG context is MANDATORY when available."""
    parts = [
        "You are Didi, a friendly Indian government scheme assistant.",
        "The user is asking about government schemes. You MUST answer based ONLY on the OFFICIAL knowledge below.",
        "Rules:",
        "1. ALWAYS respond in valid JSON: {\"speech_response\": \"...\", \"extracted_data\": {}, \"is_ready_to_submit\": false}",
        "2. Put your conversational answer in speech_response. Use simple Hindi or Hinglish.",
        "3. Do NOT put anything in extracted_data for scheme-info questions.",
        "4. At the end, ask: 'Would you like to apply for this scheme?'",
        "5. If the knowledge base has no relevant info, explicitly say that you don't have official information and DO NOT invent details.",
    ]
    if kb_context:
        parts.append("OFFICIAL KNOWLEDGE (use this as ground truth, do NOT contradict it):\n" + kb_context)
    else:
        parts.append("No specific scheme data was retrieved. Give a brief, polite response and ask what scheme they are interested in.")
    return "\n".join(parts)


def _build_application_prompt(kb_context: str, collected: dict, next_field: str | None) -> str:
    """System prompt for application/form-collection phase."""
    field_labels = {
        "name": "full name",
        "phone": "10-digit phone number",
        "village": "village name",
        "aadhaar": "Aadhaar number",
        "scheme": "scheme name (e.g. PM-Kisan, Ayushman Bharat)",
    }
    collected_str = ", ".join(f"{k}={v}" for k, v in collected.items() if v)
    parts = [
        "You are Didi, helping the user apply for a government scheme.",
        "Rules:",
        "1. ALWAYS respond in valid JSON: {\"speech_response\": \"...\", \"extracted_data\": {...}, \"is_ready_to_submit\": false}",
        "2. Extract ONLY the fields the user explicitly provides into extracted_data (name, phone, village, aadhaar, scheme).",
        "3. Ask ONE question at a time. Already collected: " + (collected_str or "none") + ".",
        "4. Use simple Hindi or Hinglish. Be polite.",
        "5. Set is_ready_to_submit=true ONLY when user explicitly says to submit.",
        "6. When you have enough user details and official context, clearly state in speech_response "
        "whether the user appears ELIGIBLE or NOT ELIGIBLE for the scheme, and briefly explain why, "
        "using only the official context (do not guess).",
    ]
    if next_field:
        parts.append(f"The next field to collect is: {field_labels.get(next_field, next_field)}. After extracting, ask for the next field if needed.")
    if kb_context:
        parts.append(
            "Official scheme context (for eligibility and benefits). "
            "If you mention any amounts, years, or conditions, they MUST come from this text only:\n"
            + kb_context[:2000]
        )
    parts.append("OUTPUT FORMAT — raw JSON only, no markdown.")
    return "\n".join(parts)


def _build_generic_prompt(kb_context: str) -> str:
    """Fallback prompt for status check or unknown intent."""
    parts = [
        "You are Didi, a friendly Indian government scheme assistant.",
        "Respond in valid JSON: {\"speech_response\": \"...\", \"extracted_data\": {}, \"is_ready_to_submit\": false}",
        "Answer the user's question. If they ask about application status, say you can help and ask for their phone number.",
        "Use simple Hindi or Hinglish.",
    ]
    if kb_context:
        parts.append("Context:\n" + kb_context[:1500])
    return "\n".join(parts)