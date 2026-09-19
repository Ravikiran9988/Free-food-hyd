import logging
import sys
from pathlib import Path
from typing import List, Optional

# Ensure app directory is on sys.path for direct imports (config, database, etc.)
app_dir = Path(__file__).resolve().parent
if str(app_dir) not in sys.path:
    sys.path.insert(0, str(app_dir))

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from config import settings
from database import get_db, engine, Base
import models
import schemas
import crud
import auth
from datetime import timedelta, datetime
from fastapi.security import OAuth2PasswordRequestForm
from anti_abuse import get_client_ip, check_rate_limit, check_feedback_cooldown, check_duplicate_submission
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure PostGIS extension and database tables exist
try:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
except Exception as e:
    logger.info(f"PostGIS extension check completed: {e}")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Free Food Hyderabad API",
    description="Backend API for Free Food Hyderabad - Discover free meals, Annadhanam, and community distributions.",
    version="2.1.0"
)

# CORS middleware: browsers reject credentialed requests if origin is '*'
allow_credentials = "*" not in settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "app": "Free Food Hyderabad API",
        "tagline": "Find free meals near you.",
        "status": "online",
        "version": "2.1.0",
        "docs": "/docs"
    }

@app.get("/spots", response_model=schemas.PaginatedSpotsResponse)
def list_spots(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query(None, description="nearest, starting_soon, recently_confirmed"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    items, total = crud.get_spots(
        db,
        page=page,
        limit=limit,
        category=category,
        status=status,
        search=search,
        sort_by=sort,
        user_lat=lat,
        user_lon=lon
    )
    pages = (total + limit - 1) // limit if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@app.get("/spots/map-points")
def get_map_points(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_map_points(
        db,
        category=category,
        status=status,
        search=search,
        user_lat=lat,
        user_lon=lon
    )

@app.get("/spots/nearby", response_model=List[schemas.SpotSummaryResponse])
def get_nearby_spots(
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
    max_distance_km: float = Query(25.0, ge=0.5, le=100.0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return crud.get_nearby_spots(db, lat=lat, lon=lon, max_distance_km=max_distance_km, limit=limit)

@app.get("/spots/{spot_id}", response_model=schemas.SpotDetailResponse)
def get_spot(
    spot_id: str,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    spot = crud.get_spot_by_id(db, spot_id=spot_id, user_lat=lat, user_lon=lon)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot

@app.get("/events/today-sections")
def get_today_sections(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_today_sections(db, user_lat=lat, user_lon=lon)

@app.get("/events/upcoming-grouped")
def get_upcoming_grouped(
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    return crud.get_upcoming_grouped(db, limit=limit)

@app.get("/events/today", response_model=List[schemas.SpotSummaryResponse])
def get_today_events(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return crud.get_today_events(db, limit=limit)

@app.get("/events/upcoming", response_model=List[schemas.SpotSummaryResponse])
def get_upcoming_events(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return crud.get_upcoming_events(db, limit=limit)

@app.get("/events/serving-now", response_model=List[schemas.SpotSummaryResponse])
def get_serving_now_events(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return crud.get_serving_now_events(db, limit=limit)

@app.get("/events/starting-soon", response_model=List[schemas.SpotSummaryResponse])
def get_starting_soon_events(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    return crud.get_starting_soon_events(db, limit=limit)

@app.get("/categories", response_model=List[schemas.CategoryItem])
def get_categories(db: Session = Depends(get_db)):
    return crud.get_categories_count(db)

@app.get("/search", response_model=schemas.PaginatedSpotsResponse)
def search_spots(
    q: str = Query("", description="Search term"),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    items, total = crud.get_spots(
        db,
        page=page,
        limit=limit,
        category=category,
        search=q,
        sort_by=sort,
        user_lat=lat,
        user_lon=lon
    )
    pages = (total + limit - 1) // limit if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

# --- Community Actions with Anti-Abuse ---

@app.post("/community/submit", response_model=schemas.CommunitySubmissionResponse)
def submit_community_spot(
    submission: schemas.CommunitySubmissionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "submit_spot", max_requests=5, window_seconds=60)
    check_duplicate_submission(
        db,
        name=submission.name,
        area_name=submission.area_name,
        start_time=submission.start_time,
        end_time=submission.end_time,
        client_ip=client_ip
    )
    return crud.create_community_submission(db, submission, client_ip)

@app.post("/community/feedback", response_model=schemas.FeedbackResponse)
def post_availability_feedback(
    feedback: schemas.FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    spot = db.query(models.Spot).filter(models.Spot.id == feedback.spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "feedback", max_requests=20, window_seconds=60)
    check_feedback_cooldown(client_ip, feedback.spot_id, cooldown_seconds=120)

    return crud.create_feedback(
        db=db,
        spot_id=feedback.spot_id,
        feedback_type=feedback.feedback_type,
        comment=feedback.comment,
        client_ip=client_ip
    )

@app.post("/community/suggest-update", response_model=schemas.SuggestedUpdateResponse)
def suggest_spot_update(
    update: schemas.SuggestedUpdateCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    spot = db.query(models.Spot).filter(models.Spot.id == update.spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "suggest_update", max_requests=5, window_seconds=60)

    return crud.create_suggested_update(
        db=db,
        spot_id=update.spot_id,
        update_type=update.update_type,
        suggested_value=update.suggested_value,
        reason=update.reason,
        client_ip=client_ip
    )

@app.post("/community/report", response_model=schemas.ReportResponse)
def report_spot_issue(
    report: schemas.ReportCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    spot = db.query(models.Spot).filter(models.Spot.id == report.spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "report", max_requests=5, window_seconds=60)

    rep = models.Report(
        spot_id=report.spot_id,
        reason=report.reason,
        details=report.details,
        client_ip=client_ip,
        status="open"
    )
    db.add(rep)
    spot.report_count = (spot.report_count or 0) + 1
    db.commit()
    db.refresh(rep)
    return rep

# --- Admin Moderation Endpoints ---

@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_password, role="user")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if user is None or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user = Depends(auth.get_current_user)):
    if isinstance(current_user, dict):
        # Handle fallback admin dict
        return schemas.UserResponse(
            id=current_user["id"], 
            email=current_user["email"], 
            role=current_user["role"],
            created_at=datetime.utcnow() # mock datetime for dict
        )
    return current_user

@app.put("/auth/me", response_model=schemas.UserResponse)
def update_my_profile(
    profile_data: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        updated = crud.update_user_profile(db, current_user, profile_data)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/submissions", response_model=List[schemas.CommunitySubmissionResponse])
def list_admin_submissions(status: str = "pending", db: Session = Depends(get_db), admin: str = Depends(auth.get_current_admin)):
    return crud.get_admin_submissions(db, status=status)

@app.post("/admin/submissions/{sub_id}/moderate", response_model=schemas.CommunitySubmissionResponse)
def moderate_community_submission(
    sub_id: str,
    action_data: schemas.ModerationAction,
    db: Session = Depends(get_db),
    admin: str = Depends(auth.get_current_admin)
):
    res = crud.moderate_submission(db, sub_id=sub_id, action=action_data.action, notes=action_data.notes)
    if not res:
        raise HTTPException(status_code=404, detail="Submission not found")
    return res

@app.get("/admin/reports", response_model=List[schemas.ReportResponse])
def list_admin_reports(status: str = "open", db: Session = Depends(get_db), admin: str = Depends(auth.get_current_admin)):
    return crud.get_admin_reports(db, status=status)

@app.post("/admin/reports/{report_id}/moderate", response_model=schemas.ReportResponse)
def moderate_report_item(
    report_id: str,
    action_data: schemas.ModerationAction,
    db: Session = Depends(get_db),
    admin: str = Depends(auth.get_current_admin)
):
    res = crud.moderate_report(db, report_id=report_id, action=action_data.action)
    if not res:
        raise HTTPException(status_code=404, detail="Report not found")
    return res

@app.get("/admin/suggested-updates", response_model=List[schemas.SuggestedUpdateResponse])
def list_admin_suggested_updates(status: str = "pending", db: Session = Depends(get_db), admin: str = Depends(auth.get_current_admin)):
    return crud.get_admin_suggested_updates(db, status=status)

@app.post("/admin/suggested-updates/{update_id}/moderate", response_model=schemas.SuggestedUpdateResponse)
def moderate_suggested_update_item(
    update_id: str,
    action_data: schemas.ModerationAction,
    db: Session = Depends(get_db),
    admin: str = Depends(auth.get_current_admin)
):
    res = crud.moderate_suggested_update(db, update_id=update_id, action=action_data.action)
    if not res:
        raise HTTPException(status_code=404, detail="Suggested update not found")
    return res

@app.get("/admin/community-updates", response_model=List[schemas.FeedbackResponse])
def list_admin_community_updates(limit: int = 50, db: Session = Depends(get_db), admin: str = Depends(auth.get_current_admin)):
    return crud.get_admin_community_updates(db, limit=limit)

@app.get("/stats")
def get_stats(db: Session = Depends(get_db), admin=Depends(auth.get_current_admin)):
    total_spots = db.query(models.Spot).count()
    total_events = db.query(models.Event).count()
    active_events = db.query(models.Event).filter(models.Event.status == "active").count()
    recurring_events = db.query(models.Event).filter(models.Event.is_recurring_or_time_only == True).count()
    total_reports = db.query(models.Report).filter(models.Report.status == "open").count()
    total_feedbacks = db.query(models.AvailabilityFeedback).count()
    total_submissions = db.query(models.CommunitySubmission).filter(models.CommunitySubmission.status == "pending").count()
    total_suggested_updates = db.query(models.SuggestedUpdate).filter(models.SuggestedUpdate.status == "pending").count()

    return {
        "total_spots": total_spots,
        "total_events": total_events,
        "active_events": active_events,
        "recurring_events": recurring_events,
        "total_reports": total_reports,
        "total_feedbacks": total_feedbacks,
        "total_submissions": total_submissions,
        "total_suggested_updates": total_suggested_updates
    }

@app.get("/admin/users", response_model=List[schemas.UserResponse])
def list_admin_users(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    return crud.get_admin_users(db, search=search)

@app.put("/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role_endpoint(
    user_id: str,
    role_data: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    new_role = role_data.role.strip().lower()
    if new_role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be either 'admin' or 'user'")
    
    current_admin_id = getattr(admin, 'id', None) or (admin.get('id') if isinstance(admin, dict) else None)
    if user_id == current_admin_id and new_role != "admin":
        admin_count = db.query(models.User).filter(models.User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the only remaining administrator.")

    user = crud.update_user_role(db, user_id=user_id, new_role=new_role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/admin/users/{user_id}")
def delete_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    current_admin_id = getattr(admin, 'id', None) or (admin.get('id') if isinstance(admin, dict) else None)
    if user_id == current_admin_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")
    
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": "User deleted successfully"}

@app.post("/admin/sync")
def trigger_sync(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Trigger data pipeline sync.
    Can be authorized via:
    1. Admin Bearer token (Authorization header)
    2. Shared secret (X-Cron-Secret header matching CRON_SECRET)
    """
    cron_secret_header = request.headers.get("X-Cron-Secret")
    is_cron_authorized = bool(
        settings.CRON_SECRET and cron_secret_header and cron_secret_header == settings.CRON_SECRET
    )

    if not is_cron_authorized:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authentication required (Admin token or valid X-Cron-Secret)")
        token = auth_header.split(" ", 1)[1]
        try:
            payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
            email = payload.get("sub")
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user or user.role != "admin":
                raise HTTPException(status_code=403, detail="Admin role required")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        data_pipeline_dir = Path(__file__).resolve().parent.parent.parent / "data-pipeline" / "src"
        if str(data_pipeline_dir) not in sys.path:
            sys.path.insert(0, str(data_pipeline_dir))

        # 1. Fresh upstream scrape & validation
        from scraper import run_scraper
        run_scraper(active_only=False)

        # 2. Synchronize clean dataset into database
        from sync import run_sync
        run_sync()

        return {
            "status": "success",
            "message": "Fresh upstream scrape, validation, and database synchronization completed successfully.",
        }
    except Exception as e:
        logger.error(f"Sync trigger failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Sync execution failed: {str(e)}")

