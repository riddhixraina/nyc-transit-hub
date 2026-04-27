# NYC Transit Hub Feature Documentation

## 1. Project Summary

NYC Transit Hub is a backend-first transit data service for New York City subway information. The current codebase exposes a REST API that combines:

- Static GTFS reference data for stations and routes
- Real-time subway trip updates from MTA GTFS-Realtime feeds
- Real-time service alerts from the MTA alert feed
- Elevator and escalator accessibility data from New York State open data feeds
- A derived per-line service status dashboard built on top of route metadata and alerts

The repository does not currently contain a frontend application. The shipped product in this repo is a Flask API plus a local SQLite cache that is refreshed in the background.

## 2. High-Level Architecture

The application follows a simple layered design:

- App bootstrap: Flask app factory in `app/__init__.py`
- HTTP API layer: Flask blueprints in `app/routes/`
- Service layer: feed polling and persistence logic in `app/services/`
- Parsing/utilities: GTFS-Realtime helpers in `app/utils/`
- Persistence layer: SQLite access and schema in `app/database.py` and `app/models.py`
- Data initialization: static GTFS seeding script in `seed_static_data.py`
- Validation: pytest integration and parser tests in `tests/`

### Runtime flow

1. `run.py` creates the Flask app with the `development` config.
2. The app initializes the SQLite schema on startup.
3. The app registers four blueprints:
   - `/api/subway`
   - `/api/alerts`
   - `/api/accessibility`
   - `/api/status`
4. In non-test environments, APScheduler starts background polling jobs.
5. The scheduler immediately performs an initial fetch of subway updates, alerts, equipment, and outages.
6. API endpoints read from the local SQLite cache instead of querying upstream feeds directly per request.

### Why this architecture matters

- API reads are fast because they hit local SQLite instead of remote APIs.
- External feed failures degrade freshness, but not necessarily API availability.
- The codebase stays simple: no message queue, no Redis, no ORM, and no separate worker process.

## 3. Technology Stack

### Core stack

- Language: Python 3
- Web framework: Flask 3.1
- CORS: `flask-cors`
- Database: SQLite
- Scheduler: APScheduler `BackgroundScheduler`
- HTTP client: `requests`
- Realtime transit parsing: `gtfs-realtime-bindings` + `protobuf`
- Testing: `pytest` + `pytest-flask`

### Data sources

- MTA GTFS-Realtime subway feeds
- MTA GTFS-Realtime all-alerts feed
- New York State open data JSON feeds for elevators/escalators
- MTA static GTFS ZIP for `stops.txt` and `routes.txt`
- NY Open Data station accessibility dataset

### Important implementation details

- CORS is enabled globally for the Flask app.
- SQLite uses WAL mode and foreign keys are enabled at connection time.
- There is no ORM; all queries are handwritten SQL.
- The app factory skips the scheduler entirely in testing mode.
- `run.py` starts the server on port `5001`, even though the README still says `5000`.

## 4. Feature Inventory

| Feature | Purpose | Primary Endpoints | Backing Tables |
| --- | --- | --- | --- |
| Static station and route catalog | Provide subway metadata used by all other features | `/api/subway/stops`, `/api/subway/routes` | `stations`, `routes` |
| Real-time arrivals | Show upcoming train arrivals per stop | `/api/subway/arrivals/<stop_id>` | `trip_updates` |
| Service alerts | Expose active MTA alerts and filters | `/api/alerts`, `/api/alerts/<id>`, `/api/alerts/route/<route_id>` | `service_alerts` |
| Accessibility data | Surface elevator/escalator inventory and outages | `/api/accessibility/equipment`, `/api/accessibility/outages`, `/api/accessibility/station/<stop_id>` | `elevator_equipment`, `elevator_outages`, `stations` |
| Line status dashboard | Convert raw alerts into route-level status labels | `/api/status`, `/api/status/summary` | `routes`, `service_alerts` |
| Background data refresh | Keep the local cache fresh automatically | Internal scheduler jobs | all runtime tables |
| Static data seeding | Bootstrap route and station metadata | `seed_static_data.py` | `stations`, `routes` |

