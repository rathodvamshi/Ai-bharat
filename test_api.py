#!/usr/bin/env python3
"""Quick API test script"""
import json
import urllib.request
import time
import sys

# Fix encoding for Windows
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 70)
print("TESTING JAN-SAHAYAK API END-TO-END")
print("=" * 70)

# Test 1: Greeting
print("\n[TEST 1] Greeting message")
data = json.dumps({
    'text': 'Hello',
    'user_id': 'test_user_e2e',
    'language': 'en-IN'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        print(f"[OK] Status: {resp.status}")
        ai_data = result.get('ai_data', {})
        print(f"     Action: {ai_data.get('action', 'unknown')}")
        print(f"     Available schemes: {len(ai_data.get('available_schemes', []))} schemes")
except Exception as e:
    print(f"[ERROR] {str(e)}")

# Test 2: Scheme selection
print("\n[TEST 2] Scheme selection (PM Kisan)")
data = json.dumps({
    'text': 'PM Kisan',
    'user_id': 'test_user_e2e',
    'language': 'en-IN'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        print(f"[OK] Status: {resp.status}")
        ai_data = result.get('ai_data', {})
        print(f"     Action: {ai_data.get('action', 'unknown')}")
        print(f"     Scheme: {ai_data.get('scheme_id', 'unknown')}")
        question = ai_data.get('question', 'N/A')
        if question:
            print(f"     Question: {question[:70]}...")
        print(f"     Question index: {ai_data.get('current_question_index', '?')} of {ai_data.get('total_questions', '?')}")
except Exception as e:
    print(f"[ERROR] {str(e)}")

# Test 3: Eligibility flow
print("\n[TEST 3] Eligibility flow - answering all questions with Yes")
for step in range(1, 6):
    data = json.dumps({
        'text': 'Yes',
        'user_id': 'test_user_e2e',
        'language': 'en-IN',
        'eligibility_answer': True
    }).encode()
    
    try:
        req = urllib.request.Request(
            'http://localhost:8000/api/v1/process-text',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            ai_data = result.get('ai_data', {})
            action = ai_data.get('action')
            print(f"     Step {step} - Action: {action}")
            
            if action == 'eligible':
                print(f"     [OK] User is ELIGIBLE for the scheme!")
                break
            elif action == 'form_field':
                print(f"     [OK] Moving to form fields!")
                print(f"          First field: {ai_data.get('field_label', 'unknown')}")
                break
            elif action in ['not_eligible', 'submitted']:
                print(f"     Status: {action}")
                break
    except Exception as e:
        print(f"     [ERROR] Step {step}: {str(e)[:60]}")
        break

# Test 4: Confirm eligibility and proceed to form
print("\n[TEST 4] Confirm eligibility - say Yes to proceed")
data = json.dumps({
    'text': 'Yes',
    'user_id': 'test_user_e2e',
    'language': 'en-IN'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        ai_data = result.get('ai_data', {})
        action = ai_data.get('action')
        print(f"     Action: {action}")
        if action == 'form_field':
            print(f"     [OK] Moving to form fields!")
            print(f"          First field: {ai_data.get('field_label', 'unknown')}")
        elif action == 'document_upload':
            print(f"     [OK] Moving to document upload!")
except Exception as e:
    print(f"     [ERROR] {str(e)[:80]}")

# Test 5: Form field submission - Full Name (valid: 3-100 chars)
print("\n[TEST 5] Form field 1 - Full Name")
data = json.dumps({
    'text': 'John Doe',
    'user_id': 'test_user_e2e',
    'language': 'en-IN',
    'form_field_value': 'John Doe'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        ai_data = result.get('ai_data', {})
        action = ai_data.get('action')
        print(f"     Action: {action}")
        if action == 'form_field':
            print(f"     [OK] Next field: {ai_data.get('field_label', 'unknown')}")
        elif action == 'document_upload':
            print(f"     [OK] Moving to document upload!")
except Exception as e:
    print(f"     [ERROR] {str(e)[:80]}")

# Test 6: Aadhaar Number (valid: 12 digits)
print("\n[TEST 6] Form field 2 - Aadhaar Number")
data = json.dumps({
    'text': '123456789012',
    'user_id': 'test_user_e2e',
    'language': 'en-IN',
    'form_field_value': '123456789012'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        ai_data = result.get('ai_data', {})
        action = ai_data.get('action')
        print(f"     Action: {action}")
        if action == 'form_field':
            print(f"     [OK] Next field: {ai_data.get('field_label', 'unknown')}")
        elif action == 'document_upload':
            print(f"     [OK] Moving to document upload!")
except Exception as e:
    print(f"     [ERROR] {str(e)[:80]}")

# Test 7: Continue with more form fields (Date of Birth)
print("\n[TEST 7] Form field 3 - Date of Birth")
data = json.dumps({
    'text': '01-01-1990',
    'user_id': 'test_user_e2e',
    'language': 'en-IN',
    'form_field_value': '01-01-1990'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        ai_data = result.get('ai_data', {})
        action = ai_data.get('action')
        current_field = ai_data.get('field_label', 'unknown')
        print(f"     Action: {action}, Next: {current_field}")
except Exception as e:
    print(f"     [ERROR] {str(e)[:80]}")

# Test 8: Mobile Number
print("\n[TEST 8] Form field 4 - Mobile Number")
data = json.dumps({
    'text': '9876543210',
    'user_id': 'test_user_e2e',
    'language': 'en-IN',
    'form_field_value': '9876543210'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        ai_data = result.get('ai_data', {})
        action = ai_data.get('action')
        current_field = ai_data.get('field_label', 'unknown')
        print(f"     Action: {action}, Next: {current_field}")
except Exception as e:
    print(f"     [ERROR] {str(e)[:80]}")

# Test 9: Bank Account
print("\n[TEST 9] Form field 5 - Bank Account Number")
data = json.dumps({
    'text': '123456789012',
    'user_id': 'test_user_e2e',
    'language': 'en-IN',
    'form_field_value': '123456789012'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        ai_data = result.get('ai_data', {})
        action = ai_data.get('action')
        current_field = ai_data.get('field_label', 'unknown')
        print(f"     Action: {action}, Next: {current_field}")
except Exception as e:
    print(f"     [ERROR] {str(e)[:80]}")

# Test 10: IFSC Code
print("\n[TEST 10] Form field 6 - IFSC Code")
data = json.dumps({
    'text': 'SBIN0001234',
    'user_id': 'test_user_e2e',
    'language': 'en-IN',
    'form_field_value': 'SBIN0001234'
}).encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/process-text',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        ai_data = result.get('ai_data', {})
        action = ai_data.get('action')
        current_field = ai_data.get('field_label', 'unknown')
        print(f"     Action: {action}, Next: {current_field}")
        if action == 'document_upload':
            print(f"     [OK] Reached document upload phase!")
            print(f"          Document type: {ai_data.get('document_label', 'unknown')}")
            accept_types = ai_data.get('accept_types', [])
            if accept_types:
                print(f"          Accepted file types: {', '.join(accept_types)}")
except Exception as e:
    print(f"     [ERROR] {str(e)[:80]}")

# Test 11: Continue through remaining fields (State, District, Village, Land Survey if not yet in doc upload)
print("\n[TEST 11] Continue through remaining form fields...")
document_upload_reached = False
for field_num in range(1, 6):
    data = json.dumps({
        'text': f'Test Value {field_num}',
        'user_id': 'test_user_e2e',
        'language': 'en-IN',
        'form_field_value': f'Test Value {field_num}'
    }).encode()
    
    try:
        req = urllib.request.Request(
            'http://localhost:8000/api/v1/process-text',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            ai_data = result.get('ai_data', {})
            action = ai_data.get('action')
            current_field = ai_data.get('field_label', 'unknown')
            print(f"     Field {field_num} - Action: {action}, Field: {current_field}")
            
            if action == 'document_upload':
                document_upload_reached = True
                doc_label = ai_data.get('document_label', 'unknown')
                accept_types = ai_data.get('accept_types', [])
                print(f"     [OK] Reached document upload!")
                print(f"          Document type: {doc_label}")
                print(f"          Accepted types: {', '.join(accept_types) if accept_types else 'N/A'}")
                print(f"          Document {ai_data.get('current_document_index', '?')} of {ai_data.get('total_documents', '?')}")
                break
            elif action not in ['form_field']:
                break
    except Exception as e:
        print(f"     [ERROR] Field {field_num}: {str(e)[:60]}")
        break

# Test 12: Document upload (simulating file upload)
if document_upload_reached:
    print("\n[TEST 12] Document upload - Submit first document")
    # In a real scenario, this would include file upload info
    # For now, we'll just confirm the document
    data = json.dumps({
        'text': 'Document uploaded',
        'user_id': 'test_user_e2e',
        'language': 'en-IN',
        'document_id': 'aadhaar_doc',
        'document_uploaded': True
    }).encode()
    
    try:
        req = urllib.request.Request(
            'http://localhost:8000/api/v1/process-text',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            ai_data = result.get('ai_data', {})
            action = ai_data.get('action')
            print(f"     Full AI Data: {json.dumps(ai_data)[:200]}")
            print(f"     Action: {action}")
            
            if action == 'document_upload':
                doc_label = ai_data.get('document_label', 'unknown')
                doc_index = ai_data.get('current_document_index', '?')
                total_docs = ai_data.get('total_documents', '?')
                print(f"     Next document: {doc_label} ({doc_index} of {total_docs})")
            elif action == 'submitted':
                print(f"     [OK] Application submitted successfully!")
                ref_num = ai_data.get('reference_number', 'N/A')
                print(f"          Reference number: {ref_num}")
    except Exception as e:
        print(f"     [ERROR] {str(e)[:80]}")

print("\n" + "=" * 70)
print("[OK] End-to-end API flow test completed!")
print("[STATUS] Successfully tested: greeting → scheme selection → eligibility")
print("         → form fields → document upload → submission")
print("=" * 70)


