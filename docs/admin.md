# Admin Dashboard

## Access

1. Navigate to `/signin`.
2. Sign in with an account whose database role is `admin`.
3. The authenticated account menu exposes **Admin Dashboard**.
4. The `/admin` route is protected by frontend routing and backend RBAC.

There is no separate Admin Login screen.

## Dashboard

The dashboard provides:

- Overview metrics
- Pending community place submissions
- Open reports
- Suggested updates
- Recent community availability activity

## Moderation

### Place submissions

Admins can review community-submitted places and:

- Approve & publish
- Reject

Meal details remain explicitly identified as community-provided when supplied.

### Reports

Admins can:

- Resolve
- Dismiss

### Suggested updates

Admins can:

- Apply an update
- Reject

## Data provenance

Imported source data, community-provided information, and actual admin-reviewed information must remain distinguishable.

The dashboard must not label every imported record as admin verified.

## Security

Admin API authorization is enforced by the backend using the authenticated user's JWT role. Hiding an admin link in the frontend is not considered a security control.