## 5. Detailed Feature Documentation

## 5.1 Static Station and Route Catalog

### Purpose

This is the foundation of the application. Every user-facing subway feature depends on route and station metadata existing locally.

### What it does

- Stores station-level metadata such as stop name, coordinates, borough, parent station, ADA flag, and daytime routes.
- Stores route metadata such as route ID, short name, long name, color, and text color.
- Enables route and stop lookup endpoints.
- Supports joins for arrivals and accessibility responses.

### How it is populated

The `seed_static_data.py` script:

1. Downloads the MTA static GTFS ZIP.
2. Extracts `stops.txt` and `routes.txt`.
3. Fetches station accessibility metadata from NY Open Data.
4. Creates the schema if needed.
5. Inserts or replaces route rows.
6. Inserts or replaces station rows, merging GTFS stop records with ADA-related fields from the station accessibility dataset.

### User-facing functionality

- `GET /api/subway/stops`
  Returns all stations ordered by `stop_name`.
- `GET /api/subway/stops?route=A`
  Filters stations by `daytime_routes`.
- `GET /api/subway/stops/<stop_id>`
  Returns a single station or a 404 error.
- `GET /api/subway/routes`
  Returns all routes ordered by `route_id`.
- `GET /api/subway/routes/<route_id>`
  Returns the route plus a station list for stations whose `daytime_routes` contains that route.

### Tech and implementation details

- Route and stop listing are backed by plain SQL queries in `app/routes/subway.py`.
- Filtering is done with `LIKE` against denormalized text fields.
- No pagination is implemented.
- No search endpoint exists beyond the route/station filters already present.

### Current limitations

- `daytime_routes` is stored as a text field, not a normalized join table.
- Route filtering uses substring matching, which is simple but less precise than a normalized model.
- Static data refresh is manual; it only changes when `seed_static_data.py` is run again.

## 5.2 Real-Time Subway Arrivals

### Purpose

This feature provides near-real-time upcoming arrival and departure data for subway stops.

### What it does

- Polls multiple MTA GTFS-Realtime subway feeds.
- Parses trip updates from protobuf.
- Flattens stop-time updates into database rows.
- Replaces the local `trip_updates` table with a fresh snapshot on each poll.
- Serves arrivals from the local cache through the API.

### Feed coverage

Configured feeds include:

- `123456S`
- `ACE`
- `BDFM`
- `G`
- `JZ`
- `L`
- `NQRW`
- `7`
- `SIR`

### User-facing functionality

- `GET /api/subway/arrivals/<stop_id>`
  Returns arrivals ordered by `arrival_time ASC`.
- `GET /api/subway/arrivals/<stop_id>?limit=1`
  Restricts the number of results returned.

### Request semantics

The endpoint supports two stop matching modes:

- Exact match on `tu.stop_id = <stop_id>`
- Prefix match on `tu.stop_id LIKE <stop_id>%`

This is intended to allow parent-station requests to include child directional stop IDs.

### Response content

Each arrival row includes:

- `trip_id`
- `route_id`
- `stop_id`
- `arrival_time`
- `departure_time`
- `delay_seconds`
- `stop_name` via a left join to `stations`

### Parsing and storage

`app/utils/gtfs_helpers.py` is responsible for:

- Decoding raw protobuf bytes into `FeedMessage`
- Converting POSIX timestamps to ISO-8601 UTC strings
- Extracting flattened trip update records

`app/services/mta_feed.py` is responsible for:

- Fetching all configured subway feeds
- Validating that the response does not look like HTML/XML
- Parsing trip updates
- Deleting all previous `trip_updates`
- Inserting the fresh snapshot with a common `fetched_at` timestamp

### Tech and operational behavior

