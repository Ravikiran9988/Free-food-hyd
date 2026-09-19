# Environment Configuration

The application uses a root `.env` file for local/Docker configuration. Start from `.env.example` and replace placeholder values. Never commit the real `.env`.

## Database

- **`POSTGRES_USER`** — PostgreSQL username used by Docker.
- **`POSTGRES_PASSWORD`** — PostgreSQL password used by Docker.
- **`POSTGRES_DB`** — PostgreSQL database name.
- **`POSTGRES_HOST`** — database host for local/backend configuration.
- **`POSTGRES_PORT`** — database port.
- **`DATABASE_URL`** — SQLAlchemy connection string used by the FastAPI backend.

For Docker Compose, the backend connects to the `db` service on port `5432`. The host-side database port is exposed as `5433`.

## Authentication & Security

- **`ADMIN_SECRET_KEY`** — JWT signing/verification secret. Use a long random value in production and keep it stable across backend restarts/instances.
- **`CORS_ORIGINS`** — comma-separated browser origins. Restrict this to the real frontend origin(s) in production.
- **`ADMIN_USERNAME`** — bootstrap admin email/username consumed by `apps/backend/seed.py`.
- **`ADMIN_PASSWORD`** — bootstrap admin password consumed by `apps/backend/seed.py`.

`ADMIN_USERNAME` and `ADMIN_PASSWORD` are bootstrap inputs, not the per-request authentication mechanism. The seed command creates/promotes the database user and hashes the password before storage.

Changing `ADMIN_PASSWORD` in `.env` does not change an existing account until `seed.py` is run again.

### Docker admin bootstrap

Docker Compose passes the bootstrap variables into the backend container:

```bash
docker compose up -d --build
docker compose exec backend python seed.py
```

Then sign in through the normal `/signin` page. There is no separate admin login.

### Local admin bootstrap

With a local PostgreSQL database:

```bash
cd apps/backend
export PYTHONPATH="$(pwd)/app"
python seed.py
```

Windows PowerShell:

```powershell
cd apps/backend
$env:PYTHONPATH="$pwd/app"
python seed.py
```

## Data Pipeline / Scheduler

- **`SYNC_SCHEDULE_HOUR`** — scheduled sync hour (UTC, `00`-`23`).
- **`SUPABASE_URL`** and **`SUPABASE_KEY`** — retained for compatibility with the current scheduler configuration. The active application data path is PostgreSQL-backed; do not place private credentials in the repository.

## Frontend API URL

The frontend API client defaults to `http://127.0.0.1:8000` during local development.

If the API runs at another URL, set `VITE_API_URL` in the frontend's Vite environment, for example `apps/frontend/.env.local`. This is a frontend build-time variable and is separate from the root backend `.env`.

## Security Rules

- Never commit `.env`.
- Never commit real admin credentials, JWTs, password hashes, or production secrets.
- Use a strong random `ADMIN_SECRET_KEY` in production.
- Restrict `CORS_ORIGINS` in production.
- If a secret was ever committed to Git history, rotate it even after removing it from the current files.
