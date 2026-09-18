# Database Architecture

The Free Food Hyderabad platform utilizes PostgreSQL augmented with the **PostGIS** extension for advanced geospatial querying.

## Key Tables

### `spots`
Stores the core geographic locations of food distribution.
- `id`: UUID (Primary Key)
- `source_id`: String (Original ID from the upstream scraper, used for syncing)
- `name`, `area_name`, `landmark`: String descriptors
- `latitude`, `longitude`: Float (Legacy fallbacks)
- `location`: PostGIS `Geometry('POINT', srid=4326)` - Used for spatial queries.
- `source_type`: Determines provenance (`imported`, `community`, `admin`).
- `interested_count`, `report_count`: Metrics.

### `events`
Stores the scheduling information linked to a specific spot.
- `id`: UUID (Primary Key)
- `spot_id`: UUID (Foreign Key to `spots`)
- `event_date`: Date (Null for recurring events)
- `start_time`, `end_time`: Strings (e.g., "12:30 PM")
- `status`: String (`active`, `expired`, etc.)

### `community_submissions`
A queue for places added directly by users via the frontend.
- `status`: Starts as `pending`. Must be approved via the Admin dashboard before becoming a live `Spot`.

### `availability_feedbacks`
Tracks real-time community confirmations (e.g., "Serving Now").
- `feedback_type`: String (`serving`, `not_serving`, etc.)
- Uses a timestamp to calculate a sliding window expiry (feedback older than 3 hours is ignored).

### `sync_runs`
Tracks the automated data pipeline executions.
- `imported_records`, `skipped_records`, `status`, `details`.

## PostGIS Integration
The `location` column on the `spots` table is spatially indexed. Queries for "Near Me" functionality use native SQL operations rather than loading all coordinates into Python memory:
```python
func.ST_DistanceSphere(models.Spot.location, point) <= max_meters
```
