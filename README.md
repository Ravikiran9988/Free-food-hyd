# Free Food Hyderabad

Find free meals near you.

Free Food Hyderabad is a community-powered platform for discovering free meals, Annadhanam, temple meals, community meals, and free food distribution events in Hyderabad. 

**Important:** The initial dataset comes from existing publicly accessible Annadhanam sources through the project's data pipeline. While the community can verify and update information, not all information is guaranteed to be community-verified or real-time. Please verify information before traveling.

## Key Features
- 🗺️ **Geographic Search**: Find free food locations near you using PostGIS spatial queries.
- 📅 **Time-Aware Availability**: View what's "Serving Now", "Starting Soon", or happening "Later Today".
- 🤝 **Community Contributions**: Add new spots, suggest updates, and report incorrect information.
- 🛡️ **Graceful Data Sync**: Safe, non-destructive background synchronization from public sources.
- 📱 **Progressive Web App (PWA)**: Installable on mobile devices with responsive design.

## Architecture Overview
The platform uses a modern, modular architecture separated into distinct apps and pipelines.

```mermaid
graph TD
    User([User]) --> Frontend[React + TypeScript]
    Frontend --> Backend[FastAPI]
    Backend --> DB[(PostgreSQL + PostGIS)]
    
    Source[Public Source API] --> Scraper[Data Pipeline Scraper]
    Scraper --> Normalization[Data Normalization]
    Normalization --> DB
    
    User --> Community[Community Submissions]
    Community --> Backend
```

## Technology Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, React-Leaflet
- **Backend**: Python, FastAPI, SQLAlchemy, GeoAlchemy2, JWT
- **Database**: PostgreSQL 15, PostGIS 3.4
- **Data Pipeline**: Python, Requests, Playwright
- **Infrastructure**: Docker, Docker Compose, Nginx

## Repository Structure
```
free-food-hyderabad/
├── apps/
│   ├── frontend/         # React SPA
│   └── backend/app/      # FastAPI application
├── data-pipeline/        # Scraper and automated sync scripts
├── database/             # Database migrations
├── docs/                 # Detailed documentation
├── infra/                # Dockerfiles and Nginx configs
├── tests/                # E2E and unit tests
└── docker-compose.yml    # Local & deployment orchestration
```

## Quick Start (Docker)

1. Clone the repository
2. Copy `.env.example` to `.env` and set your secrets:
   ```bash
   cp .env.example .env
   ```
3. Spin up the entire stack:
   ```bash
   docker-compose up -d --build
   ```
4. Access the frontend at `http://localhost:8080` and the API at `http://localhost:8000`.

## Documentation Navigation

Detailed documentation can be found in the `docs/` directory:

- [Architecture](docs/architecture.md)
- [Setup](docs/setup.md)
- [Frontend](docs/frontend.md)
- [Backend](docs/backend.md)
- [API](docs/api.md)
- [Database](docs/database.md)
- [Data Pipeline](docs/data-pipeline.md)
- [Data Provenance](docs/data-provenance.md)
- [Community Features](docs/community-features.md)
- [Authentication & Security](docs/authentication-security.md)
- [Admin](docs/admin.md)
- [Testing](docs/testing.md)
- [Deployment](docs/deployment.md)
- [Environment](docs/environment.md)
- [Contributing](docs/contributing.md)
- [Troubleshooting](docs/troubleshooting.md)

## License
MIT License
