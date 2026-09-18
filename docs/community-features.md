# Community Features

Free Food Hyderabad incorporates crowd-sourced data to supplement the automated data pipeline.

## Feature Overview

### 1. Add a Place
Users can submit new spots via the frontend. These submissions are stored in the `community_submissions` table with a `pending` status. They are **not** immediately visible on the public map. An admin must review and approve them to prevent spam or inaccurate locations.

### 2. Live Feedback (Serving Now / Starting Soon)
Users can report the live status of an event.
- **Status Types**: "Serving", "Not Serving", "Finished".
- **Expiration**: Feedback is temporal. The backend calculates `community_confirmations` dynamically, completely ignoring any feedback older than a few hours.
- **Difference from Schedule**: An event might be scheduled for 1:00 PM (Scheduled Status), but a user can report "Serving Now" at 12:45 PM. The frontend distinctly shows the schedule alongside a badge reading "X recent confirmations" so users know it's actively happening.

### 3. Report Incorrect Information
Users can click a "Report" button on a spot's detail page. This increments the `report_count` on the `spots` table. If the `report_count` exceeds a certain threshold, it is flagged for admin review.

## Abuse Prevention
To prevent malicious actors from spamming "Serving Now" or submitting thousands of fake locations:
- **Fingerprinting**: The frontend generates a unique (though anonymous) fingerprint stored in `localStorage`. 
- **Rate Limiting**: The backend's `anti_abuse.py` tracks actions per fingerprint/IP address using an in-memory sliding window, enforcing cooldowns on repetitive actions.
