"""
database.py — Persistent JSON-file-backed storage for Jan-Sahayak.

Replaces the in-memory mock_applications_db dictionary so that data
survives server restarts and multi-day sessions.

Usage:
    from .database import load_db, save_db, get_db

The canonical live dict is obtained via get_db().  Every mutation
must be followed by save_db().  main.py is the only caller of save_db.
"""

import json
import os
import threading
import logging

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Path resolution — always relative to this file
# ──────────────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
# Goes up one level: backend/app/ → backend/
DB_PATH = os.path.join(_HERE, "..", "database.json")

# Thread lock so concurrent FastAPI requests don't corrupt the file
_lock = threading.Lock()

# Single in-process reference — loaded once on import, written on demand
_db: dict = {}


def load_db() -> dict:
    """
    Load (or initialise) the JSON database from disk.

    Called once at application startup.  If the file is missing or
    corrupt, an empty dict is returned and a fresh file is written.
    """
    global _db
    with _lock:
        if os.path.exists(DB_PATH):
            try:
                with open(DB_PATH, "r", encoding="utf-8") as fh:
                    _db = json.load(fh)
                logger.info("Loaded %d records from %s", len(_db), DB_PATH)
            except (json.JSONDecodeError, OSError) as exc:
                logger.error("database.json corrupt or unreadable (%s) — starting fresh.", exc)
                _db = {}
                # Overwrite the broken file immediately so we don't loop on errors
                _write_unsafe()
        else:
            _db = {}
            _write_unsafe()
            logger.info("Created new database.json at %s", DB_PATH)
    return _db


def save_db() -> None:
    """
    Atomically persist the current in-memory dict to disk.

    Uses a temp-file + rename strategy so a crash mid-write never
    produces a half-written (corrupt) JSON file.
    """
    with _lock:
        _write_unsafe()


def _write_unsafe() -> None:
    """Low-level write — caller must hold _lock."""
    tmp_path = DB_PATH + ".tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8") as fh:
            json.dump(_db, fh, indent=2, ensure_ascii=False)
        os.replace(tmp_path, DB_PATH)   # atomic on POSIX & Windows (Vista+)
    except OSError as exc:
        logger.error("Failed to write database.json: %s", exc)
        raise


def get_db() -> dict:
    """Return the live in-memory database dict."""
    return _db


# ──────────────────────────────────────────────
# Conversation history tracking (per user_id)
# ──────────────────────────────────────────────
def add_conversation_message(user_id: str, role: str, text: str, action: str = None, scheme: str = None) -> None:
    """
    Add a message to user's conversation history.
    role: 'user' or 'assistant'
    action: optional action type (greeting, info_response, eligibility_question, etc.)
    scheme: optional scheme_id if relevant
    """
    db = get_db()
    if "conversations" not in db:
        db["conversations"] = {}
    if user_id not in db["conversations"]:
        db["conversations"][user_id] = []
    
    db["conversations"][user_id].append({
        "role": role,
        "text": text,
        "action": action,
        "scheme": scheme,
        "timestamp": __import__('datetime').datetime.now().isoformat()
    })
    
    # Keep last 20 messages to avoid bloat
    if len(db["conversations"][user_id]) > 20:
        db["conversations"][user_id] = db["conversations"][user_id][-20:]


def get_conversation_history(user_id: str, limit: int = 10) -> list:
    """Get user's recent conversation history."""
    db = get_db()
    if "conversations" not in db or user_id not in db["conversations"]:
        return []
    history = db["conversations"][user_id]
    return history[-limit:] if limit else history


def get_last_scheme_context(user_id: str) -> str:
    """Get the scheme_id from the most recent scheme mention in history."""
    history = get_conversation_history(user_id, limit=5)
    for msg in reversed(history):
        if msg.get("scheme"):
            return msg["scheme"]
    return None


def clear_conversation_history(user_id: str) -> None:
    """Clear a user's conversation history."""
    db = get_db()
    if "conversations" in db and user_id in db["conversations"]:
        del db["conversations"][user_id]


# ──────────────────────────────────────────────
# Application Management (NEW)
# ──────────────────────────────────────────────

def save_application(application: dict) -> str:
    """Save an application to database and return application ID."""
    db = get_db()
    if "applications" not in db:
        db["applications"] = {}
    
    app_id = application.get("application_id")
    if not app_id:
        raise ValueError("Application must have an application_id")
    
    db["applications"][app_id] = application
    return app_id


def get_application(application_id: str) -> dict:
    """Get application by ID."""
    db = get_db()
    if "applications" not in db:
        return None
    return db["applications"].get(application_id, None)


def get_user_applications(user_id: str) -> list:
    """Get all applications for a user."""
    db = get_db()
    if "applications" not in db:
        return []
    
    user_apps = [
        app for app in db["applications"].values()
        if app.get("user_id") == user_id
    ]
    return sorted(user_apps, key=lambda x: x.get("submitted_at", ""), reverse=True)


def update_application_status(application_id: str, status: str, admin_notes: str = "", admin_id: str = None) -> bool:
    """Update application status (e.g., approved, rejected, pending_review)."""
    db = get_db()
    if "applications" not in db or application_id not in db["applications"]:
        return False
    
    app = db["applications"][application_id]
    app["status"] = status
    app["last_updated"] = __import__('datetime').datetime.now().isoformat()
    
    if admin_notes:
        app["admin_notes"] = admin_notes
    if admin_id:
        app["admin_id"] = admin_id
    
    return True


def get_pending_applications() -> list:
    """Get all applications for admin review (all non-final statuses)."""
    db = get_db()
    if "applications" not in db:
        return []

    # Final statuses that no longer need review
    final_statuses = {"approved", "rejected"}

    pending = [
        app for app in db["applications"].values()
        if isinstance(app, dict) and app.get("status", "").lower() not in final_statuses
    ]
    return sorted(pending, key=lambda x: x.get("submitted_at", ""), reverse=True)


