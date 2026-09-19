#!/usr/bin/env python3
"""
Annadhanam Spots Scraper
========================
A production-grade, resilient scraper and data validation pipeline for https://annadhanamspots.in/

Author: Antigravity AI
Architecture: Direct Supabase PostgREST API with Playwright runtime inspection fallback.
"""

import os
import sys
import json
import csv
import time
import logging
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Set

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Ensure UTF-8 output encoding across Windows / Linux / macOS
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==========================================
# CONFIGURATION & CONSTANTS
# ==========================================
# Upstream Annadhanam Spots Source Supabase REST API
# Priority: SOURCE_SUPABASE_URL / SOURCE_SUPABASE_KEY -> fallback to SUPABASE_URL / SUPABASE_KEY
DEFAULT_SUPABASE_URL = os.getenv("SOURCE_SUPABASE_URL") or os.getenv("SUPABASE_URL", "")
DEFAULT_API_KEY = os.getenv("SOURCE_SUPABASE_KEY") or os.getenv("SUPABASE_KEY", "")
DEFAULT_TARGET_URL = os.getenv("TARGET_URL", "https://annadhanamspots.in/")
DEFAULT_BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1000"))
DEFAULT_REQUEST_DELAY = float(os.getenv("REQUEST_DELAY", "0.2"))
DEFAULT_MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))


# IST Timezone (+05:30) for local display
IST_TZ = timezone(timedelta(hours=5, minutes=30))

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"
LOGS_DIR = BASE_DIR / "logs"

LOGS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("annadhanam_scraper")
logger.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s", datefmt="%H:%M:%S")
console_handler.setFormatter(console_formatter)

# File handler
file_handler = logging.FileHandler(LOGS_DIR / "scraper.log", mode="a", encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(filename)s:%(lineno)d - %(message)s")
file_handler.setFormatter(file_formatter)

if not logger.handlers:
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)


