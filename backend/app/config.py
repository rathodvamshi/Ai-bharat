import os
from dotenv import load_dotenv

load_dotenv()

"""
Centralised configuration for the Jan‑Sahayak backend.

All values are sourced from environment variables so the same codebase
can run locally, on EC2, or inside AWS Lambda without changes.
"""

# ==========================
# CORE AWS ENV VARIABLES
# ==========================
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

# Storage for audio uploads / artefacts
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Bedrock Knowledge Base configuration (RAG over S3 PDFs)
KNOWLEDGE_BASE_ID = (os.getenv("KNOWLEDGE_BASE_ID") or "").strip().strip('"').strip("'")

# Primary foundation model used for direct Bedrock calls
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-pro-v1:0")

# Model ARN used by the Bedrock Knowledge Base RetrieveAndGenerate API.
# Must match the region where your Knowledge Base lives (e.g. us-east-1 for jansahayak-kb).
# Override via BEDROCK_KB_MODEL_ARN if your KB uses a different model.
_raw_kb_arn = (os.getenv("BEDROCK_KB_MODEL_ARN") or "").strip().strip('"').strip("'")
BEDROCK_KB_MODEL_ARN = (
    _raw_kb_arn
    if _raw_kb_arn
    else f"arn:aws:bedrock:{AWS_REGION}::foundation-model/{BEDROCK_MODEL_ID}"
)

# Generic debugging flag
DEBUG_MODE = os.getenv("DEBUG_MODE", "False").lower() in ("true", "1", "t")
