# API Documentation

The FastAPI backend exposes the following REST endpoints. All endpoints return JSON.

## Public Endpoints

### Spots
- **`GET /categories`**
  - **Purpose**: Returns aggregated counts for meal categories.
- **`GET /spots`**
  - **Purpose**: Fetch paginated spots.
  - **Query Params**: `search` (str), `limit` (int), `skip` (int)
- **`GET /spots/{id}`**
  - **Purpose**: Retrieve full details, including meal details and community confirmations for a specific spot.
- **`GET /spots/nearby`**
  - **Purpose**: Returns spots sorted by geographic proximity using PostGIS.
  - **Query Params**: `lat` (float, required), `lon` (float, required), `radius_km` (float), `limit` (int)
- **`GET /spots/map-points`**
  - **Purpose**: Lightweight endpoint returning only ID, lat, and lon for rendering massive maps efficiently.

### Events & Timing
- **`GET /events/today-sections`**
  - **Purpose**: Returns three lists: `serving_now`, `starting_soon`, and `later_today` based on the server's current timezone.
- **`GET /events/upcoming-grouped`**
  - **Purpose**: Returns upcoming events clustered by date.

### Community & Feedback
- **`POST /community/add`**
  - **Purpose**: Submit a new spot for admin review.
  - **Body**: Name, area, category, etc.
- **`POST /community/feedback`**
  - **Purpose**: Submit real-time feedback for a spot (e.g., "serving").
  - **Body**: `spot_id`, `feedback_type`, `fingerprint` (for cooldown).

## Admin Endpoints (Requires Auth)

All admin endpoints require an `Authorization: Bearer <token>` header.

- **`POST /admin/token`**
  - **Purpose**: Login to receive a JWT.
  - **Body**: `username`, `password`
- **`GET /admin/stats`**
  - **Purpose**: Retrieve system overview metrics (total spots, pending submissions, active users).
- **`GET /admin/submissions`**
  - **Purpose**: View pending user submissions.
- **`POST /admin/submissions/{submission_id}/approve`**
  - **Purpose**: Approve a submission, migrating it into the live `spots` table.
- **`POST /admin/submissions/{submission_id}/reject`**
  - **Purpose**: Reject a submission.
