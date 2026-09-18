import math
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, func, desc
from datetime import datetime, timedelta
import models
import schemas
from time_utils import compute_event_realtime_status, aggregate_feedbacks, parse_time_str

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points on Earth in kilometers."""
    if not (lat1 and lon1 and lat2 and lon2):
        return 99999.0
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def format_spot_summary(spot: models.Spot, user_lat: Optional[float] = None, user_lon: Optional[float] = None) -> dict:
    primary_event = spot.events[0] if spot.events else None
    
    # Check meal details provenance
    meal_text = "Meal details not provided."
    if spot.meal_details:
        imported_meals = [m for m in spot.meal_details if m.source_type == "imported"]
        if imported_meals:
            meal_text = imported_meals[0].details
        else:
            meal_text = f"Meal details — Community provided: {spot.meal_details[0].details}"

    distance = None
    if user_lat is not None and user_lon is not None and spot.latitude and spot.longitude:
        distance = calculate_haversine_distance(user_lat, user_lon, spot.latitude, spot.longitude)

    # Compute real-time status dynamically based on current time
    start_time_str = primary_event.start_time if primary_event else ""
    end_time_str = primary_event.end_time if primary_event else ""
    event_date = primary_event.event_date if primary_event else None
    is_rec = primary_event.is_recurring_or_time_only if primary_event else False
    
    live_status = compute_event_realtime_status(
        start_time_str=start_time_str,
        end_time_str=end_time_str,
        event_date=event_date,
        is_recurring=is_rec
    )

    # Community feedback aggregation with 3-hour recency cutoff
    community_stats = aggregate_feedbacks(spot.feedbacks if spot.feedbacks else [])

    return {
        "id": spot.id,
        "source_id": spot.source_id,
        "name": spot.name,
        "area_name": spot.area_name,
        "landmark": spot.landmark,
        "latitude": spot.latitude,
        "longitude": spot.longitude,
        "category": spot.category,
        "source_type": spot.source_type,
        "google_maps_url": spot.google_maps_url,
        "interested_count": spot.interested_count,
        "report_count": spot.report_count,
        "status": primary_event.status if primary_event else "active",
        "live_status": live_status,
        "start_time": start_time_str,
        "end_time": end_time_str,
        "start_date": event_date,
        "is_recurring_or_time_only": is_rec,
        "meal_detail_preview": meal_text,
        "distance_km": distance,
        "community_confirmation": community_stats,
        "created_at": spot.created_at,
        "updated_at": spot.updated_at,
    }

def get_spots(
    db: Session,
    page: int = 1,
    limit: int = 20,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
) -> Tuple[List[dict], int]:
    query = db.query(models.Spot).join(models.Spot.events, isouter=True).options(
        selectinload(models.Spot.events),
        selectinload(models.Spot.meal_details),
        selectinload(models.Spot.feedbacks)
    )

    if category and category.lower() != "all":
        if category.lower() == "unverified places":
            query = query.filter(models.Spot.source_type == "community")
        else:
            query = query.filter(models.Spot.category == category)

    if status and status.lower() != "all":
        if status in ("active", "serving_now"):
            query = query.filter(or_(models.Event.status == "active", models.Event.is_recurring_or_time_only == True))
        elif status in ("upcoming", "starting_soon"):
            query = query.filter(models.Event.status == "upcoming")
        elif status == "expired":
            query = query.filter(models.Event.status == "expired")
        elif status == "recurring_time_only":
            query = query.filter(models.Event.is_recurring_or_time_only == True)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Spot.name.ilike(search_filter),
                models.Spot.area_name.ilike(search_filter),
                models.Spot.landmark.ilike(search_filter),
                models.Spot.category.ilike(search_filter),
            )
        )

    total = query.distinct().count()

    # If sorting by distance or starting_soon or recently_confirmed
    spots_list = query.distinct().all()
    summaries = [format_spot_summary(s, user_lat, user_lon) for s in spots_list]

    if sort_by == "nearest" or (user_lat is not None and user_lon is not None and not sort_by):
        summaries.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else 99999)
    elif sort_by == "recently_confirmed":
        # Put spots with recent positive confirmations first
        summaries.sort(
            key=lambda x: (
                -x["community_confirmation"]["confirmed_count"],
                x["community_confirmation"]["last_confirmation_minutes_ago"] or 99999
            )
        )
    elif sort_by == "starting_soon":
        status_priority = {"serving_now": 1, "starting_soon": 2, "upcoming": 3, "expired": 4}
        summaries.sort(key=lambda x: status_priority.get(x["live_status"], 5))
    else:
        # Default sort: active & serving now first, then newest
        status_priority = {"serving_now": 1, "starting_soon": 2, "upcoming": 3, "expired": 4}
        summaries.sort(key=lambda x: (status_priority.get(x["live_status"], 5), -x["created_at"].timestamp()))

    start = (page - 1) * limit
    end = start + limit
    return summaries[start:end], total

def get_map_points(
    db: Session,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
) -> List[dict]:
    """Returns lightweight point data for map clustering."""
    query = db.query(models.Spot).join(models.Spot.events, isouter=True).filter(
        models.Spot.latitude != 0.0,
        models.Spot.longitude != 0.0,
        models.Spot.latitude.isnot(None),
        models.Spot.longitude.isnot(None)
    )

    if category and category.lower() != "all":
        if category.lower() == "unverified places":
            query = query.filter(models.Spot.source_type == "community")
        else:
            query = query.filter(models.Spot.category == category)

    if status and status.lower() != "all":
        if status in ("active", "serving_now"):
            query = query.filter(or_(models.Event.status == "active", models.Event.is_recurring_or_time_only == True))
        elif status in ("upcoming", "starting_soon"):
            query = query.filter(models.Event.status == "upcoming")
        elif status == "expired":
            query = query.filter(models.Event.status == "expired")

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Spot.name.ilike(search_filter),
                models.Spot.area_name.ilike(search_filter),
                models.Spot.landmark.ilike(search_filter),
                models.Spot.category.ilike(search_filter),
            )
        )

    spots = query.distinct().all()
    points = []
    for spot in spots:
        primary_event = spot.events[0] if spot.events else None
        start_time_str = primary_event.start_time if primary_event else ""
        end_time_str = primary_event.end_time if primary_event else ""
        event_date = primary_event.event_date if primary_event else None
        is_rec = primary_event.is_recurring_or_time_only if primary_event else False
        
        live_status = compute_event_realtime_status(
            start_time_str=start_time_str,
            end_time_str=end_time_str,
            event_date=event_date,
            is_recurring=is_rec
        )
        
        dist = None
        if user_lat is not None and user_lon is not None:
            dist = calculate_haversine_distance(user_lat, user_lon, spot.latitude, spot.longitude)

        points.append({
            "id": spot.id,
            "name": spot.name,
            "area_name": spot.area_name,
            "landmark": spot.landmark,
            "latitude": spot.latitude,
            "longitude": spot.longitude,
            "category": spot.category,
            "live_status": live_status,
            "start_time": start_time_str,
            "end_time": end_time_str,
            "distance_km": dist
        })
    return points

def get_today_sections(db: Session, user_lat: Optional[float] = None, user_lon: Optional[float] = None) -> dict:
    """Returns today's spots divided into Serving Now, Starting Soon, and Later Today."""
    spots = db.query(models.Spot).join(models.Spot.events).options(
        selectinload(models.Spot.events),
        selectinload(models.Spot.meal_details),
        selectinload(models.Spot.feedbacks)
    ).filter(
        or_(models.Event.is_recurring_or_time_only == True, models.Event.status == "active")
    ).distinct().all()

    summaries = [format_spot_summary(s, user_lat, user_lon) for s in spots]

    serving_now = []
    starting_soon = []
    later_today = []

    for s in summaries:
        if s["live_status"] == "serving_now":
            serving_now.append(s)
        elif s["live_status"] == "starting_soon":
            starting_soon.append(s)
        else:
            later_today.append(s)

    if user_lat and user_lon:
        serving_now.sort(key=lambda x: x["distance_km"] or 99999)
        starting_soon.sort(key=lambda x: x["distance_km"] or 99999)
        later_today.sort(key=lambda x: x["distance_km"] or 99999)

    return {
        "serving_now": serving_now,
        "starting_soon": starting_soon,
        "later_today": later_today
    }

