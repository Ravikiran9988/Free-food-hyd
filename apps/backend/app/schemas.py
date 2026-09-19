from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# Meal Detail Schema
class MealDetailBase(BaseModel):
    details: str
    source_type: str = "imported"

class MealDetailResponse(MealDetailBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Feedback Schema
class FeedbackCreate(BaseModel):
    spot_id: str
    event_id: Optional[str] = None
    # Types: serving_now, not_serving, started_late, finished_early, happening, cancelled
    feedback_type: str
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    spot_id: str
    event_id: Optional[str] = None
    feedback_type: str
    comment: Optional[str] = None
    source_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Suggested Update Schema
class SuggestedUpdateCreate(BaseModel):
    spot_id: str
    # Types: timing_correction, location_correction, meal_detail_correction, cancellation, recurring_schedule, other
    update_type: str
    suggested_value: str
    reason: Optional[str] = None

class SuggestedUpdateResponse(BaseModel):
    id: str
    spot_id: str
    update_type: str
    suggested_value: str
    reason: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Report Schema
class ReportCreate(BaseModel):
    spot_id: str
    # Types: wrong_location, wrong_time, event_cancelled, duplicate, incorrect_meal_details, other
    reason: str
    details: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    spot_id: str
    reason: str
    details: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Submission Schema
class CommunitySubmissionCreate(BaseModel):
    name: str
    area_name: str
    landmark: Optional[str] = None
    category: str = "Annadhanam"
    event_date: Optional[str] = None
    start_time: str
    end_time: str
    meal_details: Optional[str] = None
    additional_info: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_info: Optional[str] = None

class CommunitySubmissionResponse(BaseModel):
    id: str
    name: str
    area_name: str
    landmark: Optional[str] = None
    category: str
    event_date: Optional[str] = None
    start_time: str
    end_time: str
    meal_details: Optional[str] = None
    additional_info: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Moderation Action
class ModerationAction(BaseModel):
    action: str  # approve, reject, resolve, dismiss
    notes: Optional[str] = None

# Community Confirmation Summary
class CommunityConfirmationSummary(BaseModel):
    confirmed_count: int = 0
    not_serving_count: int = 0
    started_late_count: int = 0
    finished_early_count: int = 0
    last_confirmation_minutes_ago: Optional[int] = None
    confirmation_text: str = "No recent updates"

# Event Schema
class EventResponse(BaseModel):
    id: str
    spot_id: str
    source_event_id: Optional[str] = None
    event_date: Optional[str] = None
    start_time: str
    end_time: str
    start_time_raw: Optional[str] = None
    end_time_raw: Optional[str] = None
    duration_hours: float = 0.0
    status: str
    is_recurring_or_time_only: bool = False
    meal_details: List[MealDetailResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Spot Summaries
class SpotBase(BaseModel):
    source_id: Optional[str] = None
    name: str
    area_name: str
    landmark: Optional[str] = None
    latitude: float
    longitude: float
    category: str = "Annadhanam"
    source_type: str = "imported"
    google_maps_url: Optional[str] = None
    interested_count: int = 0
    report_count: int = 0

class SpotSummaryResponse(SpotBase):
    id: str
    status: str = "active"  # serving_now, starting_soon, upcoming, expired, active, recurring_time_only
    live_status: str = "upcoming"  # serving_now, starting_soon, upcoming, expired
    start_time: str = ""
    end_time: str = ""
    start_date: Optional[str] = None
    is_recurring_or_time_only: bool = False
    meal_detail_preview: str = "Meal details not provided."
    distance_km: Optional[float] = None
    community_confirmation: CommunityConfirmationSummary = Field(default_factory=CommunityConfirmationSummary)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SpotDetailResponse(SpotBase):
    id: str
    status: str = "active"
    live_status: str = "upcoming"  # serving_now, starting_soon, upcoming, expired
    start_time: str = ""
    end_time: str = ""
    start_date: Optional[str] = None
    is_recurring_or_time_only: bool = False
    events: List[EventResponse] = []
    meal_details: List[MealDetailResponse] = []
    feedbacks: List[FeedbackResponse] = []
    suggested_updates: List[SuggestedUpdateResponse] = []
    resolved_meal_details: str = "Meal details not provided."
    meal_provenance_badge: str = "Meal details not provided."
    distance_km: Optional[float] = None
    community_confirmation: CommunityConfirmationSummary = Field(default_factory=CommunityConfirmationSummary)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Paginated Response
class PaginatedSpotsResponse(BaseModel):
    items: List[SpotSummaryResponse]
    total: int
    page: int
    limit: int
    pages: int

# Category Count Response
class CategoryItem(BaseModel):
    name: str
    slug: str
    count: int

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str

