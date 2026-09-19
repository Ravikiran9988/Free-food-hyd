import os
import json
import logging
import math
from datetime import datetime
import sys

# Since this is running in data-pipeline/src, we need to import from apps/backend/app
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "apps", "backend", "app"))

from database import engine, SessionLocal, Base
import models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def infer_category(name: str, area: str, landmark: str, meal_details: str) -> str:
    combined = f"{name} {area} {landmark} {meal_details}".lower()
    if any(k in combined for k in ["temple", "mandir", "devasthanam", "kovil", "gudi"]):
        return "Temple Meals"
    if any(k in combined for k in ["community", "samaj", "sangham", "ashram", "trust", "society", "math"]):
        return "Community Meals"
    if any(k in combined for k in ["daily", "everyday", "regular", "nithya", "nitya"]):
        return "Daily Free Food"
    if any(k in combined for k in ["distribution", "distribute", "van", "drive", "seva"]):
        return "Free Meal Distribution"
    if any(k in combined for k in ["special", "festival", "utsav", "jayanti", "kalyanam", "function"]):
        return "Special Events"
    return "Annadhanam"

def run_sync():
    logger.info("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "data", "processed", "annadhanam_spots_clean.json")
    
    if not os.path.exists(file_path):
        logger.error(f"Dataset file not found at: {file_path}. Did the scraper run?")
        return
        
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    logger.info(f"Loaded {len(data)} records from scraper. Beginning graceful sync...")
    db = SessionLocal()
    
    try:
        active_source_ids = set()
        imported_count = 0
        updated_count = 0
        skipped_count = 0

        logger.info("Pre-fetching existing records for high-performance sync...")
        existing_spots = {s.source_id: s for s in db.query(models.Spot).all() if s.source_id}
        existing_events = {(e.spot_id, e.source_event_id): e for e in db.query(models.Event).all() if e.source_event_id}
        existing_meals = {(m.spot_id, m.source_type): m for m in db.query(models.MealDetail).all()}
        logger.info(f"Existing records in DB: {len(existing_spots)} spots, {len(existing_events)} events.")
        
        for idx, item in enumerate(data, 1):
            source_id = str(item.get("id") or "").strip()
            if not source_id:
                skipped_count += 1
                continue
                
            active_source_ids.add(source_id)
            
            area_name = (item.get("area_name") or "").strip() or "Hyderabad"
            landmark = (item.get("landmark") or "").strip() or None
            name = landmark if landmark else (area_name.split(",")[0] if area_name else "Annadhanam Spot")
            
            raw_lat = item.get("latitude")
            raw_lon = item.get("longitude")
            try:
                lat = float(raw_lat) if raw_lat is not None else 0.0
                lon = float(raw_lon) if raw_lon is not None else 0.0
                if math.isnan(lat) or math.isnan(lon):
                    lat, lon = 0.0, 0.0
            except (ValueError, TypeError):
                lat, lon = 0.0, 0.0
                
            meal_details_text = (item.get("meal_details") or "").strip()
            category = infer_category(name, area_name, landmark or "", meal_details_text)
            
            gmaps_url = item.get("google_maps_url")
            if not gmaps_url and lat != 0.0 and lon != 0.0:
                gmaps_url = f"https://www.google.com/maps?q={lat},{lon}"
                
            location = f"SRID=4326;POINT({lon} {lat})" if lat and lon else None

            existing_spot = existing_spots.get(source_id)
            
            if not existing_spot:
                spot = models.Spot(
                    source_id=source_id,
                    name=name,
                    area_name=area_name,
                    landmark=landmark,
                    latitude=lat,
                    longitude=lon,
                    location=location,
                    category=category,
                    source_type="imported",
                    google_maps_url=gmaps_url,
                    interested_count=int(item.get("interested_count") or 0),
                    report_count=int(item.get("report_count") or 0),
                )
                db.add(spot)
                db.flush()
                existing_spots[source_id] = spot
                imported_count += 1
            else:
                spot = existing_spot
                if spot.source_type == "imported":
                    spot.name = name
                    spot.area_name = area_name
                    spot.landmark = landmark
                    spot.latitude = lat
                    spot.longitude = lon
                    spot.location = location
                    spot.category = category
                    spot.google_maps_url = gmaps_url
                spot.interested_count = int(item.get("interested_count") or 0)
                spot.report_count = int(item.get("report_count") or 0)
                updated_count += 1

            is_dummy_date = bool(item.get("is_dummy_or_recurring_date", False))
            start_time_raw = item.get("start_time_raw") or item.get("start_time") or ""
            end_time_raw = item.get("end_time_raw") or item.get("end_time") or ""
            start_time_local = item.get("start_time_local") or ""
            end_time_local = item.get("end_time_local") or ""
            start_date = item.get("start_date") or None

            if not start_time_local and start_time_raw: start_time_local = str(start_time_raw)
            if not end_time_local and end_time_raw: end_time_local = str(end_time_raw)
            if "1901" in str(start_time_raw) or "1901" in str(end_time_raw):
                is_dummy_date = True
                start_date = None

            status = item.get("status") or ("recurring_time_only" if is_dummy_date else "active")
            try:
                duration_hours = float(item.get("duration_hours") or 0.0)
            except (ValueError, TypeError):
                duration_hours = 0.0

            existing_event = existing_events.get((spot.id, source_id))
            if not existing_event:
                event = models.Event(
                    spot_id=spot.id,
                    source_event_id=source_id,
                    event_date=start_date if not is_dummy_date else None,
                    start_time=start_time_local or "Schedule not specified",
                    end_time=end_time_local or "Schedule not specified",
                    start_time_raw=str(start_time_raw),
                    end_time_raw=str(end_time_raw),
                    duration_hours=duration_hours,
                    status=status,
                    is_recurring_or_time_only=is_dummy_date,
                )
                db.add(event)
                db.flush()
                existing_events[(spot.id, source_id)] = event
            else:
                event = existing_event
                event.event_date = start_date if not is_dummy_date else None
                event.start_time = start_time_local or "Schedule not specified"
                event.end_time = end_time_local or "Schedule not specified"
                event.start_time_raw = str(start_time_raw)
                event.end_time_raw = str(end_time_raw)
                event.duration_hours = duration_hours
                event.status = status
                event.is_recurring_or_time_only = is_dummy_date
                db.flush()

            if meal_details_text:
                existing_meal = existing_meals.get((spot.id, "imported"))
                if not existing_meal:
                    meal_obj = models.MealDetail(
                        spot_id=spot.id,
                        event_id=event.id,
                        details=meal_details_text,
                        source_type="imported"
                    )
                    db.add(meal_obj)
                    db.flush()
                    existing_meals[(spot.id, "imported")] = meal_obj
                else:
                    existing_meal.details = meal_details_text

            if idx % 500 == 0 or idx == len(data):
                db.commit()
                logger.info(f"Sync progress: {idx}/{len(data)} records processed ({imported_count} new, {updated_count} updated)...")

        expired_count = 0
        missing_spots = db.query(models.Spot).filter(models.Spot.source_type == "imported", ~models.Spot.source_id.in_(active_source_ids)).all()
        for missing in missing_spots:
            for ev in missing.events:
                if ev.status != "expired":
                    ev.status = "expired"
                    expired_count += 1
                    
        sync_run = models.SyncRun(
            source_url="data-pipeline/data/processed/annadhanam_spots_clean.json",
            total_records=len(data),
            imported_records=imported_count,
            skipped_records=skipped_count,
            status="completed",
            details=f"Imported {imported_count} new spots. Updated {updated_count} existing. Expired {expired_count} missing."
        )
        db.add(sync_run)
        db.commit()
        logger.info(f"Sync complete. New: {imported_count}, Updated: {updated_count}, Expired: {expired_count}")

    except Exception as e:
        db.rollback()
        logger.error(f"Error during sync: {e}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    run_sync()