class AnnadhanamScraper:
    """Production-grade scraper for Annadhanam spot listings with validation and cleaning."""

    def __init__(
        self,
        supabase_url: str = DEFAULT_SUPABASE_URL,
        api_key: str = DEFAULT_API_KEY,
        batch_size: int = DEFAULT_BATCH_SIZE,
        request_delay: float = DEFAULT_REQUEST_DELAY,
        max_retries: int = DEFAULT_MAX_RETRIES,
        output_dir: Optional[Path] = None,
    ):
        self.supabase_url = supabase_url.rstrip("/")
        self.api_key = api_key
        self.batch_size = min(max(1, batch_size), 1000)  # PostgREST server cap is 1000
        self.request_delay = request_delay
        self.max_retries = max_retries
        self.output_dir = Path(output_dir) if output_dir else DATA_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.session = self._create_resilient_session()

    def _create_resilient_session(self) -> requests.Session:
        """Create a requests Session configured with automatic retries and exponential backoff."""
        session = requests.Session()
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=1.0,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "HEAD", "OPTIONS"],
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)

        session.headers.update({
            "apikey": self.api_key,
            "authorization": f"Bearer {self.api_key}",
            "prefer": "count=exact",
            "accept-profile": "public",
            "x-client-info": "annadhanam-scraper/2.0.0",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        return session

    @classmethod
    def discover_credentials_with_playwright(cls, target_url: str = DEFAULT_TARGET_URL) -> Tuple[str, str]:
        """
        Dynamically launch Playwright to inspect browser network traffic and
        extract live API endpoints and authorization tokens.
        """
        logger.info(f"Launching Playwright network inspection on {target_url}...")
        from playwright.sync_api import sync_playwright

        discovered_url = None
        discovered_key = None

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            def on_request(request):
                nonlocal discovered_url, discovered_key
                url = request.url
                if "supabase.co/rest/v1" in url or "location_feed" in url:
                    logger.debug(f"Intercepted API request: {url}")
                    headers = request.headers
                    apikey = headers.get("apikey") or headers.get("authorization", "").replace("Bearer ", "")
                    if apikey:
                        discovered_key = apikey
                        base_url = url.split("/location_feed")[0]
                        discovered_url = base_url

            page.on("request", on_request)
            try:
                page.goto(target_url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)
            except Exception as e:
                logger.warning(f"Playwright navigation warning: {e}")
            finally:
                browser.close()

        if discovered_url and discovered_key:
            logger.info(f"Successfully discovered live API URL: {discovered_url}")
            return discovered_url, discovered_key
        else:
            logger.warning("Dynamic discovery didn't capture headers; falling back to default configuration.")
            return DEFAULT_SUPABASE_URL, DEFAULT_API_KEY

    def fetch_listings(
        self,
        active_only: bool = False,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch all listing records from the Supabase location_feed view with automated pagination.

        :param active_only: If True, reproduces the website's active feed (end_time > now).
        :param search_query: Optional keyword search across area_name and landmark.
        :return: List of all fetched raw records.
        """
        endpoint = f"{self.supabase_url}/location_feed"
        records_by_id: Dict[str, Dict[str, Any]] = {}
        offset = 0
        total_server_count: Optional[int] = None

        filter_desc = "ACTIVE ONLY (end_time > now)" if active_only else "ALL RECORDS (Historical + Active + Future)"
        logger.info(f"Starting retrieval. Mode: {filter_desc} | Batch Size: {self.batch_size}")

        now_iso = datetime.now(timezone.utc).isoformat()

        while True:
            params: Dict[str, Any] = {
                "select": "*",
                "order": "start_time.asc,id.asc",
                "offset": offset,
                "limit": self.batch_size
            }

            if active_only:
                params["end_time"] = f"gt.{now_iso}"

            if search_query:
                clean_search = search_query.strip().replace(",", " ")
                params["or"] = f"(area_name.ilike.%{clean_search}%,landmark.ilike.%{clean_search}%)"

            try:
                logger.debug(f"Requesting offset={offset}, limit={self.batch_size}...")
                response = self.session.get(endpoint, params=params, timeout=30)
            except requests.RequestException as e:
                logger.error(f"Network error on offset {offset}: {e}. Retrying after delay...")
                time.sleep(2.0)
                continue

            if response.status_code not in (200, 206):
                logger.error(f"Failed request! HTTP {response.status_code}: {response.text}")
                break

            # Parse total records from Content-Range header (e.g. '0-999/4476')
            content_range = response.headers.get("content-range", "")
            if "/" in content_range:
                try:
                    total_server_count = int(content_range.split("/")[-1])
                except ValueError:
                    pass

            batch = response.json()
            if not isinstance(batch, list) or len(batch) == 0:
                logger.info("No more records returned by server. Pagination complete.")
                break

            batch_count = len(batch)
            new_records = 0
            for item in batch:
                item_id = item.get("id")
                if item_id and item_id not in records_by_id:
                    records_by_id[item_id] = item
                    new_records += 1

            collected = len(records_by_id)
            total_display = total_server_count if total_server_count is not None else "?"
            pct = f"({(collected / total_server_count * 100):.1f}%)" if total_server_count else ""

            logger.info(
                f"Batch fetched: {batch_count} items ({new_records} new) | "
                f"Total collected: {collected}/{total_display} {pct} | Offset: {offset}"
            )

            # If fewer items than batch_size returned, end reached
            if batch_count < self.batch_size:
                break

            offset += batch_count
            if self.request_delay > 0:
                time.sleep(self.request_delay)

        all_records = list(records_by_id.values())
        logger.info(f"Retrieval finished! Total unique records collected: {len(all_records)}")
        return all_records

    @staticmethod
    def normalize_record(raw: Dict[str, Any], now_utc: datetime) -> Dict[str, Any]:
        """
        Transform, clean, and enrich a raw record into the standardized schema.
        Handles dummy/recurring dates (e.g. year 1901) without silently inventing dates.
        """
        lat = raw.get("latitude")
        lon = raw.get("longitude")
        start_time_raw = raw.get("start_time") or ""
        end_time_raw = raw.get("end_time") or ""
        created_at_raw = raw.get("created_at") or ""
        area_name = raw.get("area_name") or ""
        landmark = raw.get("landmark") or ""
        meal_details = raw.get("meal_details")

        # Quality flags list
        quality_flags: List[str] = []

        # Coordinates check
        gmaps_url = ""
        if lat is not None and lon is not None:
            if not (-90 <= lat <= 90 and -180 <= lon <= 180) or (lat == 0 and lon == 0):
                quality_flags.append("INVALID_COORDINATES")
            else:
                gmaps_url = f"https://www.google.com/maps?q={lat},{lon}"
                # Check for geographic coordinate anomalies
                if not (6.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0):
                    quality_flags.append("COORDINATES_OUTSIDE_INDIA")
        else:
            quality_flags.append("MISSING_COORDINATES")

        # Area check
        if not area_name.strip():
            quality_flags.append("MISSING_AREA_NAME")

        # Parse timestamps & detect dummy/recurring dates
        start_dt = None
        end_dt = None
        start_date = ""
        start_time_local = ""
        end_date = ""
        end_time_local = ""
        duration_hours = None
        is_dummy_date = False
        is_active = False
        status = "unknown"

        if start_time_raw:
            try:
                start_dt = datetime.fromisoformat(start_time_raw.replace("Z", "+00:00"))
            except Exception:
                quality_flags.append("INVALID_START_TIMESTAMP")

        if end_time_raw:
            try:
                end_dt = datetime.fromisoformat(end_time_raw.replace("Z", "+00:00"))
            except Exception:
                quality_flags.append("INVALID_END_TIMESTAMP")

        # Check if timestamps represent dummy/recurring time-only dates (e.g. year 1901)
        if start_dt and (start_dt.year < 2020 or start_dt.year > 2030):
            is_dummy_date = True
            quality_flags.append("DUMMY_TIME_ONLY_DATE")
        elif end_dt and (end_dt.year < 2020 or end_dt.year > 2030):
            is_dummy_date = True
            quality_flags.append("DUMMY_TIME_ONLY_DATE")

        if start_dt and end_dt:
            if end_dt < start_dt:
                quality_flags.append("INVERTED_TIMESTAMPS")

            duration_seconds = (end_dt - start_dt).total_seconds()
            if 0 <= duration_seconds <= 86400 * 30:
                duration_hours = round(duration_seconds / 3600.0, 2)

        # Populate date & local time strings (converting to IST for local timing)
        if is_dummy_date:
            # For time-only / recurring dummy dates, do NOT invent an event date.
            # Preserve the time component in local IST format and flag as time-only.
            if start_dt:
                start_time_ist = start_dt.astimezone(IST_TZ)
                start_time_local = start_time_ist.strftime("%I:%M %p IST")
                start_date = ""  # Not a real calendar event date
            if end_dt:
                end_time_ist = end_dt.astimezone(IST_TZ)
                end_time_local = end_time_ist.strftime("%I:%M %p IST")
                end_date = ""    # Not a real calendar event date

            status = "recurring_time_only"
            is_active = False  # Dummy date in the past is not currently active on the calendar
        else:
            if start_dt:
                start_time_ist = start_dt.astimezone(IST_TZ)
                start_date = start_time_ist.strftime("%Y-%m-%d")
                start_time_local = start_time_ist.strftime("%I:%M %p IST")

            if end_dt:
                end_time_ist = end_dt.astimezone(IST_TZ)
                end_date = end_time_ist.strftime("%Y-%m-%d")
                end_time_local = end_time_ist.strftime("%I:%M %p IST")

                # Status calculation relative to current time
                is_active = end_dt > now_utc
                if is_active:
                    if start_dt and start_dt > now_utc:
                        status = "upcoming"
                    else:
                        status = "active"
                else:
                    status = "expired"

        if not quality_flags:
            quality_flags.append("CLEAN")

        return {
            "id": raw.get("id", ""),
            "area_name": area_name,
            "landmark": landmark,
            "meal_details": meal_details if meal_details is not None else "",
            "latitude": lat,
            "longitude": lon,
            "start_time_raw": start_time_raw,
            "end_time_raw": end_time_raw,
            "created_at": created_at_raw,
            "interested_count": int(raw.get("interested_count") or 0),
            "report_count": int(raw.get("report_count") or 0),
            "google_maps_url": gmaps_url,
            "status": status,
            "is_active": is_active,
            "start_date": start_date,
            "start_time_local": start_time_local,
            "end_date": end_date,
            "end_time_local": end_time_local,
            "duration_hours": duration_hours,
            "is_dummy_or_recurring_date": is_dummy_date,
            "quality_flags": ";".join(quality_flags)
        }

    def save_data(self, raw_records: List[Dict[str, Any]]) -> Tuple[Path, Path, Path]:
        """
        Save outputs:
        1. data/annadhanam_spots_raw.json
        2. data/annadhanam_spots_clean.json
        3. data/annadhanam_spots_clean.csv
        """
        raw_json_path = self.output_dir / "annadhanam_spots_raw.json"
        clean_json_path = self.output_dir / "annadhanam_spots_clean.json"
        clean_csv_path = self.output_dir / "annadhanam_spots_clean.csv"

        # 1. Save Raw JSON
        logger.info(f"Saving {len(raw_records)} raw records to {raw_json_path}...")
        with open(raw_json_path, "w", encoding="utf-8") as f:
            json.dump(raw_records, f, indent=2, ensure_ascii=False)

        # 2. Normalize records
        now_utc = datetime.now(timezone.utc)
        normalized_records = [self.normalize_record(r, now_utc) for r in raw_records]

        # 3. Save Clean JSON
        logger.info(f"Saving {len(normalized_records)} clean records to {clean_json_path}...")
        with open(clean_json_path, "w", encoding="utf-8") as f:
            json.dump(normalized_records, f, indent=2, ensure_ascii=False)

        # 4. Save Clean CSV
        if normalized_records:
            fieldnames = list(normalized_records[0].keys())
        else:
            fieldnames = [
                "id", "area_name", "landmark", "meal_details", "latitude", "longitude",
                "start_time_raw", "end_time_raw", "created_at", "interested_count",
                "report_count", "google_maps_url", "status", "is_active", "start_date",
                "start_time_local", "end_date", "end_time_local", "duration_hours",
                "is_dummy_or_recurring_date", "quality_flags"
            ]

        logger.info(f"Saving {len(normalized_records)} clean records to {clean_csv_path}...")
        with open(clean_csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()
            writer.writerows(normalized_records)

        return raw_json_path, clean_json_path, clean_csv_path

    @staticmethod
    def audit_and_validate(records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform thorough data-quality validation and metrics calculation."""
        now_utc = datetime.now(timezone.utc)
        total = len(records)
        unique_ids = set()
        duplicate_count = 0

        missing_coords = 0
        invalid_coords = 0
        coords_outside_india = 0
        missing_address = 0
        missing_timings = 0
        dummy_dates = 0
        invalid_timestamps = 0
        active_count = 0
        expired_count = 0
        future_count = 0
        recurring_count = 0

        for r in records:
            r_id = r.get("id")
            if r_id in unique_ids:
                duplicate_count += 1
            else:
                unique_ids.add(r_id)

            lat = r.get("latitude")
            lon = r.get("longitude")
            area = r.get("area_name")
            st_raw = r.get("start_time") or r.get("start_time_raw")
            et_raw = r.get("end_time") or r.get("end_time_raw")

            # Coordinates validation
            if lat is None or lon is None:
                missing_coords += 1
            else:
                if not (-90 <= lat <= 90 and -180 <= lon <= 180) or (lat == 0 and lon == 0):
                    invalid_coords += 1
                elif not (6.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0):
                    coords_outside_india += 1

            # Address validation
            if not area or not str(area).strip():
                missing_address += 1

            # Timings validation
            if not st_raw or not et_raw:
                missing_timings += 1
                continue

            st_dt = None
            et_dt = None
            try:
                st_dt = datetime.fromisoformat(str(st_raw).replace("Z", "+00:00"))
            except Exception:
                invalid_timestamps += 1

            try:
                et_dt = datetime.fromisoformat(str(et_raw).replace("Z", "+00:00"))
            except Exception:
                invalid_timestamps += 1

            if st_dt and et_dt:
                is_dummy = (st_dt.year < 2020 or st_dt.year > 2030 or et_dt.year < 2020 or et_dt.year > 2030)
                if is_dummy:
                    dummy_dates += 1
                    recurring_count += 1
                elif et_dt <= now_utc:
                    expired_count += 1
                elif st_dt > now_utc:
                    future_count += 1
                    active_count += 1
                else:
                    active_count += 1

        report = {
            "total_records": total,
            "unique_ids": len(unique_ids),
            "duplicate_ids": duplicate_count,
            "missing_coordinates": missing_coords,
            "invalid_coordinates": invalid_coords,
            "coords_outside_india": coords_outside_india,
            "missing_address": missing_address,
            "missing_timings": missing_timings,
            "dummy_or_time_only_dates": dummy_dates,
            "active_records": active_count,
            "expired_records": expired_count,
            "future_records": future_count,
            "recurring_or_dummy_records": recurring_count,
            "invalid_timestamps": invalid_timestamps
        }
        return report

    @classmethod
    def print_validation_report(cls, records: List[Dict[str, Any]]):
        """Print the complete audit and validation summary formatted for the console."""
        metrics = cls.audit_and_validate(records)

        print("\n" + "=" * 76)
        print("                 DATA INTEGRITY & VALIDATION REPORT")
        print("=" * 76)
        print(f"Total Records Collected:            {metrics['total_records']:,}")
        print(f"Unique Record IDs:                  {metrics['unique_ids']:,}")
        print(f"Duplicate IDs:                      {metrics['duplicate_ids']:,}")
        print(f"Active Records (end_time > now):    {metrics['active_records']:,} (Reproduces live website feed)")
        print(f"  • In-Progress / Ongoing Spots:    {metrics['active_records'] - metrics['future_records']:,}")
        print(f"  • Future / Upcoming Spots:        {metrics['future_records']:,}")
        print(f"Expired / Past Records:             {metrics['expired_records']:,}")
        print(f"Dummy / Time-Only Dates (e.g. 1901):{metrics['dummy_or_time_only_dates']:,} (Flagged; date not invented)")
        print("-" * 76)
        print("Data Quality & Field Completeness:")
        print(f"  • Missing Coordinates:            {metrics['missing_coordinates']:,}")
        print(f"  • Invalid Lat/Long Coordinates:   {metrics['invalid_coordinates']:,}")
        print(f"  • Coordinates Outside India Box:  {metrics['coords_outside_india']:,} (Flagged with COORDINATES_OUTSIDE_INDIA)")
        print(f"  • Missing Address / Area:         {metrics['missing_address']:,}")
        print(f"  • Missing Timings:                {metrics['missing_timings']:,}")
        print(f"  • Invalid Timestamps:             {metrics['invalid_timestamps']:,}")
        print("-" * 76)

        if records:
            sample_item = records[0]
            print(f"Clean Schema Fields ({len(sample_item.keys())} fields):")
            for k in sample_item.keys():
                sample_val = sample_item.get(k)
                val_type = type(sample_val).__name__
                preview = repr(sample_val)[:40]
                print(f"  • {k:<26} ({val_type:<8}): {preview}")

            print("-" * 76)
            print("5 Sample Records (Normalized):")
            for i, r in enumerate(records[:5], 1):
                print(f"\n[Record {i}] ID: {r.get('id')}")
                print(f"  Area:        {r.get('area_name')}")
                print(f"  Landmark:    {r.get('landmark')}")
                print(f"  Coordinates: {r.get('latitude')}, {r.get('longitude')} -> {r.get('google_maps_url')}")
                print(f"  Raw Timing:  {r.get('start_time_raw', r.get('start_time'))} -> {r.get('end_time_raw', r.get('end_time'))}")
                print(f"  Local Time:  {r.get('start_time_local', '')} to {r.get('end_time_local', '')} | Status: {r.get('status')}")
                print(f"  Engagement:  Interested={r.get('interested_count')}, Reports={r.get('report_count')}")
                print(f"  Flags:       {r.get('quality_flags', 'N/A')}")

        print("=" * 76 + "\n")


def run_scraper(
    active_only: bool = False,
    search: Optional[str] = None,
    output_dir: Optional[Path] = None,
) -> Tuple[Path, Path, Path]:
    """
    Programmatic entry point for scraping and validating upstream Annadhanam Spots.
    Fetches raw listings, cleans and validates schema, and writes clean JSON/CSV.
    """
    url = DEFAULT_SUPABASE_URL
    key = DEFAULT_API_KEY
    if not url or not key:
        raise ValueError(
            "Missing source credentials. Please set SOURCE_SUPABASE_URL and SOURCE_SUPABASE_KEY."
        )

    out_dir = Path(output_dir) if output_dir else DATA_DIR
    scraper = AnnadhanamScraper(
        supabase_url=url,
        api_key=key,
        batch_size=DEFAULT_BATCH_SIZE,
        output_dir=out_dir,
    )

    start_time = time.time()
    raw_records = scraper.fetch_listings(
        active_only=active_only, search_query=search
    )
    if not raw_records:
        raise RuntimeError("No records were retrieved from upstream source.")

    raw_json_path, clean_json_path, clean_csv_path = scraper.save_data(raw_records)
    elapsed = time.time() - start_time
    logger.info(
        f"Scraping & Cleaning completed in {elapsed:.2f} seconds ({len(raw_records)} records)."
    )
    return raw_json_path, clean_json_path, clean_csv_path


def main():

    parser = argparse.ArgumentParser(description="Annadhanam Spots Robust Production Scraper")
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--all",
        action="store_true",
        default=True,
        help="Retrieve all publicly accessible records (default: True)"
    )
    group.add_argument(
        "--active-only",
        action="store_true",
        help="Only retrieve active/future listings (reproduces live website feed)"
    )

    parser.add_argument(
        "--search",
        type=str,
        default=None,
        help="Filter spots by keyword search"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help="Batch size per page (default: 1000)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(DATA_DIR),
        help="Output directory for data files"
    )
    parser.add_argument(
        "--inspect-playwright",
        action="store_true",
        help="Run Playwright live network interception before scraping"
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate existing clean data files without re-downloading"
    )

    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    clean_json_file = out_dir / "annadhanam_spots_clean.json"

    if args.validate_only:
        if not clean_json_file.exists():
            logger.error(f"File not found for validation: {clean_json_file}")
            sys.exit(1)
        with open(clean_json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        AnnadhanamScraper.print_validation_report(data)
        return

    url = DEFAULT_SUPABASE_URL
    key = DEFAULT_API_KEY

    if args.inspect_playwright:
        url, key = AnnadhanamScraper.discover_credentials_with_playwright()

    if not url or not key:
        logger.error("Missing source credentials. Please set SOURCE_SUPABASE_URL and SOURCE_SUPABASE_KEY in your .env file.")
        return

    scraper = AnnadhanamScraper(
        supabase_url=url,
        api_key=key,
        batch_size=args.batch_size,
        output_dir=out_dir
    )


    # Determine mode
    is_active_only = args.active_only and not (args.all and not args.active_only)

    start_time = time.time()
    raw_records = scraper.fetch_listings(
        active_only=is_active_only,
        search_query=args.search
    )

    if not raw_records:
        logger.warning("No records were retrieved.")
        return

    raw_json_path, clean_json_path, clean_csv_path = scraper.save_data(raw_records)
    elapsed = time.time() - start_time

    logger.info(f"Scraping & Cleaning completed in {elapsed:.2f} seconds!")
    logger.info(f"Raw JSON Output:   {raw_json_path}")
    logger.info(f"Clean JSON Output: {clean_json_path}")
    logger.info(f"Clean CSV Output:  {clean_csv_path}")

    # Load normalized output and print validation report
    with open(clean_json_path, "r", encoding="utf-8") as f:
        clean_records = json.load(f)

    AnnadhanamScraper.print_validation_report(clean_records)


if __name__ == "__main__":
    main()
