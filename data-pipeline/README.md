# Annadhanam Spots Robust Production Scraper

A production-grade Python scraper and data quality pipeline for [https://annadhanamspots.in/](https://annadhanamspots.in/).

---

## 🔍 Architecture & Data Source

- **Backend**: Supabase PostgREST REST API behind Cloudflare.
- **Endpoint**: `https://qqpjgaxwphsjtjqnjodw.supabase.co/rest/v1/location_feed`
- **Authentication**: Public anonymous key supplied in headers (`apikey` and `Authorization: Bearer ...`).
- **Pagination**: Zero-indexed limit/offset pagination in batches of 1,000 (server-enforced limit).

---

## 📁 Output Artifacts

```text
scraper/
├── scraper.py
├── requirements.txt
├── README.md
├── data/
│   ├── annadhanam_spots_raw.json    # Complete raw backend records
│   ├── annadhanam_spots_clean.json  # Cleaned, standardized schema (JSON)
│   └── annadhanam_spots_clean.csv   # Cleaned, standardized schema (CSV)
└── logs/
    └── scraper.log
```

---

## 📊 Standardized Schema

The normalized dataset (`annadhanam_spots_clean.json` and `annadhanam_spots_clean.csv`) contains:

| Column | Type | Description |
|---|---|---|
| `id` | String / UUID | Unique record ID |
| `area_name` | String | Area name, locality, mandal, district, state, pincode |
| `landmark` | String | Specific landmark or driving directions |
| `meal_details` | String | Food or meal item details (if provided) |
| `latitude` | Float | GPS latitude |
| `longitude` | Float | GPS longitude |
| `start_time_raw` | String | Original ISO 8601 start timestamp |
| `end_time_raw` | String | Original ISO 8601 end timestamp |
| `created_at` | String | ISO 8601 creation timestamp |
| `interested_count` | Integer | Total count of interested users |
| `report_count` | Integer | Total count of report flags |
| `google_maps_url` | String | Clickable Google Maps link |
| `status` | String | `active`, `upcoming`, `expired`, or `recurring_time_only` |
| `is_active` | Boolean | True if listing is active/upcoming |
| `start_date` | String | Date string (e.g. `YYYY-MM-DD` or empty for time-only entries) |
| `start_time_local` | String | Local time formatted (e.g. `06:00 PM IST`) |
| `end_date` | String | Date string (e.g. `YYYY-MM-DD` or empty for time-only entries) |
| `end_time_local` | String | Local time formatted (e.g. `07:30 PM IST`) |
| `duration_hours` | Float | Duration of distribution event in hours |
| `is_dummy_or_recurring_date` | Boolean | `True` for dummy sentinel dates (e.g. year 1901) |
| `quality_flags` | String | Flags: `CLEAN`, `DUMMY_TIME_ONLY_DATE`, `COORDINATES_OUTSIDE_INDIA`, etc. |

---

## 🚀 Commands

### 1. Scrape ALL Records (Historical + Active + Future)
```bash
python scraper.py --all
```

### 2. Scrape ONLY Active Listings (Matches Website Live Feed)
```bash
python scraper.py --active-only
```

### 3. Validate Existing Files (Without Re-Downloading)
```bash
python scraper.py --validate-only
```

### 4. Keyword Search Filter
```bash
python scraper.py --search "Hyderabad"
```
