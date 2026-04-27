"""
Operational metadata routes used by the frontend shell.
"""

from flask import Blueprint, current_app, jsonify

from app.database import query_db

meta_bp = Blueprint("meta", __name__, url_prefix="/api")


@meta_bp.route("/health")
def health():
    """Return a compact service-health payload for the frontend."""
    environment = "testing" if current_app.config.get("TESTING") else (
        "development" if current_app.config.get("DEBUG") else "production"
    )

    counts = {
        "stations": query_db("SELECT COUNT(*) AS count FROM stations", one=True)["count"],
        "routes": query_db("SELECT COUNT(*) AS count FROM routes", one=True)["count"],
        "trip_updates": query_db("SELECT COUNT(*) AS count FROM trip_updates", one=True)["count"],
        "service_alerts": query_db("SELECT COUNT(*) AS count FROM service_alerts", one=True)["count"],
        "elevator_equipment": query_db("SELECT COUNT(*) AS count FROM elevator_equipment", one=True)["count"],
        "elevator_outages": query_db("SELECT COUNT(*) AS count FROM elevator_outages", one=True)["count"],
    }

    last_sync = {
        "trip_updates": query_db("SELECT MAX(fetched_at) AS value FROM trip_updates", one=True)["value"],
        "service_alerts": query_db("SELECT MAX(fetched_at) AS value FROM service_alerts", one=True)["value"],
        "elevator_equipment": None,
        "elevator_outages": query_db("SELECT MAX(fetched_at) AS value FROM elevator_outages", one=True)["value"],
    }

    return jsonify(
        {
            "status": "ok",
            "service": "nyc-transit-hub",
            "environment": environment,
            "scheduler_enabled": not current_app.config.get("TESTING", False),
            "last_sync": last_sync,
            "record_counts": counts,
        }
    )
