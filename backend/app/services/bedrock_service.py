import boto3
from ..config import AWS_REGION, KNOWLEDGE_BASE_ID

def ask_didi_bedrock(user_query: str) -> str:
    """
    Sends the user's question to the Amazon Bedrock Knowledge Base.
    Returns the clean text answer.
    """
    client = boto3.client('bedrock-agent-runtime', region_name=AWS_REGION)
    
    # We are in us-east-1 now, so we can use the direct standard ID!
    model_id = "amazon.nova-pro-v1:0"

    try:
        response = client.retrieve_and_generate(
            input={
                'text': user_query
            },
            retrieveAndGenerateConfiguration={
                'type': 'KNOWLEDGE_BASE',
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': KNOWLEDGE_BASE_ID,
                    # Dynamically building the correct ARN for us-east-1
                    'modelArn': f"arn:aws:bedrock:{AWS_REGION}::foundation-model/{model_id}"
                }
            }
        )
        
        final_answer = response['output']['text']
        return final_answer

    except Exception as e:
        print(f"Bedrock Error: {e}")
        # Raising the error so it prints exactly what went wrong in the terminal, just in case
        raise e