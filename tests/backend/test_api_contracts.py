import sys
import os
import uuid
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

backend_app_dir = Path(__file__).resolve().parent.parent.parent / "apps" / "backend" / "app"
if str(backend_app_dir) not in sys.path:
    sys.path.insert(0, str(backend_app_dir))

from main import app
from database import SessionLocal, Base, engine
import models
import auth

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "version" in data

def test_categories_contract():
    res = client.get("/categories")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    for cat in data:
        assert "name" in cat
        assert "slug" in cat
        assert "count" in cat
        assert isinstance(cat["count"], int)

def test_spots_pagination_and_search():
    res = client.get("/spots?page=1&limit=5")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert "pages" in data
    assert len(data["items"]) <= 5
    if data["items"]:
        item = data["items"][0]
        assert "id" in item
        assert "name" in item
        assert "area_name" in item
        assert "live_status" in item
        assert "community_confirmation" in item

def test_today_sections_contract():
    res = client.get("/events/today-sections")
    assert res.status_code == 200
    data = res.json()
    assert "serving_now" in data
    assert "starting_soon" in data
    assert "later_today" in data
    assert isinstance(data["serving_now"], list)
    assert isinstance(data["starting_soon"], list)
    assert isinstance(data["later_today"], list)

def test_map_points_contract():
    res = client.get("/spots/map-points")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        point = data[0]
        assert "id" in point
        assert "latitude" in point
        assert "longitude" in point
        assert "live_status" in point

def test_unauthenticated_admin_endpoints_blocked():
    admin_routes = [
        ("GET", "/stats"),
        ("GET", "/admin/submissions"),
        ("GET", "/admin/reports"),
        ("GET", "/admin/suggested-updates"),
        ("GET", "/admin/users"),
        ("POST", "/admin/sync"),
    ]
    for method, route in admin_routes:
        if method == "GET":
            res = client.get(route)
        else:
            res = client.post(route)
        assert res.status_code == 401, f"Expected 401 on {method} {route}, got {res.status_code}"

def test_normal_user_forbidden_from_admin_endpoints(setup_db):
    test_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "UserPass123!"
    
    # 1. Register normal user
    reg_res = client.post("/auth/register", json={"email": test_email, "password": test_password})
    assert reg_res.status_code == 200
    user_data = reg_res.json()
    assert user_data["role"] == "user"

    # 2. Login as normal user
    login_res = client.post("/auth/login", data={"username": test_email, "password": test_password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {token}"}

    # 3. Access own profile succeeds
    me_res = client.get("/auth/me", headers=user_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
    assert me_res.json()["role"] == "user"

    # 4. Access admin routes fails with 403 Forbidden
    admin_routes = [
        ("GET", "/stats"),
        ("GET", "/admin/submissions"),
        ("GET", "/admin/reports"),
        ("GET", "/admin/suggested-updates"),
        ("GET", "/admin/users"),
    ]
    for method, route in admin_routes:
        res = client.get(route, headers=user_headers)
        assert res.status_code == 403, f"Expected 403 on {route} for role='user', got {res.status_code}"

def test_cron_secret_authorization_for_sync():
    # Calling without secret or token -> 401
    res1 = client.post("/admin/sync")
    assert res1.status_code == 401

    # Calling with invalid secret -> 401
    res2 = client.post("/admin/sync", headers={"X-Cron-Secret": "wrong_secret_12345"})
    assert res2.status_code == 401
