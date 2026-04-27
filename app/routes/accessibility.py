"""
REST API routes for elevator/escalator equipment and outage data.
"""

from flask import Blueprint, jsonify, request

from app.database import query_db

accessibility_bp = Blueprint(
    "accessibility", __name__, url_prefix="/api/accessibility"
)


@accessibility_bp.route("/equipment")
def list_equipment():
    """
    Return all elevator/escalator equipment records.

    Query params:
        station -- filter by station name (case-insensitive substring)
    """
    station_filter = request.args.get("station", "").strip()

    if station_filter:
        rows = query_db(
            """
            SELECT * FROM elevator_equipment
            WHERE station_name LIKE ?
            ORDER BY station_name
            """,
            (f"%{station_filter}%",),
        )
    else:
        rows = query_db(
            "SELECT * FROM elevator_equipment ORDER BY station_name"
        )

    return jsonify(rows)


@accessibility_bp.route("/outages")
def list_outages():
    """Return all current elevator/escalator outages, joined with equipment info."""
    rows = query_db(
        """
        SELECT o.*, e.equipment_type, e.station_name,
               e.short_description, e.lines_served
        FROM elevator_outages o
        LEFT JOIN elevator_equipment e
            ON o.equipment_id = e.equipment_id
        ORDER BY o.out_of_service_date DESC
        """
    )
    return jsonify(rows)


@accessibility_bp.route("/station/<stop_id>")
def station_accessibility(stop_id):
    """
    Return a combined accessibility view for a station:
      - ADA status from the stations table
      - All elevator/escalator equipment at the station
      - Any current outages for that equipment
    """
    station = query_db(
        "SELECT stop_id, stop_name, ada_accessible, ada_notes FROM stations WHERE stop_id = ?",
        (stop_id,),
        one=True,
    )
    if station is None:
        return jsonify({"error": True, "message": "Station not found"}), 404

    equipment = query_db(
        "SELECT * FROM elevator_equipment WHERE stop_id = ?",
        (stop_id,),
    )

    equipment_ids = [e["equipment_id"] for e in equipment]
    outages = []
    if equipment_ids:
        placeholders = ",".join("?" for _ in equipment_ids)
        outages = query_db(
            f"""
            SELECT * FROM elevator_outages
            WHERE equipment_id IN ({placeholders})
            ORDER BY out_of_service_date DESC
            """,
            equipment_ids,
        )

    return jsonify(
        {
            "station": station,
            "equipment": equipment,
            "outages": outages,
        }
    )
