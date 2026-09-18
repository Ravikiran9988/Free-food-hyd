# Admin Guide

The Admin Dashboard provides moderation capabilities to maintain data quality.

## Accessing the Dashboard
1. Navigate to `/admin` in the React frontend.
2. Enter the admin credentials (configured via environment variables during deployment).
3. Upon successful login, the dashboard unlocks.

## Features

### System Stats
The top level displays global system metrics:
- Total Spots (All active records)
- Active Spots
- Pending Submissions (Requires attention)

### Moderation Workflow
When users use the "Add a Place" feature on the public site, the records are sent to the `community_submissions` table.

1. **Review**: The dashboard displays pending submissions, showing the requested name, area, and coordinates.
2. **Action**: 
   - Clicking **Approve** executes `POST /admin/submissions/{id}/approve`. The backend automatically creates a new `Spot` record with `source_type="community"` and marks the submission as approved.
   - Clicking **Reject** discards the submission, preventing spam from reaching the live map.

### Data Quality
Admins should monitor the `sync_runs` table (accessible via database queries) to ensure the automated upstream scraper is running successfully every night. If `skipped_records` or `expired_count` suddenly spikes, the upstream public API may have changed its format.
