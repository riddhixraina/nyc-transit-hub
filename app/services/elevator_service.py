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


def _fetch_inventory(url: str) -> list:
    """Fetch the asset inventory from data.ny.gov, paginating in 1000-row chunks."""
    out = []
    offset = 0
    while True:
        resp = _fetch_json(f"{url}?$limit=1000&$offset={offset}")
        if resp is None:
            break
        chunk = resp if isinstance(resp, list) else resp.get("results", [])
        if not chunk:
            break
        out.extend(chunk)
        if len(chunk) < 1000:
            break
        offset += 1000
    return out


def fetch_equipment_list(app) -> int:
    """
    Fetch the elevator/escalator asset inventory and upsert into the
    elevator_equipment table.
    """
    with app.app_context():
        from flask import current_app

        url = current_app.config["ELEVATOR_EQUIPMENT_URL"]
        equipment_list = _fetch_inventory(url)
        if not equipment_list:
            log.warning("No equipment records returned from %s", url)
            return 0

        db = get_db()
        db.execute("DELETE FROM elevator_equipment")
        count = 0
        for item in equipment_list:
            eid = str(item.get("equipment_code") or "").strip()
            if not eid:
                continue
            station_name = (
                item.get("station_complex_description")
                or item.get("station_description")
                or item.get("station_name")
                or ""
            )
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
                    item.get("elevator_or_escalator", item.get("asset_class", "")),
                    station_name,
                    "",
                    item.get("asset_class", ""),
                    1,
                    item.get("subway_line", ""),
                    "",
                ),
            )
            count += 1
        db.commit()
        log.info("Stored %d elevator/escalator equipment records", count)
        return count


def fetch_current_outages(app) -> int:
    """
    Derive current outages from the asset inventory's service_status field.

    The legacy real-time outages JSON feed (w3cp-5gnm) was retired. The
    inventory dataset includes service_status values like
    "Installed-Functioning-Out of Service" and
    "Installed-Non Functioning-Out of Service" which represent currently
    out-of-service equipment. We treat any status containing "Out of Service"
    as an outage and store one row per affected equipment_code.
    """
    with app.app_context():
        from flask import current_app

        url = current_app.config["ELEVATOR_EQUIPMENT_URL"]
        items = _fetch_inventory(url)
        if not items:
            return 0

        now = datetime.now(timezone.utc).isoformat()
        db = get_db()
        db.execute("DELETE FROM elevator_outages")
        count = 0
        for item in items:
            status = (item.get("service_status") or "").strip()
            if "Out of Service" not in status:
                continue
            eid = str(item.get("equipment_code") or "").strip()
            if not eid:
                continue
            reason = "Removed" if status.startswith("Removed") else status
            db.execute(
                """
                INSERT INTO elevator_outages
                    (equipment_id, reason, out_of_service_date,
                     estimated_return, is_upcoming, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (eid, reason, "", "", 0, now),
            )
            count += 1
        db.commit()
        log.info("Stored %d derived elevator/escalator outage records", count)
        return count
