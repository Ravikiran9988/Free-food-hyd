import re
from datetime import datetime, timedelta, timezone

# Indian Standard Time (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    """Return current datetime in UTC (matching DB utc timestamps)."""
    return datetime.utcnow()

def parse_time_str(time_str: str) -> tuple[int, int] | None:
    """Parse a time string like '12:30 PM', '1:00 PM', '09:30 AM', '14:30' into (hour_24, minute)."""
    if not time_str or "not specified" in time_str.lower():
        return None
    time_str = time_str.strip().upper()
    
    # Check 12-hour format with AM/PM
    match = re.search(r"(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?", time_str)
    if match:
        hours = int(match.group(1))
        minutes = int(match.group(2))
        meridiem = match.group(3)
        if meridiem == "PM" and hours < 12:
            hours += 12
        elif meridiem == "AM" and hours == 12:
            hours = 0
        return (hours, minutes)
    return None

def compute_event_realtime_status(
    start_time_str: str,
    end_time_str: str,
    event_date: str | None = None,
    is_recurring: bool = False,
    current_dt: datetime | None = None
) -> str:
    """
    Computes real-time status:
    - 'serving_now' (🟢)
    - 'starting_soon' (🟡)
    - 'upcoming' (⚪)
    - 'expired' (⚫)
    """
    if current_dt is None:
        # Convert UTC to IST for local timing comparison
        utc_now = datetime.utcnow()
        ist_now = utc_now + timedelta(hours=5, minutes=30)
    else:
        ist_now = current_dt

    current_minutes = ist_now.hour * 60 + ist_now.minute

    # If non-recurring and has event date, check if date is past or future
    if not is_recurring and event_date:
        today_str = ist_now.strftime("%Y-%m-%d")
        if event_date < today_str:
            return "expired"
        elif event_date > today_str:
            return "upcoming"

    start_parsed = parse_time_str(start_time_str)
    end_parsed = parse_time_str(end_time_str)

    if not start_parsed or not end_parsed:
        return "serving_now" if is_recurring else "upcoming"

    start_min = start_parsed[0] * 60 + start_parsed[1]
    end_min = end_parsed[0] * 60 + end_parsed[1]

    # Handle cross-midnight events
    if end_min < start_min:
        end_min += 24 * 60

    # 1. Serving Now: between start and end
    if start_min <= current_minutes <= end_min:
        return "serving_now"

    # 2. Starting Soon: 90 minutes prior to start_time
    if 0 < (start_min - current_minutes) <= 90:
        return "starting_soon"

    # 3. Expired: after end time today
    if current_minutes > end_min:
        return "expired"

    # 4. Upcoming: earlier in the day
    return "upcoming"

def aggregate_feedbacks(feedbacks: list, recency_hours: float = 3.0, current_dt: datetime | None = None) -> dict:
    """
    Aggregates community confirmations within the recency window.
    Prevents stale/yesterday feedback from affecting current status.
    """
    now = current_dt or datetime.utcnow()
    cutoff_time = now - timedelta(hours=recency_hours)

    recent_feedbacks = [
        f for f in feedbacks 
        if hasattr(f, "created_at") and f.created_at and f.created_at >= cutoff_time
    ]

    confirmed_count = sum(1 for f in recent_feedbacks if f.feedback_type in ("serving_now", "happening", "active_now"))
    not_serving_count = sum(1 for f in recent_feedbacks if f.feedback_type in ("not_serving", "cancelled", "food_finished", "not_happening"))
    started_late_count = sum(1 for f in recent_feedbacks if f.feedback_type == "started_late")
    finished_early_count = sum(1 for f in recent_feedbacks if f.feedback_type == "finished_early")

    # Find latest confirmation timestamp
    confirmations = [
        f.created_at for f in recent_feedbacks 
        if f.feedback_type in ("serving_now", "happening", "active_now") and f.created_at
    ]

    last_confirmation_minutes_ago = None
    if confirmations:
        latest = max(confirmations)
        diff_seconds = max(0, (now - latest).total_seconds())
        last_confirmation_minutes_ago = int(diff_seconds // 60)

    # Format human-readable community confirmation string
    if confirmed_count > 0:
        if last_confirmation_minutes_ago == 0:
            recency_str = "just now"
        elif last_confirmation_minutes_ago == 1:
            recency_str = "1 minute ago"
        elif last_confirmation_minutes_ago is not None:
            recency_str = f"{last_confirmation_minutes_ago} minutes ago"
        else:
            recency_str = "recently"

        people_str = f"{confirmed_count} person" if confirmed_count == 1 else f"{confirmed_count} people"
        confirmation_text = f"👍 {people_str} recently said it's happening • Last update: {recency_str}"
    elif not_serving_count > 0:
        confirmation_text = f"❌ {not_serving_count} person(s) reported not happening recently"
    else:
        confirmation_text = "No recent updates"

    return {
        "confirmed_count": confirmed_count,
        "not_serving_count": not_serving_count,
        "started_late_count": started_late_count,
        "finished_early_count": finished_early_count,
        "last_confirmation_minutes_ago": last_confirmation_minutes_ago,
        "confirmation_text": confirmation_text,
        "recent_feedback_count": len(recent_feedbacks),
    }
