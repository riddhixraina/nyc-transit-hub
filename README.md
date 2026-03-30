# NYC Transit Hub

Real-time updates, schedules, and transit information for New York City's public transportation system, powered by the MTA GTFS-RT feeds.

## Setup

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with static GTFS station and route data
python seed_static_data.py

# Start the development server
python run.py
```

The server starts at `http://localhost:5000`. On startup it begins polling MTA feeds automatically.

## API Endpoints

### Subway

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subway/stops` | List all stations (`?route=` optional) |
| GET | `/api/subway/stops/<stop_id>` | Station detail |
| GET | `/api/subway/arrivals/<stop_id>` | Next arrivals at a station |
| GET | `/api/subway/routes` | All subway routes |
| GET | `/api/subway/routes/<route_id>` | Route detail with stops |

### Service Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | All active alerts (`?route=`, `?severity=` optional) |
| GET | `/api/alerts/<alert_id>` | Single alert |
| GET | `/api/alerts/route/<route_id>` | Alerts for a route |

### Accessibility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accessibility/equipment` | All elevators/escalators (`?station=` optional) |
| GET | `/api/accessibility/outages` | Current outages |
| GET | `/api/accessibility/station/<stop_id>` | Station accessibility detail |

### Service Status Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Status of every subway line |
| GET | `/api/status/summary` | Counts of good-service / delayed / alerted lines |

## Technology Stack

- **Backend:** Python 3 + Flask
- **Database:** SQLite
- **Data Source:** MTA GTFS-RT (protobuf) and GTFS static feeds
- **Testing:** pytest

## Data Sources

All transit data is fetched from the MTA's public GTFS and GTFS-RT feeds at `api-endpoint.mta.info`. No API key is required for subway and alert feeds.
