#!/usr/bin/env python3
"""Test conversation flow as per user's planned workflow"""
import json
import urllib.request
import time
import sys

if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 80)
print("TESTING JAN-SAHAYAK CONVERSATION FLOW")
print("=" * 80)

def send_message(text, user_id="test_user", **kwargs):
    """Send a message and get response"""
    data = {'text': text, 'user_id': user_id, 'language': 'en-IN'}
    data.update(kwargs)
    
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            ai_data = result.get('ai_data', {})
            return {
                'action': ai_data.get('action'),
                'response': ai_data.get('speech_response', ''),
                'field_label': ai_data.get('field_label'),
                'field_id': ai_data.get('field_id'),
                'field_type': ai_data.get('field_type'),
                'current_index': ai_data.get('current_field_index'),
                'total': ai_data.get('total_fields'),
                'all_data': ai_data
            }
    except Exception as e:
        print(f"     [ERROR] {str(e)[:80]}")
        return None

# Step 1: Greeting
print("\n[STEP 1] User: Hello")
resp = send_message("Hello")
if resp:
    print(f"[OK] Action: {resp['action']}")
    print(f"     Response: {resp['response'][:80]}...")

# Step 2: Ask about PM Kisan
print("\n[STEP 2] User: Tell me about PM kisan")
resp = send_message("Tell me about PM kisan")
if resp:
    print(f"[OK] Action: {resp['action']}")
    print(f"     Question: {resp['response'][:80]}...")

# Step 3-6: Eligibility questions
print("\n[STEPS 3-6] Eligibility Questions")
answers = ["1", "1", "2", "2"]  # User's answers from the conversation
for i, answer in enumerate(answers, 1):
    print(f"     Q{i}: User answers '{answer}'")
    resp = send_message(answer)
    if resp:
        print(f"          Action: {resp['action']}")
        if resp['action'] == 'eligible':
            print(f"          → User is ELIGIBLE!")

# Step 7: User says "continue"  
print("\n[STEP 7] User: continue")
resp = send_message("continue")
if resp:
    print(f"[OK] Action: {resp['action']}")
    print(f"     Response: {resp['response'][:80]}...")
    print(f"     Field asking for: {resp['field_label']}")
    print(f"     Field type: {resp['field_type']}")
    if resp['action'] != 'form_field':
        print(f"     ⚠ ISSUE: Expected 'form_field' but got '{resp['action']}'")

# Step 8: User provides form field answer
print("\n[STEP 8] User: John Doe")
resp = send_message("John Doe")
if resp:
    print(f"[OK] Action: {resp['action']}")
    print(f"     Response: {resp['response'][:80]}...")
    if resp['field_label']:
        print(f"     Next field: {resp['field_label']} ({resp['current_index']+1} of {resp['total']})")

# Step 9: Continue with another field
print("\n[STEP 9] User: 123456789012 (Aadhaar)")
resp = send_message("123456789012")
if resp:
    print(f"[OK] Action: {resp['action']}")
    print(f"     Response: {resp['response'][:80]}...")
    if resp['field_label']:
        print(f"     Next field: {resp['field_label']} ({resp['current_index']+1} of {resp['total']})")

print("\n" + "=" * 80)
print("[✓] Conversation flow test completed!")
print("=" * 80)
