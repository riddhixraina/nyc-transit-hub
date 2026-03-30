"""
Service layer for fetching and storing MTA elevator/escalator equipment
and outage data.

The MTA publishes two JSON feeds:
  - Equipment list (all elevators and escalators with station info)
  - Current outages (units currently out of service)
"""

import logging
from datetime import datetime, timezone

import requests

from app.database import get_db

log = logging.getLogger(__name__)

FEED_TIMEOUT = 30


def _fetch_json(url: str) -> list | dict | None:
    """GET a JSON endpoint; return parsed body or None on failure."""
    try:
        resp = requests.get(url, timeout=FEED_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        log.error("Failed to fetch %s: %s", url, exc)
        return None
    except ValueError:
        log.error("Non-JSON response from %s", url)
        return None


def fetch_equipment_list(app) -> int:
    """
    Fetch the elevator/escalator equipment inventory and upsert into
    the elevator_equipment table.

    Returns the number of records stored.
    """
    with app.app_context():
        from flask import current_app

        url = current_app.config["ELEVATOR_EQUIPMENT_URL"]
        data = _fetch_json(url)
        if data is None:
            return 0

        equipment_list = data if isinstance(data, list) else data.get("results", [])

        db = get_db()
        db.execute("DELETE FROM elevator_equipment")
        count = 0
        for item in equipment_list:
            eid = str(
                item.get("equipmentno")
                or item.get("equipment_id")
                or item.get("equipmentNo")
                or ""
            )
            if not eid:
                continue
            db.execute(
                """
                INSERT OR REPLACE INTO elevator_equipment
                    (equipment_id, equipment_type, station_name, stop_id,
                     short_description, ada_compliant, lines_served,
                     travel_alternatives)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    eid,
                    item.get("equipmenttype", item.get("equipment_type", "")),
                    item.get("station", item.get("station_name", "")),
                    item.get("stop_id", ""),
                    item.get("shortdescription", item.get("short_description", "")),
                    1 if item.get("ADA", item.get("ada_compliant")) in ("Y", "1", 1, True) else 0,
                    item.get("linesservedbyelevator", item.get("lines_served", "")),
                    item.get("alternativeroute", item.get("travel_alternatives", "")),
                ),
            )
            count += 1
        db.commit()
        log.info("Stored %d elevator/escalator equipment records", count)
        return count


def fetch_current_outages(app) -> int:
    """
    Fetch current elevator/escalator outages and replace the
    elevator_outages table contents.

    Returns the number of outage records stored.
    """
    with app.app_context():
        from flask import current_app

        url = current_app.config["ELEVATOR_OUTAGES_URL"]
        data = _fetch_json(url)
        if data is None:
            return 0

        outage_list = data if isinstance(data, list) else data.get("results", [])

        now = datetime.now(timezone.utc).isoformat()
        db = get_db()
        db.execute("DELETE FROM elevator_outages")
        count = 0
        for item in outage_list:
            eid = str(
                item.get("equipmentno")
                or item.get("equipment_id")
                or item.get("equipmentNo")
                or ""
            )
            if not eid:
                continue
            db.execute(
                """
                INSERT INTO elevator_outages
                    (equipment_id, reason, out_of_service_date,
                     estimated_return, is_upcoming, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    eid,
                    item.get("reason", ""),
                    item.get("outofservicedate", item.get("out_of_service_date", "")),
                    item.get("estimatedreturntoservice", item.get("estimated_return", "")),
                    1 if item.get("isupcomingoutage", item.get("is_upcoming")) in ("Y", "1", 1, True) else 0,
                    now,
                ),
            )
            count += 1
        db.commit()
        log.info("Stored %d elevator/escalator outage records", count)
        return count