def get_upcoming_grouped(db: Session, limit: int = 100) -> List[dict]:
    """Returns future/upcoming spots grouped by date."""
    spots = db.query(models.Spot).join(models.Spot.events).options(
        selectinload(models.Spot.events),
        selectinload(models.Spot.meal_details),
        selectinload(models.Spot.feedbacks)
    ).filter(
        models.Event.status == "upcoming"
    ).distinct().all()

    summaries = [format_spot_summary(s) for s in spots]
    groups: Dict[str, List[dict]] = {}

    for s in summaries:
        d = s["start_date"] or "Scheduled Upcoming"
        if d not in groups:
            groups[d] = []
        groups[d].append(s)

    result = []
    for d, items in sorted(groups.items()):
        result.append({
            "date": d,
            "label": d,
            "spots": items[:limit]
        })
    return result

def get_spot_by_id(db: Session, spot_id: str, user_lat: Optional[float] = None, user_lon: Optional[float] = None) -> Optional[dict]:
    spot = db.query(models.Spot).options(
        selectinload(models.Spot.events),
        selectinload(models.Spot.meal_details),
        selectinload(models.Spot.feedbacks),
        selectinload(models.Spot.suggested_updates)
    ).filter(or_(models.Spot.id == spot_id, models.Spot.source_id == spot_id)).first()
    if not spot:
        return None

    meal_text = "Meal details not provided."
    provenance_badge = "Meal details not provided."
    if spot.meal_details:
        imported_meals = [m for m in spot.meal_details if m.source_type == "imported"]
        if imported_meals:
            meal_text = imported_meals[0].details
            provenance_badge = "Source Verified"
        else:
            community_meals = [m for m in spot.meal_details if m.source_type == "community"]
            if community_meals:
                meal_text = community_meals[0].details
                provenance_badge = "Community Provided"
            else:
                meal_text = spot.meal_details[0].details
                provenance_badge = "Admin Verified"

    distance = None
    if user_lat is not None and user_lon is not None and spot.latitude and spot.longitude:
        distance = calculate_haversine_distance(user_lat, user_lon, spot.latitude, spot.longitude)

    primary_event = spot.events[0] if spot.events else None
    start_time_str = primary_event.start_time if primary_event else ""
    end_time_str = primary_event.end_time if primary_event else ""
    event_date = primary_event.event_date if primary_event else None
    is_rec = primary_event.is_recurring_or_time_only if primary_event else False

    live_status = compute_event_realtime_status(
        start_time_str=start_time_str,
        end_time_str=end_time_str,
        event_date=event_date,
        is_recurring=is_rec
    )

    community_stats = aggregate_feedbacks(spot.feedbacks if spot.feedbacks else [])

    return {
        "id": spot.id,
        "source_id": spot.source_id,
        "name": spot.name,
        "area_name": spot.area_name,
        "landmark": spot.landmark,
        "latitude": spot.latitude,
        "longitude": spot.longitude,
        "category": spot.category,
        "source_type": spot.source_type,
        "google_maps_url": spot.google_maps_url,
        "interested_count": spot.interested_count,
        "report_count": spot.report_count,
        "status": primary_event.status if primary_event else "active",
        "live_status": live_status,
        "start_time": start_time_str,
        "end_time": end_time_str,
        "start_date": event_date,
        "is_recurring_or_time_only": is_rec,
        "events": spot.events,
        "meal_details": spot.meal_details,
        "feedbacks": spot.feedbacks,
        "suggested_updates": spot.suggested_updates,
        "resolved_meal_details": meal_text,
        "meal_provenance_badge": provenance_badge,
        "distance_km": distance,
        "community_confirmation": community_stats,
        "created_at": spot.created_at,
        "updated_at": spot.updated_at,
    }

