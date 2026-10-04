# Facebook Page Dashboard — Backend

FastAPI backend service for fetching Facebook Page metrics and generating Gemini AI insights.

## Features
- **Facebook Graph API Integration**: Exchanges user tokens for page access tokens and fetches page metadata, recent posts, and page insights concurrently.
- **Graceful Metric Isolation**: Handles deprecated or restricted Insights metrics per-metric without failing the overall request.
- **Deterministic Python Analytics**: Computes post engagement statistics, averages, and best/worst post IDs in Python.
- **Gemini AI Structured Output**: Analyzes page trends and outputs structured health scores, recommendations, and content ideas via `google-genai`.
- **CORS & Health Check**: Configured for Next.js frontend with `/health` endpoint.

---

## Requirements
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager

---

## Setup & Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables:
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/).
   - `GEMINI_MODEL`: Model name (default: `gemini-2.0-flash`).
   - `GRAPH_API_VERSION`: Graph API version (default: `v22.0`).
   - `ALLOWED_ORIGINS`: Frontend origin (default: `http://localhost:3000`).

4. Install dependencies:
   ```bash
   uv sync
   ```

---

## Running the Server

Start the development server with live reload:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

The server will be available at:
- API Base: `http://localhost:8000`
- Interactive Docs (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## API Endpoints

### `GET /health`
Returns health check status and configuration info.

### `GET /api/v1/pages/{page_id}/dashboard`
Requires header:
```
Authorization: Bearer <facebook_user_access_token>
```
Returns `DashboardResponse` JSON containing page info, posts, computed stats, insights, and AI analysis.