- Poll interval: 30 seconds
- Timeout per feed request: 30 seconds
- Freshness depends on the scheduler successfully running
- The API never falls back to live upstream calls during a request

### Current limitations

- Historical arrivals are not retained; each poll replaces the table contents.
- There is no deduplication beyond table replacement.
- There is no endpoint for route-specific real-time train tracking, only stop-based arrivals.
- Direction, destination text, and trip headsign are not exposed.

## 5.3 Service Alerts

### Purpose

This feature exposes active MTA service alerts and allows filtering by route and severity.

### What it does

- Polls the GTFS-Realtime all-alerts feed.
- Parses alert entities.
- Extracts route and stop impacts from `informed_entity`.
- Stores alerts in a local SQLite table.
- Makes them queryable through three API surfaces.

### User-facing functionality

- `GET /api/alerts`
  Returns all alerts ordered by `active_period_start DESC`.
- `GET /api/alerts?route=A`
  Filters alerts by affected route.
- `GET /api/alerts?severity=WARNING`
  Filters alerts by exact severity level.
- `GET /api/alerts/<alert_id>`
  Returns one alert or 404.
- `GET /api/alerts/route/<route_id>`
  Returns alerts associated with a single route.

### Parsed alert fields

Each stored alert includes:

- `alert_id`
- `header_text`
- `description_text`
- `severity_level`
- `effect`
- `affected_routes`
- `affected_stops`
- `active_period_start`
- `active_period_end`
- `fetched_at`

### Parsing behavior

The alert parser:

- Takes the first header translation if present
- Takes the first description translation if present
- Collects affected routes into a comma-separated string
- Collects affected stops into a comma-separated string
- Converts the first active period into ISO-8601 UTC strings
- Maps protobuf enum values to enum names for severity and effect

### Tech and operational behavior

- Poll interval: 60 seconds
- Upsert strategy: `INSERT OR REPLACE`
- Refresh strategy: delete all old rows, then insert the current feed snapshot

### Current limitations

- Route filtering is substring-based on a comma-separated text field.
- Only the first translation and first active period are surfaced.
- There is no explicit concept of archived or historical alerts.
- There is no endpoint for stop-specific alert lookups even though `affected_stops` is stored.

## 5.4 Accessibility: Elevator and Escalator Data

### Purpose

This feature provides station accessibility context beyond the static ADA flag by incorporating equipment inventory and outage information.

### What it does

- Fetches all elevator and escalator equipment records from a JSON feed.
- Fetches current outage records from a second JSON feed.
- Stores both datasets locally.
- Allows users to view all equipment, all outages, or a station-specific accessibility summary.

### User-facing functionality

- `GET /api/accessibility/equipment`
  Returns all equipment records ordered by station name.
- `GET /api/accessibility/equipment?station=Times`
  Filters equipment by station name substring.
- `GET /api/accessibility/outages`
  Returns outage rows joined to equipment metadata.
- `GET /api/accessibility/station/<stop_id>`
  Returns:
  - station ADA metadata from `stations`
  - all equipment rows linked to that stop
  - all outage rows for that equipment

### Stored equipment fields

- `equipment_id`
- `equipment_type`
- `station_name`
- `stop_id`
- `short_description`
- `ada_compliant`
- `lines_served`
- `travel_alternatives`

### Stored outage fields

- `equipment_id`
- `reason`
- `out_of_service_date`
- `estimated_return`
- `is_upcoming`
- `fetched_at`

### Data normalization behavior

The feed ingester handles multiple possible upstream key names, for example:

- `equipmentno`, `equipment_id`, or `equipmentNo`
- `equipmenttype` or `equipment_type`
- `station` or `station_name`

It also normalizes ADA and upcoming-outage flags into integer booleans.

### Tech and operational behavior

- Poll interval: 300 seconds for both equipment and outages
- Both tables are fully refreshed on each sync
- Station detail uses application-side logic to collect equipment IDs and then query outages

