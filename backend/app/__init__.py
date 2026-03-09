"""
AWS Lambda entrypoint for the Jan-Sahayak FastAPI app.

This keeps the FastAPI ASGI app in main.py but exposes a Lambda-style
handler using Mangum so you can deploy the same backend behind
API Gateway or Lambda URLs without changing application code.
"""

from mangum import Mangum

from .main import app

handler = Mangum(app)
