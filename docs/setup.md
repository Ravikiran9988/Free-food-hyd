# Local Setup & Installation

This guide explains how to set up the Free Food Hyderabad platform for local development without Docker. If you prefer Docker, use the `docker-compose up -d --build` command at the repository root.

## Prerequisites
- Node.js (v20+)
- Python (v3.10+)
- PostgreSQL (v15+) with PostGIS extension installed

## 1. Configure Environment
Clone the repository and set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` to include your PostgreSQL credentials and a secure `ADMIN_SECRET_KEY`.

## 2. Database Setup
Ensure PostgreSQL is running and create the database (default: `freefoodhyd`):
```sql
CREATE DATABASE freefoodhyd;
\c freefoodhyd
CREATE EXTENSION postgis;
```

## 3. Data Pipeline & Sync
The data pipeline is responsible for the initial schema creation and data loading.
```bash
cd data-pipeline
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the sync process to create tables and load data
export PYTHONPATH="$(pwd)/../apps/backend/app"
python src/sync.py
```

## 4. Backend Setup
Start the FastAPI server:
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the server with local imports resolving properly
export PYTHONPATH="$(pwd)/app"
uvicorn app.main:app --reload --port 8000
```

## 5. Frontend Setup
Start the React application:
```bash
cd apps/frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default).

## 6. Admin Account Setup
To access the Admin Dashboard at `/admin`, you need an admin account. You can configure this via Environment Variables or by seeding the database directly.

**Option A: Environment Variables (Quickest)**
Edit your `.env` file to set the default credentials:
```env
ADMIN_USERNAME=admin@example.com
# Must be a bcrypt hash of your password
ADMIN_PASSWORD_HASH=$2b$12$YourSecureBcryptHash
```

**Option B: Database Seeding (Production Recommended)**
To create a real user record with admin privileges, run the seed script from the backend directory:
```bash
cd apps/backend/app
# Create a seed.py script as documented, or insert via SQL
```
(See `docs/admin.md` for full details on administration and seeding).
