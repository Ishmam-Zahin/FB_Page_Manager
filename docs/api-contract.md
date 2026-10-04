# API Contract — FB Pages Dashboard

## Endpoint

```
GET /api/v1/pages/{page_id}/dashboard
```

### Authentication

```
Authorization: Bearer <facebook_user_access_token>
```

The token is the **Facebook user access token** stored in the Auth.js session.
The backend exchanges it for a **Page access token** internally via `/me/accounts`.

### Path Parameters

| Parameter | Type   | Description                  |
|-----------|--------|------------------------------|
| `page_id` | string | The Facebook Page ID         |

### Success Response

```
HTTP 200 OK
Content-Type: application/json
```

### Error Responses

| Status | Condition                                                    |
|--------|--------------------------------------------------------------|
| 401    | Token missing, expired, or revoked                           |
| 403    | `page_id` not found in the user's managed Pages              |
| 429    | Facebook Graph API rate limit hit                            |
| 502    | Facebook Graph API returned an unexpected error              |
| 503    | Gemini API unavailable (dashboard still returns with `ai_analysis: null`) |

---

## Response DTO — `DashboardResponse`

All keys are **snake_case**. All timestamps are **ISO 8601** strings.
A field marked `nullable` may be `null` — it is never silently omitted.

---

### `page` — `PageInfo`

| Field             | Type            | Nullable | Description                                 |
|-------------------|-----------------|----------|---------------------------------------------|
| `id`              | string          | no       | Facebook Page ID                            |
| `name`            | string          | no       | Page name                                   |
| `category`        | string          | no       | Category label (e.g. "Software company")    |
| `about`           | string          | yes      | Short "about" text                          |
| `picture_url`     | string          | yes      | Profile picture URL                         |
| `cover_url`       | string          | yes      | Cover photo URL                             |
| `link`            | string          | yes      | Facebook Page URL                           |
| `website`         | string          | yes      | External website URL                        |
| `followers_count` | integer         | no       | Follower count                              |
| `fan_count`       | integer         | no       | Fan / like count                            |

---

### `posts` — `list[PostItem]`

Up to the last **25 published posts**, newest first.

| Field                  | Type                    | Nullable | Description                           |
|------------------------|-------------------------|----------|---------------------------------------|
| `id`                   | string                  | no       | Post ID                               |
| `message`              | string                  | yes      | Post text                             |
| `created_time`         | string (ISO 8601)       | no       | Publication timestamp                 |
| `permalink_url`        | string                  | yes      | Direct link to the post               |
| `full_picture`         | string                  | yes      | Primary image URL                     |
| `reactions_total`      | integer                 | no       | Sum of all reactions                  |
| `reactions_breakdown`  | `ReactionsBreakdown`    | no       | Per-type reaction counts              |
| `comments_count`       | integer                 | no       | Comment count                         |
| `shares_count`         | integer                 | no       | Share count                           |
| `engagement_total`     | integer                 | no       | `reactions_total + comments_count + shares_count` |

#### `ReactionsBreakdown`

| Field   | Type    | Nullable |
|---------|---------|----------|
| `like`  | integer | no       |
| `love`  | integer | no       |
| `haha`  | integer | no       |
| `wow`   | integer | no       |
| `sad`   | integer | no       |
| `angry` | integer | no       |

---

### `post_stats` — `PostStats`

Computed server-side in Python. Never delegated to Gemini.

| Field               | Type            | Nullable | Description                                     |
|---------------------|-----------------|----------|-------------------------------------------------|
| `posts_analyzed`    | integer         | no       | Number of posts included                        |
| `avg_reactions`     | number (float)  | no       | Mean `reactions_total` across posts             |
| `avg_comments`      | number (float)  | no       | Mean `comments_count`                           |
| `avg_shares`        | number (float)  | no       | Mean `shares_count`                             |
| `avg_engagement`    | number (float)  | no       | Mean `engagement_total`                         |
| `best_post_id`      | string          | yes      | ID of the highest-engagement post               |
| `worst_post_id`     | string          | yes      | ID of the lowest-engagement post                |
| `posts_per_week`    | number (float)  | no       | Average posts published per calendar week       |
| `top_posting_days`  | list[string]    | no       | Day names sorted by post frequency (e.g. `["Monday", "Wednesday"]`) |
| `top_posting_hours` | list[integer]   | no       | UTC hours (0–23) sorted by post frequency       |

