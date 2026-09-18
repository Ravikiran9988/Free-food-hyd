# Contributing Guide

We welcome contributions to Free Food Hyderabad! This project is maintained by volunteers, and community help is what keeps it alive.

## Getting Started
1. Familiarize yourself with the [Architecture](architecture.md) and [Setup](setup.md) documentation.
2. Fork the repository and clone it locally.
3. Ensure you can spin up the full stack via `docker-compose up -d --build`.

## Workflow
1. **Branch Naming**: Use descriptive prefixes like `feat/`, `fix/`, `docs/`, or `refactor/` (e.g., `feat/add-new-filter`).
2. **Development**:
   - Write clean, self-documenting code.
   - Respect the `apps/frontend` and `apps/backend/app` separation.
   - Do **not** mix scraper logic into the FastAPI backend. Keep the data pipeline separate in `data-pipeline/`.
3. **Testing**: Run the E2E tests before submitting a PR.
   ```bash
   pytest tests/e2e
   ```
4. **Pull Requests**: Provide a clear description of the problem solved. If your change affects the database schema, explicitly note it.

## Database Migrations
Currently, the platform relies on `Base.metadata.create_all(bind=engine)`. If you are adding new tables or columns, you must:
1. Ensure the Pydantic models in `schemas.py` match the SQLAlchemy models in `models.py`.
2. Document the change in the PR. 
*(Note: An official Alembic migration strategy is planned for the `database/migrations/` directory but is not currently active).*

## Community Feature Considerations
If you are modifying how community feedback or submissions are handled:
- Never overwrite the `imported` source data.
- Ensure any new public endpoint uses the `anti_abuse` rate limiting mechanism.
