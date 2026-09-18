# Environment Configuration

The application is configured using a `.env` file at the root of the project.

## Required Variables

### Database
- **`POSTGRES_USER`**
  - *Purpose*: The username for PostgreSQL.
  - *Used by*: `docker-compose.yml`, FastAPI `database.py`
  - *Example*: `postgres`
- **`POSTGRES_PASSWORD`**
  - *Purpose*: The password for PostgreSQL.
  - *Used by*: `docker-compose.yml`, FastAPI `database.py`
  - *Example*: `your_secure_password_here`
- **`POSTGRES_DB`**
  - *Purpose*: The database name.
  - *Used by*: `docker-compose.yml`, FastAPI `database.py`
  - *Example*: `freefoodhyd`

### Security
- **`ADMIN_SECRET_KEY`**
  - *Purpose*: Secret string used to cryptographically sign JWTs for the Admin Dashboard.
  - *Used by*: FastAPI `auth.py`
  - *Example*: `a_very_long_random_string`
- **`CORS_ORIGINS`**
  - *Purpose*: Comma-separated list of allowed origins.
  - *Used by*: FastAPI `main.py`
  - *Example*: `http://localhost:8080,https://myproductiondomain.com`

### Data Pipeline
- **`SYNC_SCHEDULE_HOUR`**
  - *Purpose*: The hour (UTC, 00-23) at which the nightly data sync runs.
  - *Used by*: `data-pipeline/src/scheduler.py`
  - *Example*: `02` (Runs at 2:00 AM UTC)

## Missing/Unused Variables
- *Supabase*: The `docker-compose.yml` file contains legacy references to `SUPABASE_URL` and `SUPABASE_KEY` on the `scheduler` service. These are **not currently implemented** in the active codebase as the project uses native PostgreSQL. You can safely ignore them.
