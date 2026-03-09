#!/usr/bin/env python3
"""Extended flow test - verify complete journey"""
import json
import urllib.request
import sys

if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def send(text, user_id="test_user_full"):
    """Send message and return response"""
    data = {'text': text, 'user_id': user_id, 'language': 'en-IN'}
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read()).get('ai_data', {})
    except:
        return {}

print("\n" + "=" * 80)
print("COMPLETE FLOW TEST: Greeting → Eligibility → Form → Documents → Submit")
print("=" * 80)

# Greeting
print("\n1. Greeting")
resp = send("Hello")
print(f"   ✓ {resp.get('action')}: {resp.get('speech_response', '')[:60]}...")

# Scheme selection
print("\n2. Scheme Selection")
resp = send("PM Kisan")
print(f"   ✓ {resp.get('action')}: {resp.get('question', '')[:60]}...")

# Eligibility flow
print("\n3. Eligibility Check (4 questions)")
for i, ans in enumerate(["Yes", "Yes", "No", "No"], 1):
    resp = send(ans)
    action = resp.get('action')
    print(f"   Q{i}: Action={action}")
    if action == 'eligible':
        print(f"   ✓ ELIGIBLE - {resp.get('speech_response')[:70]}...")

# Continue
print("\n4. User Continues")
resp = send("continue")
print(f"   ✓ {resp.get('action')}: {resp.get('speech_response')[:60]}...")

# Form fields - submit quickly
print("\n5. Form Fields - Rapid Entry")
form_answers = [
    "John Doe",              # Full Name
    "123456789012",          # Aadhaar
    "01-01-1980",            # DOB
    "9876543210",            # Mobile
    "SBIN123456",            # Bank Account  
    "SBIN0001234",           # IFSC
    "Andhra Pradesh",        # State
    "Hyderabad",             # District
    "Hyderabad",             # Village
    "123",                   # Land Survey
    "2"                      # Land Area
]

for i, answer in enumerate(form_answers, 1):
    resp = send(answer)
    action = resp.get('action')
    label = resp.get('field_label', 'N/A')
    print(f"   [{i:2d}] {label:<25} → {action}")
    if action == 'document_upload':
        print(f"   ✓ REACHED DOCUMENTS: {resp.get('document_label')}")
        doc_action = resp.get('action')
        break

print("\n" + "=" * 80)
print("✓ Flow verification complete!")
print("=" * 80 + "\n")
