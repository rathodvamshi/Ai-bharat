#!/usr/bin/env python3
"""Quick endpoint verification script."""
from app.main import app
from app.database import load_db

load_db()
print('✓ Backend imported successfully\n')

route_list = [r for r in app.routes if hasattr(r, 'path')]
print(f'✓ Total routes: {len(route_list)}\n')

api_endpoints = sorted([r.path for r in app.routes if hasattr(r, 'path') and '/api' in r.path])
print(f'✓ API endpoints ({len(api_endpoints)} total):\n')
for ep in api_endpoints:
    print(f'  {ep}')

print('\n' + '='*60)
print('CONNECTION STATUS:\n')

# Test imports
try:
    from app.config import AWS_REGION, KNOWLEDGE_BASE_ID, BEDROCK_KB_MODEL_ARN, BEDROCK_MODEL_ID
    print(f'✓ AWS_REGION: {AWS_REGION}')
    print(f'✓ KNOWLEDGE_BASE_ID: {KNOWLEDGE_BASE_ID}')
    print(f'✓ BEDROCK_MODEL_ID: {BEDROCK_MODEL_ID}')
    print(f'✓ BEDROCK_KB_MODEL_ARN: {BEDROCK_KB_MODEL_ARN[:50]}...')
except Exception as e:
    print(f'✗ Config error: {e}')

try:
    from app.aws_client import transcribe_audio, synthesize_speech
    print(f'✓ AWS clients loaded (transcribe, synthesize)')
except Exception as e:
    print(f'✗ AWS clients error: {e}')

try:
    from app.services.bedrock_service import ask_didi_bedrock, retrieve_from_knowledge_base
    print(f'✓ Bedrock service loaded')
except Exception as e:
    print(f'✗ Bedrock service error: {e}')

try:
    from app.database import get_db, save_db, add_conversation_message
    db = get_db()
    print(f'✓ Database loaded ({len(db)} records)')
except Exception as e:
    print(f'✗ Database error: {e}')

print('\n' + '='*60)
