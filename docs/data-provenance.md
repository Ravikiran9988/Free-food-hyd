# Data Provenance

Understanding where data comes from is critical for the Free Food Hyderabad platform. The platform merges automated datasets with community wisdom without destroying original source truth.

## Source Types

Every `Spot` in the database has a `source_type` property.

1. **`imported`**
   - **Origin**: Created automatically by the data pipeline (`sync.py`).
   - **Behavior**: These records are tied to an upstream `source_id`. If the upstream data changes (e.g., location name), the sync script will update it.

2. **`community`**
   - **Origin**: Created by an administrator approving a user submission from the "Add a Place" form.
   - **Behavior**: These records are entirely local. They are ignored by the upstream sync script and will never be accidentally overwritten.

3. **`admin`**
   - **Origin**: Directly inserted by a database administrator.

## Meal Details & Fabrications
**Rule**: Meal details must never be fabricated by the system.
If the upstream source provides specific meal details (e.g., "Rice and Sambar"), it is stored in the `MealDetail` table.
If it is unavailable, the frontend displays: *"Meal details not provided."* The platform does not guess or assume meal contents based on the category.

## Scheduled vs. Community Confirmations
Because `imported` events are often recurring daily without a specific time, they might be marked as `is_recurring_or_time_only`.

The frontend distinctly separates two concepts:
- **Scheduled Status**: The official time (e.g., 12:30 PM - 2:00 PM).
- **Recent Confirmation**: Real-time feedback from users ("Serving Now"). 

If a user reports "Serving Now", it does not change the *official schedule* in the database. Instead, it increments the temporal `community_confirmations` count. This prevents malicious users from permanently altering the true schedule of a spot while still allowing real-time crowd-sourced validation.