def get_categories_count(db: Session) -> List[dict]:
    results = db.query(models.Spot.category, func.count(models.Spot.id)).group_by(models.Spot.category).all()
    categories = []
    for cat, count in results:
        categories.append({
            "name": cat,
            "slug": cat.lower().replace(" ", "-"),
            "count": count
        })
        
    unverified_count = db.query(func.count(models.Spot.id)).filter(models.Spot.source_type == "community").scalar() or 0
    categories.append({
        "name": "Unverified Places",
        "slug": "unverified-places",
        "count": unverified_count
    })
    
    return categories

def get_today_events(db: Session, limit: int = 50) -> List[dict]:
    spots = (
        db.query(models.Spot)
        .join(models.Spot.events)
        .options(
            selectinload(models.Spot.events),
            selectinload(models.Spot.meal_details),
            selectinload(models.Spot.feedbacks)
        )
        .filter(or_(models.Event.is_recurring_or_time_only == True, models.Event.status == "active"))
        .limit(limit)
        .distinct()
        .all()
    )
    return [format_spot_summary(s) for s in spots]

def get_upcoming_events(db: Session, limit: int = 50) -> List[dict]:
    spots = (
        db.query(models.Spot)
        .join(models.Spot.events)
        .options(
            selectinload(models.Spot.events),
            selectinload(models.Spot.meal_details),
            selectinload(models.Spot.feedbacks)
        )
        .filter(models.Event.status == "upcoming")
        .limit(limit)
        .distinct()
        .all()
    )
    return [format_spot_summary(s) for s in spots]

