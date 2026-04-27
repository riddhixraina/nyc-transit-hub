"""
Aggregated analytics endpoint for the frontend charts page.
"""

from flask import Blueprint, jsonify

from app.database import query_db

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

EFFECT_TO_STATUS = {
    "SIGNIFICANT_DELAYS": "Delays",
    "DELAY": "Delays",
    "DETOUR": "Service Change",
    "MODIFIED_SERVICE": "Service Change",
    "REDUCED_SERVICE": "Service Change",
    "ADDITIONAL_SERVICE": "Service Change",
    "STOP_MOVED": "Service Change",
    "NO_SERVICE": "Suspended",
    "OTHER_EFFECT": "Planned Work",
    "UNKNOWN_EFFECT": "Planned Work",
}


def _status_breakdown() -> dict[str, int]:
    routes = query_db("SELECT route_id FROM routes")
    alerts = query_db("SELECT affected_routes, effect FROM service_alerts")

    alert_map: dict[str, list[str]] = {}
    for a in alerts:
        for rid in (a.get("affected_routes") or "").split(","):
            rid = rid.strip()
            if rid:
                alert_map.setdefault(rid, []).append(a.get("effect", "UNKNOWN_EFFECT"))

    breakdown: dict[str, int] = {}
    priority = {"Good Service": 0, "Planned Work": 1, "Service Change": 2, "Delays": 3, "Suspended": 4}
    for route in routes:
        rid = route["route_id"]
        effects = alert_map.get(rid, [])
        if not effects:
            label = "Good Service"
        else:
            label = "Good Service"
            for eff in effects:
                mapped = EFFECT_TO_STATUS.get(eff, "Planned Work")
                if priority.get(mapped, 0) > priority.get(label, 0):
                    label = mapped
        breakdown[label] = breakdown.get(label, 0) + 1
    return breakdown


def _alerts_by_route() -> list[dict]:
    alerts = query_db("SELECT affected_routes FROM service_alerts")
    counts: dict[str, int] = {}
    for a in alerts:
        for rid in (a.get("affected_routes") or "").split(","):
            rid = rid.strip()
            if rid:
                counts[rid] = counts.get(rid, 0) + 1
    ranked = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]
    return [{"route_id": rid, "count": c} for rid, c in ranked]


def _ada_stats() -> dict[str, int]:
    row = query_db(
        """
        SELECT
            SUM(CASE WHEN ada_accessible = 1 THEN 1 ELSE 0 END) AS accessible,
            SUM(CASE WHEN ada_accessible = 0 THEN 1 ELSE 0 END) AS not_accessible
        FROM stations
        WHERE parent_station = '' OR parent_station IS NULL
        """,
        one=True,
    )
    return {
        "accessible": row["accessible"] or 0,
        "not_accessible": row["not_accessible"] or 0,
    }


@analytics_bp.route("")
def analytics():
    return jsonify(
        {
            "status_breakdown": _status_breakdown(),
            "alerts_by_route": _alerts_by_route(),
            "ada_stats": _ada_stats(),
        }
    )
