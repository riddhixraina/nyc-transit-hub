"""
REST API routes for the service-status dashboard.

Derives a per-line status by cross-referencing active service_alerts
with the known subway routes.
"""

from flask import Blueprint, jsonify

from app.database import query_db

status_bp = Blueprint("status", __name__, url_prefix="/api/status")

EFFECT_TO_STATUS = {
    "SIGNIFICANT_DELAYS":  "Delays",
    "DELAY":               "Delays",
    "DETOUR":              "Service Change",
    "MODIFIED_SERVICE":    "Service Change",
    "REDUCED_SERVICE":     "Service Change",
    "ADDITIONAL_SERVICE":  "Service Change",
    "STOP_MOVED":          "Service Change",
    "NO_SERVICE":          "Suspended",
    "OTHER_EFFECT":        "Planned Work",
    "UNKNOWN_EFFECT":      "Planned Work",
}


def _build_line_statuses() -> list[dict]:
    """
    Return a list of dicts, one per subway route, each containing:
        route_id, route_short_name, route_color, status, alerts
    """
    routes = query_db("SELECT * FROM routes ORDER BY route_id")
    alerts = query_db("SELECT * FROM service_alerts")

    alert_map: dict[str, list[dict]] = {}
    for alert in alerts:
        for route_id in (alert.get("affected_routes") or "").split(","):
            route_id = route_id.strip()
            if route_id:
                alert_map.setdefault(route_id, []).append(alert)

    statuses = []
    for route in routes:
        rid = route["route_id"]
        route_alerts = alert_map.get(rid, [])

        if not route_alerts:
            status_label = "Good Service"
        else:
            worst = "Good Service"
            priority = {"Good Service": 0, "Planned Work": 1, "Service Change": 2, "Delays": 3, "Suspended": 4}
            for a in route_alerts:
                effect = a.get("effect", "UNKNOWN_EFFECT")
                mapped = EFFECT_TO_STATUS.get(effect, "Planned Work")
                if priority.get(mapped, 0) > priority.get(worst, 0):
                    worst = mapped
            status_label = worst

        statuses.append(
            {
                "route_id": rid,
                "route_short_name": route.get("route_short_name", rid),
                "route_color": route.get("route_color", ""),
                "status": status_label,
                "alert_count": len(route_alerts),
                "alerts": [
                    {
                        "alert_id": a["alert_id"],
                        "header_text": a["header_text"],
                        "effect": a["effect"],
                    }
                    for a in route_alerts
                ],
            }
        )

    return statuses


@status_bp.route("")
def service_status():
    """Aggregated status of every MTA subway line."""
    return jsonify(_build_line_statuses())


@status_bp.route("/summary")
def status_summary():
    """Compact counts: how many lines have good service, delays, etc."""
    statuses = _build_line_statuses()
    summary: dict[str, int] = {}
    for s in statuses:
        label = s["status"]
        summary[label] = summary.get(label, 0) + 1

    return jsonify(
        {
            "total_lines": len(statuses),
            "breakdown": summary,
        }
    )
