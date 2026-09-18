# Local Setup & Installation

This guide explains how to set up Free Food Hyderabad for local development without Docker. For Docker, use the repository-root `docker-compose.yml`.

## Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL 15+ with PostGIS

## 1. Configure environment

Copy the example file and set local values:

```bash
cp .env.example .env
```

Set a strong `ADMIN_SECRET_KEY`. For admin bootstrap, set:

```env
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=use-a-strong-password
```

These bootstrap credentials are used by the seed command and are not committed to Git.

## 2. Database

Create the database and enable PostGIS:

```sql
CREATE DATABASE freefoodhyd;
\c freefoodhyd
CREATE EXTENSION postgis;
```

## 3. Data pipeline

```bash
cd data-pipeline
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="$(pwd)/../apps/backend/app"
python src/sync.py
```

On Windows PowerShell, set the equivalent `PYTHONPATH` before running the command.

## 4. Backend

```bash
cd apps/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="$(pwd)/app"
uvicorn app.main:app --reload --port 8000
```

## 5. Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`.

## 6. Create the admin account

Admin authentication uses the same `/auth/login` flow as normal users. The only difference is the database role.

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD`, then run:

```bash
cd apps/backend
export PYTHONPATH="$(pwd)/app"
python seed.py
```

The seed command creates the user if it does not exist, or promotes/updates the existing user to `admin`.

Then sign in at `/signin`. The Admin Dashboard appears in the account menu only for an authenticated admin.

Never commit a real password, password hash, or admin token.