### Current repo-state note

In the checked-in `data/transit.db` snapshot, both `elevator_equipment` and `elevator_outages` are currently empty. That means the feature exists in code, but the bundled local database has not been populated with accessibility runtime data.

### Current limitations

- Accessibility station matching depends on `stop_id` being present and aligned across datasets.
- There is no fuzzy mapping between station names and stop IDs.
- There is no distinction between elevator and escalator specific API views beyond `equipment_type`.
- No historical outage tracking is preserved.

## 5.5 Service Status Dashboard

### Purpose

This feature turns raw service alerts into a simpler route-level status view suitable for dashboards or line overview screens.

### What it does

- Reads all known routes from the `routes` table.
- Reads all current service alerts from the `service_alerts` table.
- Associates alerts to routes via `affected_routes`.
- Determines the most severe status for each route.
- Returns per-line status objects and a compact summary.

### User-facing functionality

- `GET /api/status`
  Returns one status object per route.
- `GET /api/status/summary`
  Returns total line count and a breakdown by status label.

### Status mapping

Alert effects are translated into user-friendly line statuses:

- `SIGNIFICANT_DELAYS` -> `Delays`
- `DELAY` -> `Delays`
- `DETOUR` -> `Service Change`
- `MODIFIED_SERVICE` -> `Service Change`
- `REDUCED_SERVICE` -> `Service Change`
- `ADDITIONAL_SERVICE` -> `Service Change`
- `STOP_MOVED` -> `Service Change`
- `NO_SERVICE` -> `Suspended`
- `OTHER_EFFECT` -> `Planned Work`
- `UNKNOWN_EFFECT` -> `Planned Work`

If a line has no mapped alerts, it is labeled `Good Service`.

### Severity resolution logic

When multiple alerts affect the same line, the code selects the worst status using this priority order:

1. `Good Service`
2. `Planned Work`
3. `Service Change`
4. `Delays`
5. `Suspended`

### Response content

Each line status contains:

- `route_id`
- `route_short_name`
- `route_color`
- `status`
- `alert_count`
- `alerts` with `alert_id`, `header_text`, and `effect`

### Current limitations

- Status is derived only from alerts, not from trip-update delays.
- The alert-to-route link is again based on comma-separated route text.
- There is no distinction between planned and unplanned delays beyond effect mapping.
- There is no route grouping by trunk or borough.

## 5.6 Background Polling and Local Cache Refresh

### Purpose

This is the operational feature that keeps the API current without making each request dependent on upstream latency.

### What it does

`app/services/scheduler.py` starts one `BackgroundScheduler` instance and registers four recurring jobs:

- `poll_subway`
- `poll_alerts`
- `poll_equipment`
- `poll_outages`

It also runs each fetch job once during startup.

### Operational characteristics

- Scheduler is daemonized and runs in-process with Flask.
- There is a guard to prevent double-start.
- Failures in one initial fetch do not stop the others from running.
- The scheduler is disabled when `TESTING=True`.

### Why this matters

- API latency is decoupled from remote feed latency.
- Data freshness is bounded by polling cadence.
- The design is simple for development and local demos.

### Current limitations

- This is not a distributed scheduler; it is tied to one app process.
- There is no job persistence or retry queue.
- There is no health endpoint exposing last successful sync time.

## 5.7 Test Coverage and Quality Signals

### What is currently tested

The repository includes both API integration tests and parser-unit tests.

#### Route and status tests

`tests/test_routes.py` validates:

- station list endpoint
- route filter on stations
- station detail success and 404
- arrivals ordering
- arrivals `limit` parameter
- route list endpoint
- route detail success and 404
- service status derivation
- status summary response shape

#### Alert tests

`tests/test_alerts.py` validates:

- alert list endpoint
- route filtering
- severity filtering
- alert detail success and 404
- route-specific alert endpoint

#### GTFS parser tests

