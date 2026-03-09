# Deployment Guide - Jan-Sahayak

This guide explains how to deploy the Jan-Sahayak application with:
- **Frontend**: AWS Amplify
- **Backend**: Railway

---

## Prerequisites

1. AWS Account with access to:
   - AWS Amplify
   - S3 (for audio storage)
   - Bedrock (for AI features)
   - Polly (for TTS)

2. Railway account (https://railway.app)

3. Git repository (GitHub recommended for easy integration)

---

## Backend Deployment (Railway)

### Step 1: Push code to GitHub

Make sure your backend code is in a GitHub repository.

### Step 2: Create Railway Project

1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select the repository
5. Select the `backend` folder as the root directory

### Step 3: Configure Environment Variables

In Railway dashboard, go to your service → **Variables** tab and add:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-s3-bucket-name
KNOWLEDGE_BASE_ID=your_knowledge_base_id
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
BEDROCK_KB_MODEL_ARN=arn:aws:bedrock:ap-south-1::foundation-model/amazon.nova-pro-v1:0
GROQ_API_KEYS=your_groq_api_key_1,your_groq_api_key_2
DEBUG_MODE=False
```

### Step 4: Deploy

Railway will automatically detect the `Procfile` and deploy your FastAPI app.

After deployment, note your Railway URL (e.g., `https://your-project.up.railway.app`)

### Step 5: Verify Backend

Test your backend by visiting:
```
https://your-project.up.railway.app/docs
```

---

## Frontend Deployment (AWS Amplify)

### Step 1: Prepare Frontend

The frontend is already configured with:
- `amplify.yml` - Build configuration
- Environment variable support via `NEXT_PUBLIC_API_URL`

### Step 2: Create Amplify App

1. Go to AWS Console → AWS Amplify
2. Click **"Host web app"**
3. Select your Git provider (GitHub)
4. Authorize and select your repository
5. Select the branch to deploy (e.g., `main`)
6. **Important**: Set the app root to `frontend` folder

### Step 3: Configure Build Settings

AWS Amplify should auto-detect the `amplify.yml`. Verify the settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Step 4: Add Environment Variables

In Amplify Console → App Settings → **Environment variables**, add:

```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

Replace with your actual Railway backend URL.

### Step 5: Deploy

Click **"Save and deploy"**. Amplify will build and deploy your Next.js app.

### Step 6: Configure Custom Domain (Optional)

1. Go to Amplify → Domain management
2. Add your custom domain
3. Follow the DNS configuration instructions

---

## Post-Deployment Checklist

### Backend (Railway)
- [ ] API docs accessible at `/docs`
- [ ] Health check endpoint working
- [ ] AWS credentials configured correctly
- [ ] S3 bucket accessible
- [ ] Bedrock Knowledge Base connected

### Frontend (AWS Amplify)
- [ ] App loads without errors
- [ ] Voice assistant connects to backend
- [ ] Authentication working
- [ ] Forms submitting correctly

---

## CORS Configuration

The backend is already configured to allow all origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, you may want to restrict this to your Amplify domain only.

---

## Troubleshooting

### Frontend not connecting to backend
1. Check `NEXT_PUBLIC_API_URL` is set correctly in Amplify
2. Ensure the URL doesn't have a trailing slash
3. Check Railway logs for API errors

### Railway deployment failing
1. Check `requirements.txt` has all dependencies
2. Verify `Procfile` exists and is correct
3. Check Railway build logs

### AWS Amplify build failing
1. Verify `amplify.yml` is in the `frontend` folder
2. Check Node.js version compatibility
3. Review Amplify build logs

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (default: ap-south-1) |
| `S3_BUCKET_NAME` | S3 bucket for audio files |
| `KNOWLEDGE_BASE_ID` | Bedrock Knowledge Base ID |
| `BEDROCK_MODEL_ID` | Bedrock model ID |
| `GROQ_API_KEYS` | Groq API keys (comma-separated) |
| `DEBUG_MODE` | Enable debug mode (False in production) |

### Frontend (AWS Amplify)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (Railway URL) |

---

## Security Notes

1. Never commit `.env` files to Git
2. Use AWS IAM roles with minimum required permissions
3. Consider restricting CORS in production
4. Enable HTTPS (both Railway and Amplify support this by default)
