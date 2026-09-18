# Troubleshooting

Common issues and solutions based on the actual repository configuration.

## 1. Database Connection Failure
**Error**: `asyncpg.exceptions.InvalidCatalogNameError: database "freefoodhyd" does not exist`
**Cause**: The database was not created in PostgreSQL.
**Fix**: 
If running locally (non-Docker), connect to `psql` and run: `CREATE DATABASE freefoodhyd;`.
If using Docker, ensure the `POSTGRES_DB` environment variable is set in `.env` before running `docker-compose up`.

## 2. PostGIS Function Missing
**Error**: `function st_distancesphere(geometry, geometry) does not exist`
**Cause**: The PostGIS extension is not enabled on your database.
**Fix**:
Connect to your database and run: `CREATE EXTENSION postgis;`. (The Docker setup handles this automatically via the `postgis/postgis` image).

## 3. Frontend Cannot Reach Backend
**Error**: Frontend displays "Network Error" or maps fail to load spots.
**Cause**: CORS issues or incorrect API URL.
**Fix**:
- Check `apps/frontend/src/services/api.ts`. Ensure `API_URL` is pointing to `http://localhost:8000` (or your production backend URL).
- Check the `.env` file for the backend. `CORS_ORIGINS` must include the URL the frontend is running on (e.g., `http://localhost:5173` for Vite, or `http://localhost:8080` for Docker).

## 4. Scraper / Sync Failure
**Error**: `ModuleNotFoundError: No module named 'app'` when running `sync.py`.
**Cause**: The Python path does not include the backend directory.
**Fix**:
Run the sync script with the correct `PYTHONPATH`:
```bash
export PYTHONPATH="$(pwd)/../apps/backend/app"
python src/sync.py
```

## 5. Missing Data on Map
**Error**: The map is empty, and `/spots` returns `{"items": [], "total": 0}`.
**Cause**: The data pipeline sync hasn't run.
**Fix**: 
If using Docker, check the scheduler logs (`docker-compose logs scheduler`). It should run automatically on startup.
If running locally, execute `python data-pipeline/src/sync.py` to populate the database.

## 6. Admin Login Fails
**Error**: `401 Unauthorized` when attempting to login to the admin dashboard.
**Cause**: Incorrect password or misconfigured secret key.
**Fix**:
Ensure `ADMIN_PASSWORD_HASH` and `ADMIN_SECRET_KEY` are properly set in the `.env` file. If you lost your password, you must generate a new bcrypt hash and update `.env`.
