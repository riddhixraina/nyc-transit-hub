"""
REST API routes for MTA service alerts.
"""

from flask import Blueprint, jsonify, request

from app.database import query_db

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")


@alerts_bp.route("")
def list_alerts():
    """
    Return all active service alerts.

    Query params:
        route    -- filter to alerts affecting this route (e.g. ?route=A)
        severity -- filter by severity level (e.g. ?severity=WARNING)
    """
    route_filter = request.args.get("route", "").strip().upper()
    severity_filter = request.args.get("severity", "").strip().upper()

    query = "SELECT * FROM service_alerts WHERE 1=1"
    params: list = []

    if route_filter:
        query += " AND affected_routes LIKE ?"
        params.append(f"%{route_filter}%")

    if severity_filter:
        query += " AND severity_level = ?"
        params.append(severity_filter)

    query += " ORDER BY active_period_start DESC"
    rows = query_db(query, params)
    return jsonify(rows)


@alerts_bp.route("/<alert_id>")
def get_alert(alert_id):
    """Return a single alert by its alert_id."""
    row = query_db(
        "SELECT * FROM service_alerts WHERE alert_id = ?",
        (alert_id,),
        one=True,
    )
    if row is None:
        return jsonify({"error": "Alert not found"}), 404
    return jsonify(row)


@alerts_bp.route("/route/<route_id>")
def alerts_for_route(route_id):
    """Return all alerts that affect a given route."""
    rows = query_db(
        """
        SELECT * FROM service_alerts
        WHERE affected_routes LIKE ?
        ORDER BY active_period_start DESC
        """,
        (f"%{route_id}%",),
    )
    return jsonify(rows)
