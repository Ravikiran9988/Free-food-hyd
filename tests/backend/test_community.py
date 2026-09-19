import unittest
import sys
import os
from pathlib import Path

backend_app_dir = Path(__file__).resolve().parent.parent.parent / "apps" / "backend" / "app"
if str(backend_app_dir) not in sys.path:
    sys.path.insert(0, str(backend_app_dir))

from datetime import datetime, timedelta
from time_utils import compute_event_realtime_status, aggregate_feedbacks, parse_time_str
from database import SessionLocal, Base, engine
import models
import schemas
import crud

class TestCommunityLayer(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_parse_time_str(self):
        self.assertEqual(parse_time_str("12:30 PM"), (12, 30))
        self.assertEqual(parse_time_str("01:15 PM"), (13, 15))
        self.assertEqual(parse_time_str("09:00 AM"), (9, 0))
        self.assertEqual(parse_time_str("12:00 AM"), (0, 0))
        self.assertEqual(parse_time_str("Schedule not specified"), None)

    def test_realtime_status_calculation(self):
        # 1. Test Serving Now: current time is 1:00 PM, event is 12:30 PM - 2:30 PM
        current_1pm = datetime(2026, 9, 18, 13, 0)
        status = compute_event_realtime_status("12:30 PM", "02:30 PM", is_recurring=True, current_dt=current_1pm)
        self.assertEqual(status, "serving_now")

        # 2. Test Starting Soon: current time is 11:30 AM (60 min before 12:30 PM)
        current_1130am = datetime(2026, 9, 18, 11, 30)
        status = compute_event_realtime_status("12:30 PM", "02:30 PM", is_recurring=True, current_dt=current_1130am)
        self.assertEqual(status, "starting_soon")

        # 3. Test Expired: current time is 4:00 PM (after 2:30 PM)
        current_4pm = datetime(2026, 9, 18, 16, 0)
        status = compute_event_realtime_status("12:30 PM", "02:30 PM", is_recurring=True, current_dt=current_4pm)
        self.assertEqual(status, "expired")

        # 4. Test Upcoming: current time is 8:00 AM (more than 90 min before 12:30 PM)
        current_8am = datetime(2026, 9, 18, 8, 0)
        status = compute_event_realtime_status("12:30 PM", "02:30 PM", is_recurring=True, current_dt=current_8am)
        self.assertEqual(status, "upcoming")

    def test_feedback_aggregation_and_recency_expiry(self):
        now = datetime.utcnow()
        
        # Fresh feedback (10 minutes ago)
        fresh_fb1 = models.AvailabilityFeedback(
            spot_id="test-spot",
            feedback_type="serving_now",
            created_at=now - timedelta(minutes=10)
        )
        fresh_fb2 = models.AvailabilityFeedback(
            spot_id="test-spot",
            feedback_type="serving_now",
            created_at=now - timedelta(minutes=5)
        )
        
        # Expired / Stale feedback from yesterday (24 hours ago)
        stale_fb = models.AvailabilityFeedback(
            spot_id="test-spot",
            feedback_type="serving_now",
            created_at=now - timedelta(hours=24)
        )

        # Disputed feedback (15 minutes ago)
        dispute_fb = models.AvailabilityFeedback(
            spot_id="test-spot",
            feedback_type="started_late",
            created_at=now - timedelta(minutes=15)
        )

        all_feedbacks = [fresh_fb1, fresh_fb2, stale_fb, dispute_fb]
        stats = aggregate_feedbacks(all_feedbacks, recency_hours=3.0, current_dt=now)

        # Assert stale feedback is excluded from confirmation count
        self.assertEqual(stats["confirmed_count"], 2)
        self.assertEqual(stats["started_late_count"], 1)
        self.assertEqual(stats["last_confirmation_minutes_ago"], 5)
        self.assertIn("2 people recently said it's happening", stats["confirmation_text"])
        self.assertIn("5 minutes ago", stats["confirmation_text"])

    def test_community_submission_and_moderation_lifecycle(self):
        # 1. Create a submission
        sub_data = schemas.CommunitySubmissionCreate(
            name="Sri Hanuman Langar",
            area_name="Dilsukhnagar, Hyderabad",
            landmark="Near Metro Station",
            category="Daily Free Food",
            start_time="01:00 PM",
            end_time="03:00 PM",
            meal_details="Hot Khichdi and Sweet Prashad",
            latitude=17.3688,
            longitude=78.5247
        )
        sub = crud.create_community_submission(self.db, sub_data, client_ip="127.0.0.1")
        self.assertEqual(sub.status, "pending")
        self.assertEqual(sub.name, "Sri Hanuman Langar")

        # 2. Moderate (Approve)
        approved_sub = crud.moderate_submission(self.db, sub.id, action="approve", notes="Verified by admin call")
        self.assertEqual(approved_sub.status, "approved")

        # 3. Verify that the spot was created with community provenance
        spot = self.db.query(models.Spot).filter(models.Spot.name == "Sri Hanuman Langar").first()
        self.assertIsNotNone(spot)
        self.assertEqual(spot.source_type, "community")
        self.assertEqual(spot.category, "Daily Free Food")
        self.assertEqual(len(spot.events), 1)
        self.assertEqual(len(spot.meal_details), 1)
        self.assertEqual(spot.meal_details[0].source_type, "community")

    def test_suggested_update_and_report_lifecycle(self):
        # Pick any existing spot
        spot = self.db.query(models.Spot).first()
        self.assertIsNotNone(spot)

        # 1. Create suggested update
        up = crud.create_suggested_update(
            self.db,
            spot_id=spot.id,
            update_type="timing_correction",
            suggested_value="Serves at 1:00 PM instead of 12:30 PM",
            reason="Summer timings changed",
            client_ip="127.0.0.1"
        )
        self.assertEqual(up.status, "pending")

        # Moderate update
        mod_up = crud.moderate_suggested_update(self.db, up.id, action="approve")
        self.assertEqual(mod_up.status, "approved")

        # 2. Create report
        rep = models.Report(
            spot_id=spot.id,
            reason="wrong_time",
            details="Timing differs by 30 minutes",
            client_ip="127.0.0.1",
            status="open"
        )
        self.db.add(rep)
        self.db.commit()

        # Moderate report
        mod_rep = crud.moderate_report(self.db, rep.id, action="resolve")
        self.assertEqual(mod_rep.status, "resolved")

if __name__ == "__main__":
    unittest.main()
