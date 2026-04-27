#!/usr/bin/env python3
"""
Seed the SQLite database with static GTFS station and route data.

1. Downloads the MTA GTFS static ZIP (stops.txt, routes.txt).
2. Fetches station accessibility info from NY Open Data.
3. Inserts/updates the stations and routes tables.
"""

import csv
import io
import logging
import os
import sqlite3
import zipfile

import requests

from config import Config

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)


def download_gtfs_zip(dest_dir: str) -> None:
    """Download and extract stops.txt and routes.txt from the MTA GTFS ZIP."""
    os.makedirs(dest_dir, exist_ok=True)
    log.info("Downloading GTFS static ZIP from %s ...", Config.STATIC_GTFS_ZIP_URL)
    resp = requests.get(Config.STATIC_GTFS_ZIP_URL, timeout=120)
    resp.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        for name in ("stops.txt", "routes.txt"):
            if name in zf.namelist():
                zf.extract(name, dest_dir)
                log.info("  Extracted %s", name)
            else:
                log.warning("  %s not found in ZIP", name)


def fetch_station_accessibility() -> dict:
    """Fetch ADA accessibility data keyed by GTFS Stop ID."""
    log.info("Fetching station accessibility from NY Open Data ...")
    resp = requests.get(
        Config.STATION_INFO_URL,
        params={"$limit": 5000},
        timeout=60,
    )
    resp.raise_for_status()
    records = resp.json()
    lookup = {}
    for rec in records:
        sid = rec.get("gtfs_stop_id") or rec.get("stop_id")
        if sid:
            lookup[sid] = {
                "ada": int(rec.get("ada", 0)),
                "ada_notes": rec.get("ada_direction_notes", ""),
                "borough": rec.get("borough", ""),
                "daytime_routes": rec.get("daytime_routes", ""),
            }
    log.info("  Loaded accessibility for %d stations", len(lookup))
    return lookup


def seed_routes(db: sqlite3.Connection, static_dir: str) -> int:
    """Parse routes.txt and insert into the routes table."""
    path = os.path.join(static_dir, "routes.txt")
    if not os.path.exists(path):
        log.warning("routes.txt not found — skipping route seed")
        return 0

    count = 0
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            db.execute(
                """
                INSERT OR REPLACE INTO routes
                    (route_id, route_short_name, route_long_name,
                     route_color, route_text_color)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    row.get("route_id", ""),
                    row.get("route_short_name", ""),
                    row.get("route_long_name", ""),
                    row.get("route_color", ""),
                    row.get("route_text_color", ""),
                ),
            )
            count += 1
    db.commit()
    return count


def seed_stations(
    db: sqlite3.Connection, static_dir: str, ada_lookup: dict
) -> int:
    """Parse stops.txt, merge ADA data, and insert into the stations table."""
    path = os.path.join(static_dir, "stops.txt")
    if not os.path.exists(path):
        log.warning("stops.txt not found — skipping station seed")
        return 0

    count = 0
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            stop_id = row.get("stop_id", "")
            ada_info = ada_lookup.get(stop_id, {})
            db.execute(
                """
                INSERT OR REPLACE INTO stations
                    (stop_id, stop_name, stop_lat, stop_lon,
                     parent_station, ada_accessible, ada_notes,
                     borough, daytime_routes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    stop_id,
                    row.get("stop_name", ""),
                    float(row.get("stop_lat", 0) or 0),
                    float(row.get("stop_lon", 0) or 0),
                    row.get("parent_station", ""),
                    ada_info.get("ada", 0),
                    ada_info.get("ada_notes", ""),
                    ada_info.get("borough", ""),
                    ada_info.get("daytime_routes", ""),
                ),
            )
            count += 1
    db.commit()
    return count


def main() -> None:
    static_dir = Config.STATIC_GTFS_DIR
    download_gtfs_zip(static_dir)
    ada_lookup = fetch_station_accessibility()

    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    db = sqlite3.connect(Config.DATABASE_PATH)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")

    from app.models import ALL_TABLES_SQL

    for sql in ALL_TABLES_SQL:
        db.execute(sql)
    db.commit()

    route_count = seed_routes(db, static_dir)
    log.info("Inserted %d routes", route_count)

    station_count = seed_stations(db, static_dir, ada_lookup)
    log.info("Inserted %d stations/stops", station_count)

    db.close()
    log.info("Seeding complete.")


if __name__ == "__main__":
    main()
