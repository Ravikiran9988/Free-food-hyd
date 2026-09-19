import os
import urllib.request
import urllib.parse
import json
import sys


BASE_URL = "http://127.0.0.1:8000"

def get_auth_token(email, password):
    data = urllib.parse.urlencode({'username': email, 'password': password}).encode()
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data)
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read().decode())['access_token']
    except Exception as e:
        print(f"Failed to login with {email}: {e}")
        return None

def test_admin_flow():
    print("=== Testing Admin Moderation Flow E2E ===")

    # 1. Register a public user
    user_email = "testpublicuser@example.com"
    user_pass = "publicpass"
    try:
        req = urllib.request.Request(f"{BASE_URL}/auth/register", data=json.dumps({'email': user_email, 'password': user_pass}).encode(), headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req)
        print(f"[PASS] Registered public user {user_email}")
    except Exception as e:
        # Might already exist, ignore
        pass

    user_token = get_auth_token(user_email, user_pass)
    assert user_token is not None, "Failed to get user token"
    
    # 2. Submit a community spot
    spot_payload = {
        "name": "E2E Test Community Spot",
        "area_name": "Test Area",
        "landmark": "Test Landmark",
        "category": "Annadhanam",
        "start_time": "12:00:00",
        "end_time": "14:00:00",
        "latitude": 17.0,
        "longitude": 78.0
    }
    req = urllib.request.Request(f"{BASE_URL}/community/submit", data=json.dumps(spot_payload).encode(), headers={'Content-Type': 'application/json'})
    submit_res = json.loads(urllib.request.urlopen(req).read().decode())
    sub_id = submit_res['id']
    print(f"[PASS] Submitted community spot, ID: {sub_id}")

    # 3. Login as Admin
    admin_email = os.getenv("E2E_ADMIN_USERNAME") or os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("E2E_ADMIN_PASSWORD") or os.getenv("ADMIN_PASSWORD")
    if not admin_email or not admin_password:
        raise RuntimeError("Set E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD (or ADMIN_USERNAME/ADMIN_PASSWORD) before running the admin E2E test.")
    admin_token = get_auth_token(admin_email, admin_password)
    assert admin_token is not None, "Failed to get admin token"
    print(f"[PASS] Admin logged in successfully")

    # 4. View Pending Submissions
    req = urllib.request.Request(f"{BASE_URL}/admin/submissions", headers={'Authorization': f'Bearer {admin_token}'})
    pending_res = json.loads(urllib.request.urlopen(req).read().decode())
    assert any(s['id'] == sub_id for s in pending_res), "Submitted spot not found in pending submissions"
    print(f"[PASS] Found submission {sub_id} in pending list")

    # 5. Approve Submission
    action_payload = {"action": "approve"}
    req = urllib.request.Request(f"{BASE_URL}/admin/submissions/{sub_id}/moderate", data=json.dumps(action_payload).encode(), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {admin_token}'})
    approve_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"[PASS] Approved submission. New Spot created!")

    # 6. Verify Spot on Public Map
    # The new spot should be visible via /spots
    req = urllib.request.urlopen(f"{BASE_URL}/spots?search=E2E%20Test%20Community%20Spot&limit=1")
    spots_res = json.loads(req.read().decode())
    assert spots_res['total'] > 0, "Approved spot did not appear in public search!"
    live_spot = spots_res['items'][0]
    print(f"[PASS] Approved spot is LIVE on public search! ID: {live_spot['id']}")
    
    # 7. Check Admin Stats
    req = urllib.request.Request(f"{BASE_URL}/stats", headers={'Authorization': f'Bearer {admin_token}'})
    stats_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"[PASS] Admin Stats fetched successfully. Active events: {stats_res['active_events']}, Total submissions: {stats_res['total_submissions']}")

    print("\nSUCCESS: ADMIN MODERATION FLOW E2E PASSED!")

if __name__ == "__main__":
    import urllib.parse
    test_admin_flow()
