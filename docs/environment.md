# Environment Configuration

The application uses a root `.env` file for local/Docker configuration. Start from `.env.example` and replace placeholder values. Never commit the real `.env`.

## Application Database (FastAPI Storage)

- **`DATABASE_URL`** — SQLAlchemy connection string used by the FastAPI backend and sync engine to store application data.
  - **Local Docker:** `postgresql://postgres:postgres@db:5432/freefoodhyd`
  - **Local Host:** `postgresql://postgres:postgres@localhost:5433/freefoodhyd`
  - **Cloud Supabase (Production):** `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`

Docker Compose local variables:
- **`POSTGRES_USER`** — PostgreSQL username used by Docker.
- **`POSTGRES_PASSWORD`** — PostgreSQL password used by Docker.
- **`POSTGRES_DB`** — PostgreSQL database name (`freefoodhyd`).
- **`POSTGRES_HOST`** — database host.
- **`POSTGRES_PORT`** — database port.

## Upstream Source Supabase (Scraper Ingestion Only)

The data pipeline consumes food spot listings from the upstream Annadhanam Spots provider via Supabase PostgREST API:

- **`SOURCE_SUPABASE_URL`** — Upstream Supabase REST base endpoint (e.g. `https://[upstream-id].supabase.co/rest/v1`).
- **`SOURCE_SUPABASE_KEY`** — Upstream publishable anon key used strictly to query the read-only `location_feed` table.
- **`SYNC_SCHEDULE_HOUR`** — Scheduled sync hour (UTC, `00`-`23`, defaults to 2 AM UTC).
- **`CRON_SECRET`** — Shared secret used to authenticate automated HTTP sync triggers on Render/cloud hosting.

> [!IMPORTANT]
> **Do not confuse the two Supabase systems:**
> - `DATABASE_URL` is your private application database where Free Food Hyderabad stores its data.
> - `SOURCE_SUPABASE_URL` / `SOURCE_SUPABASE_KEY` is the external, read-only data source queried by the scraper to discover upstream meals.

## Frontend API URL

The frontend API client defaults to `http://127.0.0.1:8000` during local development.

If the API runs at another URL, set `VITE_API_URL` in the frontend's Vite environment, for example `apps/frontend/.env.local`. This is a frontend build-time variable and is separate from the root backend `.env`.

## Security Rules

- Never commit `.env`.
- Never commit real admin credentials, JWTs, password hashes, or production secrets.
- Use a strong random `ADMIN_SECRET_KEY` in production.
- Restrict `CORS_ORIGINS` in production.
- If a secret was ever committed to Git history, rotate it even after removing it from the current files.
