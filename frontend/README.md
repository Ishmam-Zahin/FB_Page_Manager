# FB Pages Dashboard — Frontend

A Next.js 16 App Router dashboard that lets users log in with Facebook, pick one of their managed Pages, and view interactive analytics with Gemini AI insights.

---

## Requirements

- Node.js ≥ 20 (Node 22 recommended)
- A Facebook App in **Developer** or **Development** mode with the correct redirect URI and scopes configured.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `FACEBOOK_CLIENT_ID` | Your Facebook App ID (from Facebook Developer Console) | — |
| `FACEBOOK_CLIENT_SECRET` | Your Facebook App Secret | — |
| `NEXTAUTH_SECRET` | Random secret used to sign sessions (`openssl rand -base64 32`) | — |
| `NEXTAUTH_URL` | Base URL of the app | `http://localhost:3000` |
| `BACKEND_URL` | URL of the FastAPI backend service | `http://localhost:8000` |

---

## Facebook App Configuration

In the [Facebook Developer Console](https://developers.facebook.com/):

1. Go to your app → **Facebook Login → Settings**.
2. Add this to **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/facebook
   ```
3. Ensure the following **Permissions** are added:
   - `email`
   - `pages_show_list`
   - `pages_read_engagement`
   - `read_insights`

> **Development Mode Notice**: Only Facebook users with a role on the app (Admin, Developer, or Tester) can log in while the app is in Development mode. Add users via **Roles → Add Testers** in the developer console.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Dashboard Features (`/pages/[id]`)

1. **Header**: Page picture, name, category, followers & likes badges, Facebook and website links, and back navigation.
2. **Stats Row**: Analyzed posts, average reactions, average comments, average shares, average engagement, and posts per week with cadence hints.
3. **Gemini AI Diagnostic**: Visual Page health score gauge (0–100), trend momentum badge, executive summary, strengths, weaknesses, prioritized recommendations, content format suggestions, and optimal posting times.
4. **Engagement Charts**: Interactive timeline (Area chart) of engagement per post over time, and breakdown bar chart across reaction types (Like, Love, Haha, Wow, Sad, Angry) via Recharts.
5. **Page Insights**: 28-day telemetry for reach, impressions, engaged users, follower growth, and video views. Gracefully isolates deprecated or restricted metrics.
6. **Recent Posts Feed**: Chronological list with post image, message text, reaction counts, comment & share totals, direct Facebook permalink, and visual highlighting of best and worst performing posts.
7. **Graceful Error & Skeletons**: Animated loading skeleton, retry action, and demo mock data preview mode.

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Redirects to `/pages` |
| `/login` | Login page with Facebook OAuth |
| `/pages` | Lists user's managed Facebook Pages |
| `/pages/[id]` | Full Facebook Page Analytics & AI Dashboard |
| `/api/pages/[id]/dashboard` | Server-side proxy calling FastAPI with user Bearer token |

---

## Key Implementation Notes

- **Zero Client-Side Token Exposure**: The Facebook user access token resides strictly in the encrypted session and is passed server-to-server to FastAPI.
- **Mock Mode for UI Development**: Append `?mock=true` to preview the dashboard with `docs/dashboard.example.json`.
