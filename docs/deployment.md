# Deployment

The Free Food Hyderabad platform is fully containerized using Docker and Docker Compose. This ensures a consistent environment across local development and production.

## Deployment Architectures

Free Food Hyderabad supports two production deployment architectures:
1. **Cloud Native (Free/Serverless)**: Vercel (Frontend) + Render (Backend) + Supabase (PostgreSQL + PostGIS) + External/GitHub Cron (Sync).
2. **Containerized (Docker Compose)**: Single-host VPS or local cluster orchestrating DB, Backend, Scheduler, and Frontend (Nginx).

---

## 1. Cloud Deployment (Vercel + Render + Supabase)

### A. Database (Supabase)
1. Create a new PostgreSQL project on [Supabase](https://supabase.com).
2. Enable PostGIS: In SQL Editor, run `CREATE EXTENSION IF NOT EXISTS postgis;` (the backend also verifies this automatically on startup).
3. Copy your connection string from Project Settings -> Database -> Connection string (URI).
   - Use direct connection URI or transaction pooler URI.
   - Note: If URI starts with `postgres://`, the backend automatically normalizes it to `postgresql://`.

### B. Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com) pointing to this repository.
2. Build & Start:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r apps/backend/requirements.txt -r data-pipeline/requirements.txt`
   - **Start Command**: `uvicorn apps.backend.app.main:app --host 0.0.0.0 --port $PORT`
   *(Alternatively, deploy using Docker using `infra/docker/Dockerfile.backend`)*
3. Environment Variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string (`postgresql://...`).
   - `ADMIN_SECRET_KEY`: A long, cryptographically secure random string for signing JWT tokens.
   - `CORS_ORIGINS`: Comma-separated allowed frontend domains, e.g.:
     `https://free-food-hyd.vercel.app,http://localhost:5173`
   - `SOURCE_SUPABASE_URL` & `SOURCE_SUPABASE_KEY`: External read-only credentials to scrape upstream Annadhanam spots.
   - `CRON_SECRET`: A secure random token used by your scheduler/cron runner to trigger syncs.
   - `ADMIN_USERNAME` & `ADMIN_PASSWORD`: For initial admin seeding via seed script.


### C. Frontend (Vercel)
1. Import the repository into [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `apps/frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_API_URL`: The absolute URL of your Render backend **without** a trailing slash, e.g.:
     `https://free-food-hyd-backend.onrender.com`

### D. Automated Sync on Free Hosting
Render's free tier sleeps after 15 minutes of inactivity. To keep data fresh without paying for a 24/7 background worker:
- Trigger data sync automatically using an external cron runner (e.g. GitHub Actions or [cron-job.org](https://cron-job.org)).
- Send a `POST` request to `https://your-backend.onrender.com/admin/sync` with header:
  `X-Cron-Secret: <YOUR_CRON_SECRET>`
- Alternatively, administrators can trigger data synchronization on demand from the admin interface.

---

## 2. Containerized Deployment (Docker Compose)

The repository provides a complete 4-container production configuration:
1. **db**: PostgreSQL 15 with PostGIS (port 5433 host, 5432 internal).
2. **backend**: FastAPI on port 8000.
3. **scheduler**: Scheduled daily data pipeline synchronization at 02:00 UTC.
4. **frontend**: Nginx reverse proxy on port 8080 serving the Vite React build and proxying `/api/` requests to `http://backend:8000/`.

### Deployment Steps:
1. Clone repository and create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env and supply secure passwords
   ```
2. Build and launch:
   ```bash
   docker compose up -d --build
   ```
3. Seed the admin account:
   ```bash
   docker compose exec backend python apps/backend/seed.py
   ```
4. Access the application at `http://localhost:8080`.