`tests/test_mta_feed.py` validates:

- timestamp conversion
- protobuf parsing
- trip update extraction
- alert extraction
- empty-feed behavior

### Test setup approach

`tests/conftest.py` creates a temporary SQLite database for each app fixture, initializes the schema, and seeds minimal route, station, trip update, and alert data. This gives stable integration tests without depending on live MTA feeds.

### Coverage gaps

- No tests currently cover accessibility endpoints.
- No tests cover scheduler behavior.
- No tests cover actual HTTP fetch error handling.
- No tests verify seed script behavior.
- No tests validate concurrency or long-running refresh cycles.

## 6. Database Design

The local data model is intentionally small and optimized for simple API reads.

### `stations`

Stores subway stop metadata.

Key fields:

- `stop_id` primary key
- `stop_name`
- `stop_lat`, `stop_lon`
- `parent_station`
- `ada_accessible`
- `ada_notes`
- `borough`
- `daytime_routes`

### `routes`

Stores line metadata.

Key fields:

- `route_id` primary key
- `route_short_name`
- `route_long_name`
- `route_color`
- `route_text_color`

### `trip_updates`

Stores flattened stop-time updates from GTFS-Realtime trip update feeds.

Key fields:

- auto-increment `id`
- `trip_id`
- `route_id`
- `stop_id`
- `arrival_time`
- `departure_time`
- `delay_seconds`
- `fetched_at`

Indexes:

- `idx_trip_updates_stop` on `(stop_id, arrival_time)`

### `service_alerts`

Stores active service alerts.

Key fields:

- auto-increment `id`
- unique `alert_id`
- `header_text`
- `description_text`
- `severity_level`
- `effect`
- `affected_routes`
- `affected_stops`
- `active_period_start`
- `active_period_end`
- `fetched_at`

### `elevator_equipment`

Stores station equipment inventory.

Key fields:

- `equipment_id` primary key
- `equipment_type`
- `station_name`
- `stop_id`
- `short_description`
- `ada_compliant`
- `lines_served`
- `travel_alternatives`

### `elevator_outages`

Stores current outage records.

Key fields:

- auto-increment `id`
- `equipment_id`
- `reason`
- `out_of_service_date`
- `estimated_return`
- `is_upcoming`
- `fetched_at`

## 7. Current Operational Snapshot From the Included Database

The checked-in `data/transit.db` currently contains:

- `stations`: 1488
- `routes`: 29
- `trip_updates`: 5128
- `service_alerts`: 383
- `elevator_equipment`: 0
- `elevator_outages`: 0

This suggests the repository snapshot includes seeded static data and some cached realtime data, but not populated accessibility runtime data.

## 8. Notable Strengths

- Clear separation between routing, ingestion, parsing, and storage
- Fast local read model backed by SQLite
- Simple startup model with automatic scheduler bootstrapping
- Useful core subway API already in place
- Real tests exist for the most important subway and alert flows
- GTFS-Realtime parsing is isolated into a reusable utility module

## 9. Current Limitations and Product Gaps

- API-only project; no frontend is included in this repository
- No authentication, rate limiting, pagination, or API versioning
- No historical analytics or trend storage
- No bus, commuter rail, or regional coverage beyond the configured feeds
- Accessibility feature is implemented but not represented in the bundled database snapshot
- Route and stop relationships rely on text matching rather than normalized join tables
- There is no observability layer for last sync success, feed lag, or scheduler health
- Error responses are minimal and there is no structured error envelope

## 10. Summary

The project already implements a meaningful first version of a transit backend. The strongest completed features are:

- subway route and station metadata
- real-time station arrivals
- service alert retrieval
- derived line status summaries

The accessibility feature is also implemented in code, but currently appears dependent on runtime feed ingestion that has not been reflected in the committed database snapshot. Overall, the codebase is a practical Flask service organized around a local-cache pattern, with a small but solid testing foundation and a clear path for expansion.
