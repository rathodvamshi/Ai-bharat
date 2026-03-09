# Jan-Sahayak (जन सहायक) - AI-Powered Government Scheme Assistant

An AI-powered voice assistant that helps Indian citizens discover and apply for government welfare schemes through natural conversation in multiple languages.

![Jan Sahayak](logo.png)

## Features

- **Voice-First Interface**: Speak naturally to interact with the AI assistant "Didi"
- **Multi-Language Support**: English, Hindi, Telugu, Tamil, Bengali, Marathi
- **Smart Eligibility Check**: AI-powered eligibility verification before application
- **Form Assistance**: Voice-guided form filling with auto-speak responses
- **Document Upload**: Easy document upload with preview
- **Application Tracking**: Track application status (Pending, Approved, Rejected)
- **Admin Dashboard**: Review and manage applications

## Tech Stack

### Frontend
- **Next.js 16** with React 19
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations
- **Web Speech API** for voice recognition and synthesis

### Backend
- **FastAPI** (Python 3.10+)
- **AWS Bedrock** with Nova Pro model for AI responses
- **AWS S3** for document storage
- **AWS Bedrock Knowledge Base** for scheme information retrieval

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # JSON-based database
│   │   ├── schemas.py           # Pydantic models
│   │   └── services/
│   │       └── bedrock_service.py  # AI service
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── components/          # React components
│   │   ├── admin/               # Admin dashboard
│   │   └── contexts/            # React contexts
│   └── package.json
└── knowledge_base/              # Scheme documentation
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- AWS Account with Bedrock access
- Groq API key (optional, for fallback)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your AWS credentials

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Backend (.env)
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-s3-bucket-name
KNOWLEDGE_BASE_ID=your_knowledge_base_id
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
GROQ_API_KEYS=your_groq_api_key
```

## Supported Government Schemes

- PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)
- PM-JAY (Ayushman Bharat)
- PM Awas Yojana
- MUDRA Yojana
- Kisan Credit Card (KCC)
- PM SVANidhi
- PMFBY (Crop Insurance)
- Atal Pension Yojana
- Stand-Up India

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/process-text` | POST | Process user text/voice input |
| `/api/v1/upload` | POST | Upload documents |
| `/api/v1/applications` | GET | Get user applications |
| `/api/v1/admin/applications` | GET | Admin: Get all pending applications |
| `/api/v1/admin/applications/{id}/status` | PUT | Admin: Update application status |

## License

This project was created for the AWS Hackathon.

## Team

Built with ❤️ for Indian citizens
