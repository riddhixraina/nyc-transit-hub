"""
Service layer for fetching and storing MTA GTFS-RT subway and alert feeds.
"""

import logging
from datetime import datetime, timezone

import requests

from app.database import get_db
from app.utils.gtfs_helpers import (
    extract_alerts,
    extract_trip_updates,
    parse_feed,
)

log = logging.getLogger(__name__)

FEED_TIMEOUT = 30  # seconds


def fetch_feed(url: str) -> bytes | None:
    """HTTP GET a protobuf feed URL; return raw bytes or None on failure."""
    try:
        resp = requests.get(url, timeout=FEED_TIMEOUT)
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "")
        if "html" in content_type or resp.content[:5] in (b"<html", b"<!DOC", b"<?xml"):
            log.warning("Non-protobuf response from %s (Content-Type: %s)", url, content_type)
            return None
        return resp.content
    except requests.RequestException as exc:
        log.error("Failed to fetch %s: %s", url, exc)
        return None


def fetch_all_subway_feeds(app) -> int:
    """
    Fetch every subway GTFS-RT feed, parse trip updates, and replace
    the trip_updates table contents with fresh data.

    Returns the total number of trip-update rows inserted.
    """
    from flask import current_app

    with app.app_context():
        feeds = current_app.config["SUBWAY_FEEDS"]
        now = datetime.now(timezone.utc).isoformat()
        all_updates: list[dict] = []

        for label, url in feeds.items():
            raw = fetch_feed(url)
            if raw is None:
                continue
            try:
                feed = parse_feed(raw)
                updates = extract_trip_updates(feed)
                all_updates.extend(updates)
                log.info("  [%s] %d stop-time updates", label, len(updates))
            except Exception:
                log.exception("Error parsing feed %s", label)

        db = get_db()
        db.execute("DELETE FROM trip_updates")
        for u in all_updates:
            db.execute(
                """
                INSERT INTO trip_updates
                    (trip_id, route_id, stop_id, arrival_time,
                     departure_time, delay_seconds, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    u["trip_id"],
                    u["route_id"],
                    u["stop_id"],
                    u["arrival_time"],
                    u["departure_time"],
                    u["delay_seconds"],
                    now,
                ),
            )
        db.commit()
        log.info("Stored %d trip updates total", len(all_updates))
        return len(all_updates)


def fetch_service_alerts(app) -> int:
    """
    Fetch the all-alerts GTFS-RT feed, parse it, and upsert into
    the service_alerts table (replacing previous data).

    Returns the number of alerts stored.
    """
    with app.app_context():
        from flask import current_app

        url = current_app.config["ALERTS_FEED_URL"]
        raw = fetch_feed(url)
        if raw is None:
            return 0

        try:
            feed = parse_feed(raw)
            alerts = extract_alerts(feed)
        except Exception:
            log.exception("Error parsing alerts feed")
            return 0

        now = datetime.now(timezone.utc).isoformat()
        db = get_db()
        db.execute("DELETE FROM service_alerts")
        for a in alerts:
            db.execute(
                """
                INSERT OR REPLACE INTO service_alerts
                    (alert_id, header_text, description_text, severity_level,
                     effect, affected_routes, affected_stops,
                     active_period_start, active_period_end, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    a["alert_id"],
                    a["header_text"],
                    a["description_text"],
                    a["severity_level"],
                    a["effect"],
                    a["affected_routes"],
                    a["affected_stops"],
                    a["active_period_start"],
                    a["active_period_end"],
                    now,
                ),
            )
        db.commit()
        log.info("Stored %d service alerts", len(alerts))
        return len(alerts)
