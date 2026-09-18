# Data Pipeline

The data pipeline guarantees that the Free Food Hyderabad database stays synchronized with the upstream, publicly available Annadhanam spots dataset. 

## Ingestion Architecture

```
Public Source API
       ↓
data-pipeline/src/scraper.py  (Extraction & Normalization)
       ↓
data-pipeline/data/raw/*.json
data-pipeline/data/processed/*.json
       ↓
data-pipeline/src/sync.py     (Validation & Upsert)
       ↓
PostgreSQL
```

## 1. Scraper (`scraper.py`)
- **Extraction**: Paginates through the public source API to extract spot information.
- **Normalization**: Cleans textual data, maps coordinate types, and handles missing geographic data.
- **Output**: Generates `annadhanam_spots_clean.json` and a `.csv` equivalent. The dataset contains thousands of valid records (number fluctuates as the upstream source adds/removes spots).

## 2. Sync (`sync.py`)
- **Graceful Upsert**: When new data is fetched, it is inserted into the PostgreSQL database.
- **Source IDs**: The pipeline heavily relies on `source_id`. If a record from the scraper has an ID matching an existing database record, the existing record is updated *without* overwriting community-contributed metadata (`interested_count`, `report_count`, manual overrides).
- **Expiration**: If a `source_id` present in the database is no longer found in the upstream scraper results, the local event status is changed to `expired`. It is **not** deleted from the database, ensuring historical records and community feedback are retained.

## 3. Scheduler (`scheduler.py`)
A continuous process running in the `scheduler` Docker container. It triggers the scraper and sync sequentially once per day (default 2 AM UTC, configurable via `SYNC_SCHEDULE_HOUR`).
The status of each execution is written into the `sync_runs` database table for admin auditing.
