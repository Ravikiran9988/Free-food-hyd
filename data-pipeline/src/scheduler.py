import schedule
import time
import subprocess
import os
import logging
from sync import run_sync

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def job():
    logger.info("Starting scheduled scrape & sync job...")
    
    # 1. Run the scraper
    scraper_path = os.path.join(os.path.dirname(__file__), "scraper.py")
    try:
        subprocess.run(["python", scraper_path], check=True)
        logger.info("Scraping completed successfully.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Scraper failed with exit code {e.returncode}")
        return
        
    # 2. Run the safe sync
    try:
        run_sync()
        logger.info("Database sync completed successfully.")
    except Exception as e:
        logger.error(f"Sync failed: {e}")

if __name__ == "__main__":
    # Get schedule hour from env, default 2 AM
    hour = os.getenv("SYNC_SCHEDULE_HOUR", "02")
    schedule_time = f"{int(hour):02d}:00"
    
    logger.info(f"Scheduler started. Job will run daily at {schedule_time} UTC.")
    schedule.every().day.at(schedule_time).do(job)
    
    # Run once on startup to ensure we have data immediately in fresh deployments
    job()
    
    while True:
        schedule.run_pending()
        time.sleep(60)
