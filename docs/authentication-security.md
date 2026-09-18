# Authentication & Security

## Authentication flow

Free Food Hyderabad uses one authentication flow for both normal users and administrators:

1. The user submits credentials to `POST /auth/login`.
2. The backend verifies the user's bcrypt password hash from the `users` table.
3. The backend issues a JWT containing the user's identity and role.
4. The frontend stores the authenticated session token as `ffh_token`.
5. Authenticated API requests send `Authorization: Bearer <token>`.
6. `GET /auth/me` resolves the current user and role.

There is no separate frontend-only admin login and no separate `admin_token`.

## Roles

- `user`: normal account features.
- `admin`: normal account features plus protected moderation/admin APIs.

Role checks in the frontend only control the UI. Every admin endpoint also enforces the role on the backend.

## Admin bootstrap

Create or promote an administrator through the backend seed command.

Set these environment variables locally:

```env
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=use-a-strong-password
```

Then run the seed command from the backend environment:

```bash
python apps/backend/seed.py
```

The password is hashed before it is stored. Never commit a real password or password hash generated from a real credential.

## Protected admin routes

The following require an authenticated administrator:

- `/admin/submissions`
- `/admin/reports`
- `/admin/suggested-updates`
- `/admin/community-updates`
- `/stats`

A normal user receives `403` for admin-only operations. An unauthenticated request receives `401`.

## Frontend behavior

Logged-out users see **Sign In**.

After login, users see an account menu. Administrators also see **Admin Dashboard** inside that menu.

The public navigation does not expose an Admin link.

## Security notes

- Keep `ADMIN_SECRET_KEY` in environment configuration.
- Do not commit production secrets.
- Do not store plaintext passwords.
- Do not allow users to change their own role.
- Do not rely on frontend route hiding for authorization.
