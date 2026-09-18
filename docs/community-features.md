# Community Features

Free Food Hyderabad incorporates crowd-sourced data to supplement the automated data pipeline.

## Feature Overview

### 1. Add a Place
Users can submit new spots via the frontend. These submissions are stored in the `community_submissions` table with a `pending` status. They are **not** immediately visible on the public map. An admin must review and approve them to prevent spam or inaccurate locations.
* **Location Picker**: Submissions require users to drop a pin on a visual map, providing exact geographic coordinates, eliminating the need for complex geocoding from text addresses.

### 2. Live Validation (Community Truth Engine)
Users can report the live status of an event.
- **Status Types**: "Serving", "Not Serving", "Finished".
- **Expiration**: Feedback is temporal. The backend calculates availability dynamically, completely ignoring any feedback older than a few hours.
- **Plain English Phrasing**: Instead of using technical terms like "Metrics" or "Confirmations", the UI gracefully communicates consensus (e.g. *"2 people recently said it's happening"*).

### 3. Report Incorrect Information
Users can click a "Report" button on a spot's detail page. This increments the `report_count` on the `spots` table. If the `report_count` exceeds a certain threshold, it is flagged for admin review.

## Abuse Prevention
To prevent malicious actors from spamming "Serving Now" or submitting thousands of fake locations:
- **Fingerprinting**: The frontend generates a unique (though anonymous) fingerprint stored in `localStorage`. 
- **Rate Limiting**: The backend's `anti_abuse.py` tracks actions per fingerprint/IP address using an in-memory sliding window, enforcing cooldowns on repetitive actions.
