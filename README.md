# NYC Transit Hub

Real-time updates, schedules, and transit information for New York City's public transportation system, powered by the MTA GTFS-RT feeds.

The repository now contains:

- A Flask backend API in the project root
- A React + Vite frontend in `frontend/`

## Live demo

| | URL |
|---|-----|
| **Backend API** | <https://nyc-transit-hub-qj5i.onrender.com> |
| **Backend health** | <https://nyc-transit-hub-qj5i.onrender.com/api/health> |
| **Frontend app** | <https://nyc-transit-hub-1-5zwl.onrender.com> |

## Presentations (Google Slides)

- [NYC Transit Hub — real-time backend for NYC subway data](https://docs.google.com/presentation/d/1a5nk_BQl84HaPmNI_XKNWKxSKkgnM-B8p9Py137upOo/edit?usp=sharing)
- [NYC Transit Hub — final presentation](https://docs.google.com/presentation/d/1_IX3lq7S5B9HAVFCbAPYgUlXwpmK0-Fm/edit?usp=sharing&ouid=107001112435913949886&rtpof=true&sd=true)

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

The backend server starts at `http://localhost:5001`. On startup it begins polling MTA feeds automatically.

## Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default and expects:

```bash
VITE_API_BASE_URL=http://localhost:5001
```

Firebase authentication is optional. Leave the `VITE_FIREBASE_*` variables empty until you are ready to configure a Firebase project.

## API Endpoints

### Subway

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subway/stops` | List all stations (`?route=` optional) |
| GET | `/api/subway/stops/<stop_id>` | Station detail |
| GET | `/api/subway/search?q=times` | Quick search across stations and routes |
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

### Meta

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Record counts, last sync timestamps, and service metadata |

## Technology Stack

- **Backend:** Python 3 + Flask
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Database:** SQLite
- **Data Source:** MTA GTFS-RT (protobuf) and GTFS static feeds
- **Testing:** pytest, Vitest, React Testing Library

## Data Sources

All transit data is fetched from the MTA's public GTFS and GTFS-RT feeds at `api-endpoint.mta.info`. No API key is required for subway and alert feeds.
