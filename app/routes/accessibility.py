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


def _compute_guide(station: dict, equipment: list, outages: list) -> dict:
    """Build an accessibility guide with computed access method and travel time."""
    types = {(e.get("equipment_type") or "").upper() for e in equipment}
    has_elevator = any("ELEV" in t for t in types)
    has_escalator = any("ESCAL" in t for t in types)

    outaged_ids = {o["equipment_id"] for o in outages if not o.get("is_upcoming")}
    elevator_out = all(
        e["equipment_id"] in outaged_ids
        for e in equipment
        if "ELEV" in (e.get("equipment_type") or "").upper()
    ) and has_elevator

    if has_elevator and not elevator_out:
        access_method = "Elevator"
        ambulatory_min = 3
        wheelchair_min = 3
    elif has_escalator:
        access_method = "Escalator only"
        ambulatory_min = 4
        wheelchair_min = 7
    else:
        access_method = "Stairs only"
        ambulatory_min = 3
        wheelchair_min = 10

    if elevator_out:
        access_method = "Elevator out of service"
        wheelchair_min = 10

    notes = []
    if has_elevator and not elevator_out:
        notes.append("Elevator available — wheelchair accessible")
    elif elevator_out:
        notes.append("All elevators currently out of service")
    if has_escalator:
        notes.append("Escalator available as stairs alternative")
    if not has_elevator and not has_escalator:
        notes.append("Station served by stairs only — no elevator or escalator")
    if station.get("ada_accessible"):
        notes.append("Station is ADA-designated accessible")

    alternatives = []
    for e in equipment:
        if e["equipment_id"] in outaged_ids and e.get("travel_alternatives"):
            alternatives.append(e["travel_alternatives"])

    return {
        "station": station,
        "equipment": equipment,
        "outages": outages,
        "has_elevator": has_elevator,
        "has_escalator": has_escalator,
        "access_method": access_method,
        "estimated_travel": {
            "ambulatory_minutes": ambulatory_min,
            "wheelchair_minutes": wheelchair_min,
        },
        "mobility_notes": notes,
        "alternatives_during_outage": alternatives,
    }


@accessibility_bp.route("/station/<stop_id>/guide")
def station_guide(stop_id):
    """Accessibility guide with computed access method, travel times, and tips."""
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

    return jsonify(_compute_guide(dict(station), equipment, outages))


@accessibility_bp.route("/stats")
def accessibility_stats():
    """System-wide accessibility summary for the stats panel."""
    ada_row = query_db(
        """
        SELECT
            SUM(CASE WHEN ada_accessible = 1 THEN 1 ELSE 0 END) AS accessible,
            SUM(CASE WHEN ada_accessible = 0 THEN 1 ELSE 0 END) AS not_accessible
        FROM stations
        WHERE parent_station = '' OR parent_station IS NULL
        """,
        one=True,
    )

    equip_row = query_db(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN UPPER(equipment_type) LIKE '%ELEV%' THEN 1 ELSE 0 END) AS elevators,
            SUM(CASE WHEN UPPER(equipment_type) LIKE '%ESCAL%' THEN 1 ELSE 0 END) AS escalators
        FROM elevator_equipment
        """,
        one=True,
    )

    outage_count = query_db(
        "SELECT COUNT(*) AS total FROM elevator_outages WHERE is_upcoming = 0",
        one=True,
    )

    return jsonify(
        {
            "ada_stations": {
                "accessible": ada_row["accessible"] or 0,
                "not_accessible": ada_row["not_accessible"] or 0,
            },
            "equipment": {
                "total": equip_row["total"] or 0,
                "elevators": equip_row["elevators"] or 0,
                "escalators": equip_row["escalators"] or 0,
            },
            "active_outages": outage_count["total"] or 0,
        }
    )
