import urllib.request
import json
import sys

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("=== Testing Free Food Hyderabad Backend & Discovery Engine ===")
    
    # 1. Categories
    req = urllib.request.urlopen(f"{BASE_URL}/categories")
    categories = json.loads(req.read().decode())
    print(f"[PASS] Categories loaded: {len(categories)} categories found.")
    for c in categories:
        print(f"  - {c['name']}: {c['count']} spots")
        
    unverified_cat = next((c for c in categories if c['name'] == 'Unverified Places'), None)
    assert unverified_cat is not None, "Unverified Places category missing"
    print(f"[PASS] Unverified Places category exists with count {unverified_cat['count']}")

    req_unverified = urllib.request.urlopen(f"{BASE_URL}/spots?category=Unverified%20Places&limit=5")
    unverified_res = json.loads(req_unverified.read().decode())
    print(f"[PASS] Unverified Places API returned {unverified_res['total']} items")
    for s in unverified_res['items']:
        assert s.get('source_type') != 'imported', "Unverified Places must not contain verified/imported spots"
        
    # 2. Spots & Search
    req = urllib.request.urlopen(f"{BASE_URL}/spots?search=Ameerpet&limit=5")
    spots_res = json.loads(req.read().decode())
    print(f"\n[PASS] Search 'Ameerpet': {spots_res['total']} results found (Page {spots_res['page']}/{spots_res['pages']})")
    assert len(spots_res['items']) > 0, "Expected Ameerpet search results"
    sample = spots_res['items'][0]
    print(f"  Sample spot: '{sample['name']}' in '{sample['area_name']}' - Status: {sample['status']}")

    # 3. Map Points (Clustering payload)
    req = urllib.request.urlopen(f"{BASE_URL}/spots/map-points")
    map_points = json.loads(req.read().decode())
    print(f"\n[PASS] Map points: {len(map_points)} geographic pins ready for clustering.")
    assert len(map_points) > 1000, "Expected thousands of real map points"

    # 4. Near Me (Haversine Geo-distance)
    # Charminar coords: 17.3616, 78.4747
    req = urllib.request.urlopen(f"{BASE_URL}/spots/nearby?lat=17.3616&lon=78.4747&radius_km=10&limit=5")
    nearby_res = json.loads(req.read().decode())
    print(f"\n[PASS] Near Me query near Charminar (17.3616, 78.4747):")
    for s in nearby_res:
        dist = s.get('distance_km')
        print(f"  - {s['name']} | {s['area_name']} | Distance: {dist:.2f} km away")
    if nearby_res:
        assert nearby_res[0]['distance_km'] <= nearby_res[-1]['distance_km'], "Spots must be sorted nearest first"

    # 5. Today Sections
    req = urllib.request.urlopen(f"{BASE_URL}/events/today-sections")
    today_res = json.loads(req.read().decode())
    print(f"\n[PASS] Today sections:")
    print(f"  [NOW] Serving Now: {len(today_res['serving_now'])} items")
    print(f"  [SOON] Starting Soon: {len(today_res['starting_soon'])} items")
    print(f"  [LATER] Later Today: {len(today_res['later_today'])} items")

    # 6. Upcoming Grouped
    req = urllib.request.urlopen(f"{BASE_URL}/events/upcoming-grouped?limit=10")
    upcoming_res = json.loads(req.read().decode())
    print(f"\n[PASS] Upcoming grouped by date: {len(upcoming_res)} date clusters")
    for group in upcoming_res[:3]:
        print(f"  [DATE] {group.get('label', group.get('date'))} ({len(group['spots'])} spots)")

    # 7. Single Spot Detail
    test_id = sample['id']
    req = urllib.request.urlopen(f"{BASE_URL}/spots/{test_id}")
    detail = json.loads(req.read().decode())
    print(f"\n[PASS] Spot Details for ID {test_id}:")
    print(f"  Name: {detail['name']}")
    print(f"  Area: {detail['area_name']}")
    print(f"  Resolved Meal Details: {detail.get('resolved_meal_details')}")
    print(f"  Provenance: {detail.get('meal_provenance_badge')}")
    print(f"  Confirmations: {detail.get('community_confirmation')}")

    # 8. Feedback submission
    feedback_payload = json.dumps({
        "spot_id": test_id,
        "feedback_type": "serving_now"
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/community/feedback", data=feedback_payload, headers={'Content-Type': 'application/json'})
    fb_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"\n[PASS] Community feedback submitted successfully: ID {fb_res.get('id')}")

    print("\nSUCCESS: ALL DISCOVERY & COMMUNITY E2E FLOWS TESTED AND VERIFIED!")


if __name__ == "__main__":
    test_api()
