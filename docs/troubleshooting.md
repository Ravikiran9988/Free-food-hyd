# Troubleshooting

## 1. Database connection failure

**Error:** database `freefood` does not exist.

**Fix:** create the database and enable PostGIS, or verify the Docker database environment variables.

## 2. PostGIS function missing

**Error:** `st_distancesphere` or another PostGIS function is unavailable.

**Fix:**

```sql
CREATE EXTENSION postgis;
```

## 3. Frontend cannot reach backend

Check `VITE_API_URL` and backend `CORS_ORIGINS`. The local defaults are normally frontend `http://localhost:5173` and backend `http://127.0.0.1:8000`.

## 4. Scraper / sync import failure

If Python cannot find the backend `app` package, set `PYTHONPATH` as described in `docs/setup.md` and run the sync from the `data-pipeline` directory.

## 5. Map has no data

Run the data sync and check that the PostgreSQL database contains spots. If using Docker, inspect the backend/scheduler logs.

## 6. Sign in returns 401

The application uses the database-backed `/auth/login` endpoint for both users and admins.

Check:

1. The email exactly matches the `users.email` value.
2. The password was created through registration or the admin seed command.
3. The admin user has `role = 'admin'` if accessing admin features.
4. `ADMIN_SECRET_KEY` is the same across backend restarts.
5. The browser is sending the returned JWT as `Authorization: Bearer <token>` on `/auth/me`.

For an admin account, run the seed command again after setting `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the local environment.

## 7. Admin Dashboard shows unauthorized

The dashboard no longer has a separate Admin Login. It relies on the same authenticated session as the rest of the application.

Sign out, sign in again at `/signin`, and verify the account has the `admin` role.

A normal user should receive `403 Forbidden` for admin-only APIs.

## 8. Frontend shows a stale authentication error

Clear the application's `ffh_token` from local storage by signing out, then sign in again. The app should not repeatedly call `/auth/me` without a token.
