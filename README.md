# Facebook Page Analytics & Gemini AI Dashboard

A full-stack, enterprise-grade Facebook Page management and analytics platform. Built with **Next.js 16 (App Router)** and **FastAPI (Python 3.12)**, integrated with **Meta Graph API v22.0**, **Google Gemini AI**, and **PostgreSQL**.

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-00c7b7?style=for-the-badge&logo=render&logoColor=white)](https://fb-dashboard-frontend.onrender.com)
[![API Docs](https://img.shields.io/badge/FastAPI_Docs-Swagger-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fb-dashboard-backend-5kcd.onrender.com/docs)

### 🌐 Live Deployment
**Frontend App:** [https://fb-dashboard-frontend.onrender.com](https://fb-dashboard-frontend.onrender.com)  
**Backend Swagger Docs:** [https://fb-dashboard-backend-5kcd.onrender.com/docs](https://fb-dashboard-backend-5kcd.onrender.com/docs)

</div>

---

## Visual Showcase

<div align="center">

| | |
| :---: | :---: |
| ![Screenshot 1](imgs/1.png) | ![Screenshot 2](imgs/2.png) |
| ![Screenshot 3](imgs/3.png) | ![Screenshot 4](imgs/4.png) |
| ![Screenshot 5](imgs/5.png) | ![Screenshot 6](imgs/6.png) |

</div>

---

## Key Highlights & Features

- **Facebook OAuth 2.0 Integration**:
  - Authenticate using Auth.js (NextAuth v5).
  - Securely acquires user and page access tokens.
  - Persists permanent Facebook user IDs (`account.providerAccountId`) across sessions to maintain consistent conversation history.
- **Automated Page Token Exchange**:
  - Dynamically verifies page ownership against `/me/accounts`.
  - Exchanges user tokens for page access tokens on demand, keeping tokens encrypted in the server session.
- **Deep Analytics & Metric Isolation**:
  - Concurrent fetching of Page metadata, last 25 posts, and engagement insights.
  - Resilient design: Deprecated or restricted metrics (e.g. 100+ follower threshold) gracefully report warnings without failing the entire dashboard.
  - Statistical calculations (averages, cadence, top/bottom performing posts) processed in Python.
- **Gemini AI Strategic Insights**:
  - Structured JSON evaluation generating a holistic Page Health Score (0–100).
  - Identifies content strengths, weaknesses, and optimal posting times.
  - Generates prioritized, actionable content ideas and recommendations.
- **Context-Grounded Conversational AI Chatbot**:
  - Integrated directly into the dashboard (bottom-right collapsible drawer).
  - Grounded strictly on real-time page telemetry, post engagement stats, and the last 5 conversation messages.
  - Enforces strict anti-hallucination guardrails: off-topic queries are respectfully declined.
  - PostgreSQL persistence with conversation history management (new chat creation, switching past conversations, and message deletion).
- **Production-Ready Docker Architecture**:
  - Next.js standalone build with optimized asset layering.
  - Python FastAPI multi-stage container.
  - Zero-config deployment readiness for Render, Railway, AWS, or local Docker Compose.

---

## Architecture & Data Flow

```mermaid
flowchart TD
    User["User Browser"] -->|"1. Sign in with Facebook"| NextAuth["Next.js Frontend & Auth.js"]
    NextAuth -->|"2. OAuth Callback & User Token"| FBAuth["Meta Graph API OAuth"]
    
    User -->|"3. View Page Dashboard"| NextApp["Next.js Server Route"]
    NextApp -->|"4. Authenticated Request with Server Token"| FastApi["FastAPI Backend"]
    
    FastApi -->|"5. Verify Ownership & Exchange Page Token"| GraphAPI["Meta Graph API v22.0"]
    GraphAPI -->|"6. Metadata, Posts, Insights"| FastApi
    
    FastApi -->|"7. Page Telemetry Payload"| Gemini["Google Gemini AI"]
    Gemini -->|"8. Structured Insights & Health Score"| FastApi
    
    FastApi -->|"9. Unified JSON Contract"| NextApp
    NextApp -->|"10. Render Reactive Dashboard"| User

    User -->|"11. Chatbot Query"| NextChat["Frontend Chat API Proxy"]
    NextChat -->|"12. Grounded Chat Request"| FastApiChat["FastAPI Chat Service"]
    FastApiChat <-->|"13. Fetch / Persist Last 5 Messages"| Postgres[("PostgreSQL Database")]
    FastApiChat -->|"14. Grounded Prompt with Page Context"| GeminiChat["Google Gemini"]
    GeminiChat -->|"15. Guardrailed Answer"| FastApiChat
    FastApiChat -->|"16. Deliver Response"| User
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack, Standalone Output)
- **Language**: TypeScript
- **Authentication**: Auth.js / NextAuth v5 (Facebook Provider)
- **Styling**: Tailwind CSS & Lucide Icons
- **Data Visualization**: Recharts (Responsive bar, area, and line charts)

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Package Manager**: `uv` / `pip`
- **Validation**: Pydantic v2 & Pydantic Settings
- **HTTP Client**: HTTPX (Async requests with retry backoff)
- **Database & ORM**: SQLAlchemy 2.0 (AsyncIO) + `asyncpg` / `psycopg2`
- **LLM Integration**: Google GenAI SDK (`google-genai`) with Gemini 2.5/3.8 Flash

### Infrastructure & Database
- **Database**: PostgreSQL (Neon Serverless or Docker PostgreSQL)
- **Containerization**: Docker (Multi-stage Next.js standalone & Alpine Python)
- **Production Host**: Render / Self-hosted Docker

---

## Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── config.py              # Pydantic environment configuration
│   │   ├── database.py            # Async SQLAlchemy engine & session factory
│   │   ├── main.py                # FastAPI entrypoint, CORS, lifespan & health
│   │   ├── models.py              # PostgreSQL models (Conversation, Message)
│   │   ├── schemas.py             # Pydantic input/output validation schemas
│   │   ├── routers/
│   │   │   ├── chat.py            # Chat endpoints (ask, conversations, messages)
│   │   │   └── dashboard.py       # Page analytics & AI insight router
│   │   └── services/
│   │       ├── analysis.py        # Deterministic statistics & post metrics
│   │       ├── chat.py            # Grounded chat service with DB context
│   │       ├── facebook.py        # Meta Graph API client & token exchanger
│   │       └── gemini.py          # Gemini AI structured JSON extractor
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile                 # Backend container definition
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # Auth.js route handlers
│   │   │   └── pages/[id]/        # Server proxies for dashboard & chat
│   │   ├── login/                 # Facebook OAuth sign-in view
│   │   ├── pages/                 # Managed page selector view
│   │   ├── pages/[id]/            # Main interactive analytics dashboard
│   │   ├── globals.css            # Custom CSS & cursor hand rules
│   │   └── layout.tsx             # Root layout with fonts & providers
│   ├── lib/
│   │   └── auth.ts                # NextAuth config with permanent user ID fix
│   ├── types/                     # TypeScript definitions for contracts & chat
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile                 # Next.js standalone container definition
│   └── next.config.ts             # Standalone output configuration
├── docs/
│   ├── api-contract.md            # Canonical API contract specification
│   ├── dashboard.example.json     # Mock payload matching contract
│   └── images/                    # Placeholder directory for showcase images
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

```ini
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Meta Graph API
GRAPH_API_VERSION=v22.0

# CORS Allowed Origins (Comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.onrender.com

# PostgreSQL Connection String (AsyncPG)
# Example: postgresql+asyncpg://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?ssl=require
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/fb_dashboard

# Chatbot Context History Depth
CHAT_HISTORY_LIMIT=5
```

### Frontend (`frontend/.env.local`)

```ini
# Meta Developer Credentials
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Auth.js / NextAuth Configuration
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Backend API Endpoint
BACKEND_URL=http://localhost:8000
```

---

## Meta Developer Portal Setup

To allow Facebook Login and Page Insights to function, configure your Meta App:

1. **Create an App**: In [developers.facebook.com](https://developers.facebook.com/apps/), select **Business** or **Consumer** type.
2. **App Domains**:
   - Go to **App Settings** → **Basic**.
   - Add `localhost` and your production domain (e.g. `onrender.com`).
3. **Site URL**:
   - In **App Settings** → **Basic**, scroll to **Website** (or click **+ Add Platform** → **Website**).
   - Enter `http://localhost:3000/` (or `https://your-frontend.onrender.com/`).
4. **OAuth Redirect URIs**:
   - Go to **Use Cases** → **Authentication and account creation** → **Customize** → **Settings** (or direct link: `https://developers.facebook.com/apps/<APP_ID>/fb-login/settings/`).
   - Add:
     - `http://localhost:3000/api/auth/callback/facebook`
     - `https://your-frontend.onrender.com/api/auth/callback/facebook`
5. **Permissions Requested**:
   - `email`
   - `pages_show_list`
   - `pages_read_engagement`
   - `read_insights`
   - `pages_read_user_content`

---

## Local Development Quickstart

### Prerequisites
- **Python**: 3.12+ (with [uv](https://docs.astral.sh/uv/) or `pip`)
- **Node.js**: 20+ (with `npm`)
- **PostgreSQL**: Local instance or a free [Neon](https://neon.tech) cloud database

---

### Step 1: Backend Setup

```bash
cd backend

# Create virtual environment and install dependencies
uv sync
# OR with pip:
# python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and DATABASE_URL

# Start FastAPI server
uv run uvicorn app.main:app --reload --port 8000
```

- API Base: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

### Step 2: Frontend Setup

In a new terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, and NEXTAUTH_SECRET

# Start development server
npm run dev
```

- Web Application: `http://localhost:3000`

---

## Docker Deployment Guide

Both frontend and backend are fully dockerized.

### 1. Build & Run Backend Container

```bash
cd backend

# Build Docker image
docker build -t fb-dashboard-backend .

# Run container
docker run -d \
  --name fb-backend-container \
  -p 8000:8000 \
  --env-file .env \
  fb-dashboard-backend
```

### 2. Build & Run Frontend Standalone Container

The frontend utilizes Next.js **standalone output** for minimal image size and fast boot times.

```bash
cd frontend

# 1. Build standalone production output
npm run build

# 2. Copy static files into standalone directory
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# 3. Build Docker image
docker build -t fb-dashboard-frontend .

# 4. Run container
docker run -d \
  --name fb-frontend-container \
  -p 3000:3000 \
  --env-file .env.local \
  -e AUTH_TRUST_HOST=true \
  fb-dashboard-frontend
```

---

## Database Schema (PostgreSQL)

The system automatically provisions its schema on startup through SQLAlchemy lifespan handlers:

```text
Table: conversations
├── id (String UUID, Primary Key)
├── user_id (String, Indexed)        <-- Permanent Facebook User ID
├── page_id (String, Indexed)        <-- Facebook Page ID
├── title (String)                   <-- Derived from first user query
├── created_at (DateTime UTC)
└── updated_at (DateTime UTC)

Table: chat_messages
├── id (String UUID, Primary Key)
├── conversation_id (Foreign Key -> conversations.id, ON DELETE CASCADE)
├── role (String: 'user' | 'model')
├── content (Text)
└── created_at (DateTime UTC, Indexed)
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and model version check |
| `GET` | `/api/v1/pages/{page_id}/dashboard` | Computes full Page analytics & Gemini AI recommendations |
| `POST` | `/api/v1/chat/ask` | Sends query with page context and saves message to DB |
| `GET` | `/api/v1/chat/conversations` | Lists conversations for a specific `user_id` and `page_id` |
| `GET` | `/api/v1/chat/conversations/{id}/messages` | Fetches historical messages for a conversation |
| `DELETE` | `/api/v1/chat/conversations/{id}` | Deletes a conversation and its messages |

---

## Troubleshooting & FAQ

### 1. `UntrustedHost: Host must be trusted`
- **Cause**: NextAuth / Auth.js v5 enforces strict host checking when running in production containers (`NODE_ENV=production`).
- **Solution**: Ensure `trustHost: true` is set in `frontend/lib/auth.ts` and `AUTH_TRUST_HOST=true` is set in your container environment.

### 2. Facebook `Can't load URL: The domain of this URL isn't included in the app's domains`
- **Cause**: The current domain or OAuth redirect callback is not whitelisted in Meta Developer Console.
- **Solution**: Add your domain (e.g. `onrender.com`) to **App Settings** → **Basic** → **App Domains**, and verify `https://<your-app>.onrender.com/api/auth/callback/facebook` is in **Valid OAuth Redirect URIs**.

### 3. User ID changes across logins
- **Cause**: Auth.js default fallback assigns random UUIDs (`crypto.randomUUID()`) to `token.sub` on every sign-in when no database adapter is used.
- **Solution**: Resolved in `frontend/lib/auth.ts` by extracting and persisting `account.providerAccountId` (the immutable Facebook User ID) during the `jwt` callback.

### 4. Database SSL connection error with Neon
- **Cause**: Cloud PostgreSQL providers like Neon require SSL.
- **Solution**: Ensure your connection string includes `?ssl=require` (or `sslmode=require`), and use the async driver: `postgresql+asyncpg://...`.

---

## License

This project is licensed under the MIT License.
