"""
SQLite table definitions for the NYC Transit Hub database.

Each constant holds a CREATE TABLE IF NOT EXISTS statement.
ALL_TABLES_SQL is the ordered list consumed by database.init_db().
"""

CREATE_STATIONS = """
CREATE TABLE IF NOT EXISTS stations (
    stop_id        TEXT PRIMARY KEY,
    stop_name      TEXT NOT NULL,
    stop_lat       REAL,
    stop_lon       REAL,
    parent_station TEXT,
    ada_accessible INTEGER DEFAULT 0,
    ada_notes      TEXT,
    borough        TEXT,
    daytime_routes TEXT
);
"""

CREATE_ROUTES = """
CREATE TABLE IF NOT EXISTS routes (
    route_id         TEXT PRIMARY KEY,
    route_short_name TEXT,
    route_long_name  TEXT,
    route_color      TEXT,
    route_text_color TEXT
);
"""

CREATE_TRIP_UPDATES = """
CREATE TABLE IF NOT EXISTS trip_updates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id         TEXT NOT NULL,
    route_id        TEXT,
    stop_id         TEXT,
    arrival_time    TEXT,
    departure_time  TEXT,
    delay_seconds   INTEGER DEFAULT 0,
    fetched_at      TEXT NOT NULL
);
"""

CREATE_TRIP_UPDATES_IDX = """
CREATE INDEX IF NOT EXISTS idx_trip_updates_stop
    ON trip_updates(stop_id, arrival_time);
"""

CREATE_SERVICE_ALERTS = """
CREATE TABLE IF NOT EXISTS service_alerts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id            TEXT UNIQUE NOT NULL,
    header_text         TEXT,
    description_text    TEXT,
    severity_level      TEXT,
    effect              TEXT,
    affected_routes     TEXT,
    affected_stops      TEXT,
    active_period_start TEXT,
    active_period_end   TEXT,
    fetched_at          TEXT NOT NULL
);
"""

CREATE_ELEVATOR_EQUIPMENT = """
CREATE TABLE IF NOT EXISTS elevator_equipment (
    equipment_id       TEXT PRIMARY KEY,
    equipment_type     TEXT,
    station_name       TEXT,
    stop_id            TEXT,
    short_description  TEXT,
    ada_compliant      INTEGER DEFAULT 0,
    lines_served       TEXT,
    travel_alternatives TEXT
);
"""

CREATE_ELEVATOR_OUTAGES = """
CREATE TABLE IF NOT EXISTS elevator_outages (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id        TEXT NOT NULL,
    reason              TEXT,
    out_of_service_date TEXT,
    estimated_return    TEXT,
    is_upcoming         INTEGER DEFAULT 0,
    fetched_at          TEXT NOT NULL
);
"""

ALL_TABLES_SQL = [
    CREATE_STATIONS,
    CREATE_ROUTES,
    CREATE_TRIP_UPDATES,
    CREATE_TRIP_UPDATES_IDX,
    CREATE_SERVICE_ALERTS,
    CREATE_ELEVATOR_EQUIPMENT,
    CREATE_ELEVATOR_OUTAGES,
]
