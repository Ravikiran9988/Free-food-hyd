import time
from collections import defaultdict
from typing import Optional
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
import models

# In-memory sliding window rate limiter
_request_history = defaultdict(list)
_feedback_cooldown = defaultdict(float)

def get_client_ip(request: Request) -> str:
    """Extract client IP safely from forwarded headers or direct connection."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def check_rate_limit(client_ip: str, action: str, max_requests: int = 15, window_seconds: int = 60):
    """Sliding-window rate limiter per client IP."""
    now = time.time()
    key = f"{client_ip}:{action}"
    history = _request_history[key]

    # Purge old entries
    _request_history[key] = [t for t in history if now - t < window_seconds]

    if len(_request_history[key]) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests for {action}. Please wait a moment before trying again."
        )

    _request_history[key].append(now)

def check_feedback_cooldown(client_ip: str, spot_id: str, cooldown_seconds: int = 300):
    """Prevents spam voting on the same spot by the same client within cooldown period."""
    now = time.time()
    key = f"{client_ip}:{spot_id}:feedback"
    last_time = _feedback_cooldown.get(key, 0)

    if now - last_time < cooldown_seconds:
        remaining = int(cooldown_seconds - (now - last_time))
        raise HTTPException(
            status_code=429,
            detail=f"You already confirmed this spot recently. You can update your feedback in {remaining} seconds."
        )

    _feedback_cooldown[key] = now

def check_duplicate_submission(
    db: Session,
    name: str,
    area_name: str,
    start_time: str,
    end_time: str,
    client_ip: str
):
    """Protects against duplicate community submissions."""
    normalized_name = name.strip().lower()
    normalized_area = area_name.strip().lower()

    # Check if a pending submission exists with identical name and area
    existing_sub = db.query(models.CommunitySubmission).filter(
        models.CommunitySubmission.status == "pending",
        models.CommunitySubmission.area_name.ilike(f"%{normalized_area}%"),
        models.CommunitySubmission.name.ilike(f"%{normalized_name}%"),
    ).first()

    if existing_sub:
        raise HTTPException(
            status_code=400,
            detail="A similar food spot submission is already pending moderation review."
        )
