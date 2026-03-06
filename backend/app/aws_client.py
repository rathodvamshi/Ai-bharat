import boto3
import time
import uuid
import os
from .config import AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

# --------------------------------------------------------------------------
# AWS Client Singletons (initialized once, reused across Lambda invocations)
# --------------------------------------------------------------------------
polly_client = boto3.client(
    "polly",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

# Note: AWS Transcribe is NOT subscribed on this account (SubscriptionRequiredException).
# Speech-to-Text is handled by the browser via Web Speech API instead.
# The transcribe_client is kept here for future use when subscription is activated.
transcribe_client = boto3.client(
    "transcribe",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

dynamodb = boto3.resource(
    "dynamodb",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

USERS_TABLE_NAME = "JanSahayak_Users"

def get_users_table():
    """Ensures the Dynamodb table exists and returns it."""
    try:
        table = dynamodb.create_table(
            TableName=USERS_TABLE_NAME,
            KeySchema=[
                {'AttributeName': 'user_id', 'KeyType': 'HASH'}  # Partition key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'user_id', 'AttributeType': 'S'},
                {'AttributeName': 'phone', 'AttributeType': 'S'}
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            },
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'PhoneIndex',
                    'KeySchema': [
                        {'AttributeName': 'phone', 'KeyType': 'HASH'}
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    },
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ]
        )
        # Wait for table to be created
        table.meta.client.get_waiter('table_exists').wait(TableName=USERS_TABLE_NAME)
        return table
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        return dynamodb.Table(USERS_TABLE_NAME)

# Initialize table on import
users_table = get_users_table()


def synthesize_speech(text: str, voice_id: str = "Aditi", language_code: str = "hi-IN") -> bytes:
    """
    Converts text to speech using Amazon Polly.
    
    Args:
        text: The text to convert to speech (supports Hindi, Telugu via Aditi voice)
        voice_id: Polly voice ID (default: "Aditi" — supports Hindi/Telugu)
        language_code: Language code for the voice (default: "hi-IN")
    
    Returns:
        Raw MP3 audio bytes
    
    Supported voices for Indian languages:
        - "Aditi" → Hindi (hi-IN) — also handles Telugu via phonetics
        - "Kajal"  → Hindi (hi-IN) — neural, more natural
    """
    # Aditi is a standard engine voice; use standard not neural for Hindi
    try:
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            Engine="standard",       # "standard" works with Aditi for Hindi
            LanguageCode="hi-IN",    # Force hi-IN for Aditi voice compatibility
        )
        return response["AudioStream"].read()
    except Exception as e:
        print(f"Polly synthesis error (voice={voice_id}): {e}")
        # Try fallback with minimal params
        response = polly_client.synthesize_speech(
            Text=text[:3000],      # Polly limit is 3000 chars for standard
            OutputFormat="mp3",
            VoiceId="Aditi",
        )
        return response["AudioStream"].read()


def transcribe_audio(file_path: str, bucket_name: str, language_code: str = "hi-IN") -> str:
    """
    [CURRENTLY UNAVAILABLE] Transcribes audio using Amazon Transcribe.
    
    Requires AWS Transcribe subscription on this account.
    Current status: SubscriptionRequiredException
    
    Use Web Speech API in the browser as the alternative.
    This function is preserved for when the subscription is activated.
    """
    raise NotImplementedError(
        "AWS Transcribe is not subscribed on this account. "
        "Use Web Speech API (browser-native) for Speech-to-Text instead. "
        "See frontend/app/page.tsx for the useSpeechRecognition hook."
    )