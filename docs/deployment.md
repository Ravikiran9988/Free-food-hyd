# Deployment

The Free Food Hyderabad platform is fully containerized using Docker and Docker Compose. This ensures a consistent environment across local development and production.

## Production Architecture

The `docker-compose.yml` file orchestrates four services:
1. **db**: PostgreSQL 15 with PostGIS. Uses a mounted volume (`postgres_data`) to ensure database persistence across restarts.
2. **backend**: FastAPI server exposed on port 8000. Depends on the database being healthy.
3. **scheduler**: A headless Python container running the `data-pipeline/src/scheduler.py` script. It handles nightly scraping and data sync. It shares the same `Dockerfile.backend` image but executes a different command.
4. **frontend**: An Nginx container serving the static React build on port 8080 (or 80 internally).

## Deployment Steps

1. **Clone & Configure**:
   Pull the repository to your production server and configure `.env` with strong passwords.
   ```bash
   cp .env.example .env
   # Edit .env and set POSTGRES_PASSWORD, ADMIN_SECRET_KEY, etc.
   ```

2. **Build and Launch**:
   Run the stack in detached mode. Docker will automatically build the React static files and install Python dependencies.
   ```bash
   docker-compose up -d --build
   ```

3. **Verify Health**:
   Check that all 4 containers are running:
   ```bash
   docker-compose ps
   ```

4. **Initial Data Sync**:
   The `scheduler` container will run the data sync immediately on startup, populating your database with the latest upstream records.
   You can view the sync logs via:
   ```bash
   docker-compose logs -f scheduler
   ```

*Note: Deployment instructions for specific managed cloud providers (e.g., AWS, Vercel, Render) are not currently implemented or maintained. The Docker Compose method is the officially supported deployment strategy.*
