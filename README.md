# Facebook Page Analytics & Gemini AI Dashboard

A full-stack web application that allows users to authenticate with Facebook, select a managed Facebook Page, and view in-depth performance analytics paired with Gemini AI strategic recommendations.

---

## Architecture Overview

```
facebook-page-dashboard/
├── docs/
│   ├── api-contract.md            # Canonical API contract specification
│   └── dashboard.example.json     # Realistic mock data matching DTO contract
├── backend/                       # FastAPI Python 3.12+ service (port 8000)
│   ├── app/
│   │   ├── config.py              # Settings via pydantic-settings
│   │   ├── schemas.py             # Pydantic models matching API contract
│   │   ├── services/
│   │   │   ├── facebook.py        # Graph API v22.0 client & metric isolation
│   │   │   ├── analysis.py        # Server-side statistics calculation
│   │   │   └── gemini.py          # Gemini AI structured JSON extraction
│   │   ├── routers/
│   │   │   └── dashboard.py       # GET /api/v1/pages/{page_id}/dashboard
│   │   └── main.py                # FastAPI entrypoint, CORS & /health
│   ├── .env.example
│   └── README.md
└── frontend/                      # Next.js 16 App Router (port 3000)
    ├── app/
    │   ├── login/                 # Facebook OAuth login
    │   ├── pages/                 # List of managed Facebook Pages
    │   ├── pages/[id]/            # Full Page Analytics & AI Dashboard
    │   └── api/pages/[id]/dashboard/ # Server route passing token to backend
    ├── types/dashboard.ts         # TypeScript interfaces matching API contract
    ├── .env.example
    └── README.md
```

---

## Quickstart

### 1. Prerequisites
- **Python**: 3.12+ with [uv](https://docs.astral.sh/uv/)
- **Node.js**: 20+ with `npm`
- **Facebook Developer App**: Configured with `email,pages_show_list,pages_read_engagement,read_insights` permissions.
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/).

---

### 2. Backend Setup (`backend/`)

```bash
cd backend

# Copy environment template
cp .env.example .env

# Set your Gemini API key in .env:
# GEMINI_API_KEY=your_gemini_api_key_here

# Install dependencies with uv
uv sync

# Run the FastAPI server
uv run uvicorn app.main:app --reload --port 8000
```

- API Base: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- Swagger UI Docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup (`frontend/`)

In another terminal window:

```bash
cd frontend

# Copy environment template
cp .env.example .env.local

# Fill in your Facebook credentials in .env.local:
# FACEBOOK_CLIENT_ID=...
# FACEBOOK_CLIENT_SECRET=...
# NEXTAUTH_SECRET=...
# BACKEND_URL=http://localhost:8000

# Install dependencies
npm install

# Start development server
npm run dev
```

- Frontend App: `http://localhost:3000`

---

## API & Data Flow

1. **Authentication**: User logs in with Facebook OAuth via Auth.js. The user access token is stored in the encrypted server session.
2. **Page Selection**: The user selects one of their managed Facebook Pages from `/pages`.
3. **Backend Proxy**: The Next.js server route `/api/pages/[id]/dashboard` retrieves the user token and issues an authenticated call to FastAPI `GET /api/v1/pages/{page_id}/dashboard`. The token is never exposed to the browser.
4. **Ownership Verification & Token Exchange**: FastAPI queries `/me/accounts` to verify ownership and acquire the Page access token.
5. **Parallel Graph API Fetch**: FastAPI concurrently queries Page metadata, the last 25 posts, and 5 Page Insights metrics.
6. **Isolated Metric Resilience**: Insights metrics that fail due to deprecation or follower thresholds (e.g. 100+ likes) are marked `available: false` with a non-fatal warning without failing the request.
7. **Deterministic Analysis**: Post statistics (averages, cadence, best/worst posts) are calculated purely in Python.
8. **Gemini AI Structured Insights**: Gemini analyzes the clean summary and outputs structured JSON (health score, trend, strengths, weaknesses, prioritized recommendations, content ideas, and optimal posting times).
9. **Interactive Dashboard**: Rendered in Next.js using Tailwind CSS and Recharts with interactive charts, highlights, and status telemetry.