---

### `insights` — `PageInsights`

Each metric is fetched independently. A failure on any one metric sets `available: false`
and adds a message to `meta.warnings`; it never fails the whole request.

| Field              | Type              | Description                        |
|--------------------|-------------------|------------------------------------|
| `reach`            | `InsightMetric`   | Unique users who saw any content   |
| `impressions`      | `InsightMetric`   | Total times content was seen       |
| `engaged_users`    | `InsightMetric`   | Unique users who engaged           |
| `follower_growth`  | `InsightMetric`   | Net follower change per day        |
| `video_views`      | `InsightMetric`   | Total video views                  |

#### `InsightMetric`

| Field       | Type                       | Nullable | Description                                     |
|-------------|----------------------------|----------|-------------------------------------------------|
| `available` | boolean                    | no       | `false` if metric is unavailable or errored     |
| `period`    | string                     | yes      | Facebook period (e.g. `"day"`, `"week"`)        |
| `values`    | `list[InsightDataPoint]`   | yes      | `null` when `available` is `false`              |
| `total`     | integer                    | yes      | Sum of all values; `null` when unavailable      |

#### `InsightDataPoint`

| Field   | Type              | Nullable |
|---------|-------------------|----------|
| `date`  | string (ISO 8601) | no       |
| `value` | integer           | no       |

---

### `ai_analysis` — `AiAnalysis | null`

`null` if Gemini fails after one retry. Dashboard must render without it.

| Field                 | Type                         | Nullable | Description                                               |
|-----------------------|------------------------------|----------|-----------------------------------------------------------|
| `health_score`        | integer (0–100)              | no       | Overall Page health score                                 |
| `health_summary`      | string                       | no       | 2–3 sentence plain-language summary                       |
| `engagement_trend`    | `"improving"\|"stable"\|"declining"` | no | Direction of recent engagement                    |
| `trend_explanation`   | string                       | no       | One sentence explaining the trend                         |
| `strengths`           | list[string]                 | no       | 2–4 observed strengths                                    |
| `weaknesses`          | list[string]                 | no       | 2–4 observed weaknesses                                   |
| `best_post_analysis`  | string                       | yes      | Why the best post performed well; `null` if no posts      |
| `worst_post_analysis` | string                       | yes      | What held the worst post back; `null` if no posts         |
| `recommendations`     | list[`Recommendation`]       | no       | 3–5 actionable items                                      |
| `content_ideas`       | list[string]                 | no       | 3–5 specific post ideas                                   |
| `best_time_to_post`   | string                       | no       | Human-readable suggestion (e.g. "Weekdays 9–11 AM UTC")   |

#### `Recommendation`

| Field      | Type                          | Nullable |
|------------|-------------------------------|----------|
| `title`    | string                        | no       |
| `detail`   | string                        | no       |
| `priority` | `"high"\|"medium"\|"low"` | no       |

---

### `meta` — `ResponseMeta`

| Field               | Type              | Nullable | Description                                     |
|---------------------|-------------------|----------|-------------------------------------------------|
| `generated_at`      | string (ISO 8601) | no       | UTC timestamp when the response was assembled   |
| `graph_api_version` | string            | no       | Graph API version used (e.g. `"v22.0"`)         |
| `gemini_model`      | string            | no       | Gemini model name used                          |
| `warnings`          | list[string]      | no       | Non-fatal issues (empty list if none)           |

---

## Full Response Shape (TypeScript)

```typescript
interface DashboardResponse {
  page: PageInfo
  posts: PostItem[]
  post_stats: PostStats
  insights: PageInsights
  ai_analysis: AiAnalysis | null
  meta: ResponseMeta
}
```

See `frontend/types/dashboard.ts` for the complete TypeScript definitions.
