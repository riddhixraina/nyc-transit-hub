"""
Background scheduler that periodically polls MTA feeds and refreshes
the local SQLite cache.

Uses APScheduler's BackgroundScheduler so jobs run in daemon threads
alongside the Flask dev server.
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

log = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start_scheduler(app) -> None:
    """
    Register polling jobs and start the background scheduler.

    Called once during app startup (from create_app).
    Guarded against double-start when the reloader is active.
    """
    global _scheduler
    if _scheduler is not None:
        return

    from app.services.mta_feed import fetch_all_subway_feeds, fetch_service_alerts
    from app.services.elevator_service import fetch_equipment_list, fetch_current_outages

    _scheduler = BackgroundScheduler(daemon=True)

    _scheduler.add_job(
        fetch_all_subway_feeds,
        "interval",
        args=[app],
        seconds=app.config["POLL_SUBWAY_SECONDS"],
        id="poll_subway",
        replace_existing=True,
    )

    _scheduler.add_job(
        fetch_service_alerts,
        "interval",
        args=[app],
        seconds=app.config["POLL_ALERTS_SECONDS"],
        id="poll_alerts",
        replace_existing=True,
    )

    _scheduler.add_job(
        fetch_equipment_list,
        "interval",
        args=[app],
        seconds=app.config["POLL_ELEVATOR_SECONDS"],
        id="poll_equipment",
        replace_existing=True,
    )

    _scheduler.add_job(
        fetch_current_outages,
        "interval",
        args=[app],
        seconds=app.config["POLL_ELEVATOR_SECONDS"],
        id="poll_outages",
        replace_existing=True,
    )

    _scheduler.start()
    log.info("Background scheduler started")

    log.info("Running initial data fetch ...")
    try:
        fetch_all_subway_feeds(app)
    except Exception:
        log.exception("Initial subway feed fetch failed")
    try:
        fetch_service_alerts(app)
    except Exception:
        log.exception("Initial alerts fetch failed")
    try:
        fetch_equipment_list(app)
    except Exception:
        log.exception("Initial equipment fetch failed")
    try:
        fetch_current_outages(app)
    except Exception:
        log.exception("Initial outages fetch failed")

    log.info("Initial data fetch complete")
