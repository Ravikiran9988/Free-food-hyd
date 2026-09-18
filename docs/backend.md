# Backend Documentation

The Free Food Hyderabad backend is built with FastAPI to ensure high performance, asynchronous request handling, and robust OpenAPI documentation.

## Architecture
- **Location**: `apps/backend/app/`
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Spatial Engine**: GeoAlchemy2 (PostGIS integration)

## Key Modules
- **`main.py`**: The application entry point. Defines all REST API endpoints, initializes CORS middleware, and includes dependencies.
- **`models.py`**: SQLAlchemy ORM models defining the schema (`Spot`, `Event`, `CommunitySubmission`, etc.).
- **`schemas.py`**: Pydantic models for request validation and response serialization.
- **`crud.py`**: Complex queries, including PostGIS spatial filtering (`ST_DistanceSphere`).
- **`auth.py`**: JWT token generation and verification for the `/admin` routes using `passlib`.
- **`anti_abuse.py`**: Rate limiting and cooldown tracking using sliding windows in-memory (to prevent abuse on public feedback endpoints).

## Request Flow
1. A request hits an endpoint in `main.py`.
2. Middleware (`anti_abuse.py`) validates the client IP to ensure they haven't exceeded the rate limit.
3. If hitting an `/admin` route, `auth.get_current_admin` parses the `Bearer` token.
4. FastAPI injects the database `Session` dependency.
5. The request is routed to a function in `crud.py` which executes the SQLAlchemy query.
6. Data is returned and automatically serialized according to the Pydantic `response_model` defined in `main.py`.
