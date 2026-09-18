import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Index,
    JSON
)
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Spot(Base):
    __tablename__ = "spots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_id = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(Text, nullable=False)
    area_name = Column(Text, nullable=False, index=True)
    landmark = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False, default=0.0)
    longitude = Column(Float, nullable=False, default=0.0)
    location = Column(Geometry('POINT', srid=4326, spatial_index=True), nullable=True)
    category = Column(String(100), nullable=False, default="Annadhanam", index=True)
    source_type = Column(String(50), nullable=False, default="imported")  # imported, community, admin
    google_maps_url = Column(Text, nullable=True)
    interested_count = Column(Integer, default=0)
    report_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    events = relationship("Event", back_populates="spot", cascade="all, delete-orphan")
    meal_details = relationship("MealDetail", back_populates="spot", cascade="all, delete-orphan")
    feedbacks = relationship("AvailabilityFeedback", back_populates="spot", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="spot", cascade="all, delete-orphan")
    suggested_updates = relationship("SuggestedUpdate", back_populates="spot", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="spot", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_spots_coordinates", "latitude", "longitude"),
    )

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    spot_id = Column(String(36), ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    source_event_id = Column(String(100), nullable=True)
    event_date = Column(String(50), nullable=True, index=True)  # YYYY-MM-DD or None for recurring
    start_time = Column(Text, nullable=False)  # HH:MM AM/PM
    end_time = Column(Text, nullable=False)  # HH:MM AM/PM
    start_time_raw = Column(Text, nullable=True)
    end_time_raw = Column(Text, nullable=True)
    duration_hours = Column(Float, default=0.0)
    status = Column(String(50), nullable=False, default="active", index=True)  # active, upcoming, expired, recurring_time_only
    is_recurring_or_time_only = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    spot = relationship("Spot", back_populates="events")
    meal_details = relationship("MealDetail", back_populates="event", cascade="all, delete-orphan")

class MealDetail(Base):
    __tablename__ = "meal_details"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    spot_id = Column(String(36), ForeignKey("spots.id", ondelete="CASCADE"), nullable=True, index=True)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=True, index=True)
    details = Column(Text, nullable=False)
    source_type = Column(String(50), nullable=False, default="imported")  # imported, community, admin
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    spot = relationship("Spot", back_populates="meal_details")
    event = relationship("Event", back_populates="meal_details")

class CommunitySubmission(Base):
    __tablename__ = "community_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(Text, nullable=False)
    area_name = Column(Text, nullable=False)
    landmark = Column(Text, nullable=True)
    category = Column(String(100), default="Annadhanam", nullable=False)
    event_date = Column(String(50), nullable=True)
    start_time = Column(Text, nullable=False)
    end_time = Column(Text, nullable=False)
    meal_details = Column(Text, nullable=True)
    additional_info = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_info = Column(String(255), nullable=True)
    client_ip = Column(String(100), nullable=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, approved, rejected
    moderation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AvailabilityFeedback(Base):
    __tablename__ = "availability_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    spot_id = Column(String(36), ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    # Types: serving_now, not_serving, started_late, finished_early, happening, cancelled
    feedback_type = Column(String(50), nullable=False, index=True)
    comment = Column(Text, nullable=True)
    source_type = Column(String(50), default="community", nullable=False)
    client_ip = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    spot = relationship("Spot", back_populates="feedbacks")

class SuggestedUpdate(Base):
    __tablename__ = "suggested_updates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    spot_id = Column(String(36), ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    # Types: timing_correction, location_correction, meal_detail_correction, cancellation, recurring_schedule, other
    update_type = Column(String(50), nullable=False, index=True)
    suggested_value = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    client_ip = Column(String(100), nullable=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    spot = relationship("Spot", back_populates="suggested_updates")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    spot_id = Column(String(36), ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    # Types: wrong_location, wrong_time, event_cancelled, duplicate, incorrect_meal_details, other
    reason = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    client_ip = Column(String(100), nullable=True)
    status = Column(String(50), default="open", nullable=False, index=True)  # open, resolved, dismissed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    spot = relationship("Spot", back_populates="reports")

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    spot_id = Column(String(36), ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    user_identifier = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    spot = relationship("Spot", back_populates="favorites")

class SyncRun(Base):
    __tablename__ = "sync_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_url = Column(Text, nullable=False)
    total_records = Column(Integer, default=0, nullable=False)
    imported_records = Column(Integer, default=0, nullable=False)
    skipped_records = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class User(Base):
    __tablename__ = 'users'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default='user', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

