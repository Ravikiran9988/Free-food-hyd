# Testing

The Free Food Hyderabad repository is equipped with both unit and end-to-end (E2E) testing to ensure stability.

## Frameworks
- **Python**: `pytest`

## Running Tests

### 1. Backend Unit Tests
Unit tests validate logic in isolation without spinning up the full database.
```bash
export PYTHONPATH="$(pwd)/apps/backend/app"
pytest tests/backend
```
*Current Coverage*: Validates community models and endpoint structures.

### 2. End-to-End (E2E) Tests
E2E tests interact with the running FastAPI backend to simulate a real client.

**Prerequisites**: The backend and database must be running.

```bash
export PYTHONPATH="$(pwd)/apps/backend/app"
pytest tests/e2e
```
Alternatively, execute the test script directly to see detailed console output for all 9 critical flows:
```bash
python tests/e2e/test_e2e.py
```

### Verified Scenarios in E2E
- **Search**: Ensures string queries (e.g., "Ameerpet") return matching `items`.
- **Near Me**: Verifies the PostGIS spatial logic by querying coordinates near Charminar and asserting that results are correctly sorted by distance.
- **Map Points**: Ensures the lightweight clustering payload works.
- **Time Sections**: Validates "Serving Now" and "Starting Soon" logic based on current UTC time.
- **Grouped Upcoming**: Validates date clustering.
- **Feedback Submission**: Asserts that `community/feedback` increments counts successfully without failing the anti-abuse checks on the first try.
- **Admin Stats**: Ensures aggregate queries are functional.

*Note: Frontend React component tests (Jest/RTL) are not currently implemented.*