def get_serving_now_events(db: Session, limit: int = 50) -> List[dict]:
    spots = (
        db.query(models.Spot)
        .join(models.Spot.events)
        .options(
            selectinload(models.Spot.events),
            selectinload(models.Spot.meal_details),
            selectinload(models.Spot.feedbacks)
        )
        .filter(or_(models.Event.status == "active", models.Event.is_recurring_or_time_only == True))
        .distinct()
        .all()
    )
    summaries = [format_spot_summary(s) for s in spots]
    serving = [s for s in summaries if s["live_status"] == "serving_now" or s["status"] == "active"]
    return serving[:limit]

def get_starting_soon_events(db: Session, limit: int = 50) -> List[dict]:
    spots = (
        db.query(models.Spot)
        .join(models.Spot.events)
        .options(
            selectinload(models.Spot.events),
            selectinload(models.Spot.meal_details),
            selectinload(models.Spot.feedbacks)
        )
        .filter(or_(models.Event.status == "upcoming", models.Event.status == "active"))
        .distinct()
        .all()
    )
    summaries = [format_spot_summary(s) for s in spots]
    starting_soon = [s for s in summaries if s["live_status"] in ("starting_soon", "upcoming")]
    return starting_soon[:limit]

def get_nearby_spots(db: Session, lat: float, lon: float, max_distance_km: float = 25.0, limit: int = 50) -> List[dict]:
    from sqlalchemy import func
    point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
    max_meters = max_distance_km * 1000
    
    spots = db.query(models.Spot).options(
        selectinload(models.Spot.events),
        selectinload(models.Spot.meal_details),
        selectinload(models.Spot.feedbacks)
    ).filter(
        models.Spot.location.is_not(None),
        func.ST_DistanceSphere(models.Spot.location, point) <= max_meters
    ).order_by(
        func.ST_DistanceSphere(models.Spot.location, point)
    ).limit(limit).all()
    
    return [format_spot_summary(s, lat, lon) for s in spots]

# --- Community & Moderation Operations ---

