# Authentication & Security

The Free Food Hyderabad platform separates security concerns into two tiers: Public (Rate Limited) and Admin (Authenticated).

## Public Endpoints
Most endpoints (`/spots`, `/events`) are completely open. They require no authentication.

## Admin Authentication
Accessing the `/admin/*` routes requires a valid JSON Web Token (JWT).
1. An admin submits credentials to `/admin/token`.
2. The backend verifies the credentials against the securely hashed `ADMIN_PASSWORD_HASH` stored in the `.env` environment variables.
3. Upon success, a JWT is generated using the `ADMIN_SECRET_KEY`.
4. The React frontend stores this token in `localStorage` (`admin_token`) and attaches it as a `Bearer` token in the `Authorization` header for subsequent requests.

## Security Considerations & Abuse Protection

### CORS
Configured in FastAPI via `CORSMiddleware`. The `CORS_ORIGINS` environment variable strictly defines which domains are permitted to interact with the API, preventing malicious cross-origin requests.

### Rate Limiting & Cooldowns
Because community feedback (e.g., "Report") does not require login, it is susceptible to spam.
The `anti_abuse.py` module implements a sliding window tracker. If an IP or browser fingerprint submits feedback for a specific spot, they are placed on a cooldown for that spot. Successive immediate attempts return `429 Too Many Requests`.

### Environment Secrets
**Never** commit the `.env` file. Keys like `ADMIN_SECRET_KEY` must remain strictly on the server. If the secret key leaks, malicious actors could forge their own JWTs and approve arbitrary, malicious spots in the database.

### Input Validation
All API requests are strictly validated using Pydantic schemas. Unexpected fields are stripped, and invalid data types are rejected with a `422 Unprocessable Entity` error before they ever reach the database or business logic.
