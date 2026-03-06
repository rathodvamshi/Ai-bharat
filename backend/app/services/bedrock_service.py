import boto3
import json
import re
from ..config import AWS_REGION, KNOWLEDGE_BASE_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

# ==========================================
# DIDI'S STATE MACHINE SYSTEM PROMPT
# ==========================================
# Key fix: $search_results$ and $question$ are the exact template vars
# that Bedrock Knowledge Base substitutes. Must use them verbatim.
SYSTEM_PROMPT = """You are Didi, a friendly and helpful AI government assistant for Indian citizens.
Your mission: Guide citizens to find and apply for government welfare schemes.

Conversation context from official government documents:
<search_results>
$search_results$
</search_results>

Citizen's message: <question>$question$</question>

BEHAVIORAL RULES:
- Speak simply, like talking to a farmer or daily-wage worker. No jargon.
- Use Hindi words naturally (e.g., "Namaskar", "aapka", "theek hai").
- Based on the conversation, determine which STATE you are in:

STATE 1 — EXPLORE:
  Use when: User is asking what a scheme is or if they qualify.
  Action: Explain the scheme's benefits and eligibility in 2-3 simple sentences.
  End by asking: "Kya aap is yojana ke liye apply karna chahte hain?"

STATE 2 — INTERVIEW:
  Use when: User wants to apply OR is providing personal details.
  Action: Look at "required_user_fields" in the search results.
  Ask for ONE missing field at a time. Extract and save any details mentioned.
  Example: "Aapka poora naam kya hai?" or "Aapki varshik aay kitni hai?"

STATE 3 — REVIEW:
  Use when: ALL required fields have been collected (no nulls remaining).
  Action: Read back all collected details and ask: "Kya main aapka form submit kar doon?"
  If user says Yes/Haan/Submit → set is_ready_to_submit to true.

CRITICAL OUTPUT RULE:
You MUST respond with ONLY a valid JSON object. No markdown. No explanation. No text before or after the JSON.
The JSON must have exactly these 4 keys:

{
  "current_state": "Explore",
  "speech_response": "Write the exact words Didi will say to the citizen here.",
  "extracted_data": {},
  "is_ready_to_submit": false
}

For "extracted_data": include any personal info the citizen mentioned (name, age, income, land size, business type, etc.) as key-value pairs.
Use snake_case keys. Set value to null if not yet provided.
Example: {"name": "Ramaiah", "age": 45, "annual_income": null}

REMEMBER: Output ONLY the JSON object. Nothing else."""


def ask_didi_bedrock(user_query: str, session_id: str = None) -> dict:
    """
    Sends the user's question to Amazon Bedrock Knowledge Base.
    Uses the Didi State Machine prompt to generate structured JSON responses.
    
    Returns:
        dict with keys:
            - "ai_data": parsed JSON from Didi (current_state, speech_response, extracted_data, is_ready_to_submit)
            - "session_id": Bedrock session ID for multi-turn conversation memory
    
    Raises:
        Exception: If Bedrock call fails entirely (caller should handle gracefully)
    """
    client = boto3.client(
        'bedrock-agent-runtime',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

    model_arn = f"arn:aws:bedrock:{AWS_REGION}::foundation-model/amazon.nova-pro-v1:0"

    request_params = {
        'input': {
            'text': user_query
        },
        'retrieveAndGenerateConfiguration': {
            'type': 'KNOWLEDGE_BASE',
            'knowledgeBaseConfiguration': {
                'knowledgeBaseId': KNOWLEDGE_BASE_ID,
                'modelArn': model_arn,
                'generationConfiguration': {
                    'promptTemplate': {
                        'textPromptTemplate': SYSTEM_PROMPT
                    }
                }
            }
        }
    }

    # Attach session ID for multi-turn memory (Bedrock maintains context)
    if session_id:
        request_params['sessionId'] = session_id

    raw_text = None
    try:
        response = client.retrieve_and_generate(**request_params)

        raw_text = response['output']['text']
        new_session_id = response.get('sessionId', session_id)

        print(f"[Bedrock] Raw output (first 400 chars): {raw_text[:400]}")

        # -------------------------------------------------------
        # JSON Extraction: Try multiple strategies in order
        # -------------------------------------------------------
        parsed_response = _extract_json(raw_text)

        # Validate required keys exist
        _validate_ai_response(parsed_response)

        print(f"[Bedrock] Parsed OK. State: {parsed_response.get('current_state')}")

        return {
            "ai_data": parsed_response,
            "session_id": new_session_id
        }

    except json.JSONDecodeError as e:
        print(f"[Bedrock] JSON parse error: {e}")
        print(f"[Bedrock] Problematic raw text: {raw_text}")

        # Build a graceful response from whatever text we got
        fallback_speech = raw_text[:500] if raw_text else "Mujhe samajhne mein thodi dikkat ho rahi hai. Kripya dobara bolein."
        return {
            "ai_data": _fallback_response(fallback_speech),
            "session_id": session_id
        }

    except Exception as e:
        print(f"[Bedrock] Unexpected error: {type(e).__name__}: {e}")
        return {
            "ai_data": _fallback_response(),
            "session_id": session_id
        }


def _extract_json(text: str) -> dict:
    """
    Attempts to extract a JSON object from LLM output using multiple strategies.
    Strategy 1: Direct parse (if output is clean JSON)
    Strategy 2: Find JSON block between { ... } with regex
    Strategy 3: Strip markdown code fences and retry
    """
    text = text.strip()

    # Strategy 1: Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Strip markdown fences (```json ... ```)
    cleaned = re.sub(r'```(?:json)?\s*', '', text)
    cleaned = re.sub(r'```\s*$', '', cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 3: Regex find the largest { ... } block
    matches = list(re.finditer(r'\{', text))
    for match in reversed(matches):  # Try from last opening brace backwards
        start = match.start()
        # Find matching closing brace
        depth = 0
        for i, ch in enumerate(text[start:]):
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    candidate = text[start: start + i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    # Strategy 4: Build synthetic response from plain text
    raise json.JSONDecodeError("No valid JSON found in output", text, 0)


def _validate_ai_response(data: dict) -> None:
    """Ensures all required keys exist, filling in defaults where missing."""
    data.setdefault("current_state", "Explore")
    data.setdefault("speech_response", "Namaskar! Aap kaunsi yojana ke baare mein jaanna chahte hain?")
    data.setdefault("extracted_data", {})
    data.setdefault("is_ready_to_submit", False)

    # Ensure is_ready_to_submit is a bool
    if not isinstance(data["is_ready_to_submit"], bool):
        data["is_ready_to_submit"] = str(data["is_ready_to_submit"]).lower() in ("true", "1", "yes")

    # Ensure extracted_data is a dict
    if not isinstance(data.get("extracted_data"), dict):
        data["extracted_data"] = {}


def _fallback_response(speech: str = None) -> dict:
    """Returns a graceful fallback if Bedrock fails entirely."""
    return {
        "current_state": "Error",
        "speech_response": speech or (
            "Namaskar! Main abhi thodi technical samasya mein hoon. "
            "Kripya ek minute baad phir se bolein."
        ),
        "extracted_data": {},
        "is_ready_to_submit": False
    }