def create_feedback(db: Session, spot_id: str, feedback_type: str, comment: Optional[str], client_ip: str) -> models.AvailabilityFeedback:
    fb = models.AvailabilityFeedback(
        spot_id=spot_id,
        feedback_type=feedback_type,
        comment=comment,
        source_type="community",
        client_ip=client_ip
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb

def create_suggested_update(db: Session, spot_id: str, update_type: str, suggested_value: str, reason: Optional[str], client_ip: str) -> models.SuggestedUpdate:
    up = models.SuggestedUpdate(
        spot_id=spot_id,
        update_type=update_type,
        suggested_value=suggested_value,
        reason=reason,
        client_ip=client_ip,
        status="pending"
    )
    db.add(up)
    db.commit()
    db.refresh(up)
    return up

def create_community_submission(db: Session, data: schemas.CommunitySubmissionCreate, client_ip: str) -> models.CommunitySubmission:
    sub = models.CommunitySubmission(
        name=data.name,
        area_name=data.area_name,
        landmark=data.landmark,
        category=data.category,
        event_date=data.event_date,
        start_time=data.start_time,
        end_time=data.end_time,
        meal_details=data.meal_details,
        additional_info=data.additional_info,
        latitude=data.latitude or 0.0,
        longitude=data.longitude or 0.0,
        contact_info=data.contact_info,
        client_ip=client_ip,
        status="pending"
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

def get_admin_submissions(db: Session, status: str = "pending") -> List[models.CommunitySubmission]:
    return db.query(models.CommunitySubmission).filter(models.CommunitySubmission.status == status).order_by(models.CommunitySubmission.created_at.desc()).all()

def moderate_submission(db: Session, sub_id: str, action: str, notes: Optional[str] = None) -> Optional[models.CommunitySubmission]:
    sub = db.query(models.CommunitySubmission).filter(models.CommunitySubmission.id == sub_id).first()
    if not sub:
        return None

    if action == "approve":
        sub.status = "approved"
        sub.moderation_notes = notes
        
        gmaps = None
        if sub.latitude and sub.longitude:
            gmaps = f"https://www.google.com/maps?q={sub.latitude},{sub.longitude}"

        spot = models.Spot(
            name=sub.name,
            area_name=sub.area_name,
            landmark=sub.landmark,
            latitude=sub.latitude or 0.0,
            longitude=sub.longitude or 0.0,
            location=f"SRID=4326;POINT({sub.longitude} {sub.latitude})" if sub.latitude and sub.longitude else None,
            category=sub.category,
            source_type="community",
            google_maps_url=gmaps,
        )
        db.add(spot)
        db.flush()

        event = models.Event(
            spot_id=spot.id,
            event_date=sub.event_date,
            start_time=sub.start_time,
            end_time=sub.end_time,
            status="active",
            is_recurring_or_time_only=(sub.event_date is None),
        )
        db.add(event)
        db.flush()

        if sub.meal_details:
            meal = models.MealDetail(
                spot_id=spot.id,
                event_id=event.id,
                details=sub.meal_details,
                source_type="community"
            )
            db.add(meal)

    elif action == "reject":
        sub.status = "rejected"
        sub.moderation_notes = notes

    db.commit()
    db.refresh(sub)
    return sub

def get_admin_reports(db: Session, status: str = "open") -> List[models.Report]:
    return db.query(models.Report).filter(models.Report.status == status).order_by(models.Report.created_at.desc()).all()

def moderate_report(db: Session, report_id: str, action: str) -> Optional[models.Report]:
    rep = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not rep:
        return None
    rep.status = "resolved" if action == "resolve" else "dismissed"
    db.commit()
    db.refresh(rep)
    return rep

def get_admin_suggested_updates(db: Session, status: str = "pending") -> List[models.SuggestedUpdate]:
    return db.query(models.SuggestedUpdate).filter(models.SuggestedUpdate.status == status).order_by(models.SuggestedUpdate.created_at.desc()).all()

def moderate_suggested_update(db: Session, update_id: str, action: str) -> Optional[models.SuggestedUpdate]:
    up = db.query(models.SuggestedUpdate).filter(models.SuggestedUpdate.id == update_id).first()
    if not up:
        return None
    up.status = "approved" if action == "approve" else "rejected"
    db.commit()
    db.refresh(up)
    return up

def get_admin_community_updates(db: Session, limit: int = 50) -> List[models.Feedback]:
    return db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).limit(limit).all()
