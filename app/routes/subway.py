"""
REST API routes for subway stations, routes, and real-time arrivals.
"""

from flask import Blueprint, jsonify, request

from app.database import query_db

subway_bp = Blueprint("subway", __name__, url_prefix="/api/subway")


@subway_bp.route("/stops")
def list_stops():
    """
    List all stations.

    Query params:
        route  -- filter to stations serving this route letter (e.g. ?route=A)
    """
    route_filter = request.args.get("route", "").strip().upper()

    if route_filter:
        rows = query_db(
            """
            SELECT * FROM stations
            WHERE daytime_routes LIKE ?
            ORDER BY stop_name
            """,
            (f"%{route_filter}%",),
        )
    else:
        rows = query_db("SELECT * FROM stations ORDER BY stop_name")

    return jsonify(rows)


@subway_bp.route("/stops/<stop_id>")
def get_stop(stop_id):
    """Return detail for a single station by stop_id."""
    row = query_db("SELECT * FROM stations WHERE stop_id = ?", (stop_id,), one=True)
    if row is None:
        return jsonify({"error": True, "message": "Station not found"}), 404
    return jsonify(row)


@subway_bp.route("/arrivals/<stop_id>")
def get_arrivals(stop_id):
    """
    Return upcoming arrivals at a station, sorted by arrival_time ascending.

    Also matches the parent station: if stop_id is a parent, returns
    arrivals for all child stops.  If stop_id has a directional suffix
    (e.g. "101N", "101S"), it is used as-is.

    Query params:
        limit  -- max results (default 20)
    """
    limit = request.args.get("limit", 20, type=int)

    rows = query_db(
        """
        SELECT tu.trip_id, tu.route_id, tu.stop_id, tu.arrival_time,
               tu.departure_time, tu.delay_seconds,
               s.stop_name
        FROM trip_updates tu
        LEFT JOIN stations s ON tu.stop_id = s.stop_id
        WHERE tu.stop_id = ?
           OR tu.stop_id LIKE ?
        ORDER BY tu.arrival_time ASC
        LIMIT ?
        """,
        (stop_id, f"{stop_id}%", limit),
    )

    return jsonify(rows)


@subway_bp.route("/routes")
def list_routes():
    """List all subway routes with metadata."""
    rows = query_db("SELECT * FROM routes ORDER BY route_id")
    return jsonify(rows)


@subway_bp.route("/routes/<route_id>")
def get_route(route_id):
    """Return route detail and the stations it serves."""
    route = query_db(
        "SELECT * FROM routes WHERE route_id = ?", (route_id,), one=True
    )
    if route is None:
        return jsonify({"error": True, "message": "Route not found"}), 404

    stops = query_db(
        """
        SELECT * FROM stations
        WHERE daytime_routes LIKE ?
        ORDER BY stop_name
        """,
        (f"%{route_id}%",),
    )

    return jsonify({"route": route, "stops": stops})


@subway_bp.route("/search")
def search_transit():
    """
    Search both station and route metadata for a frontend quick-search box.

    Query params:
        q      -- required free-text query
        limit  -- max number of routes/stops to return per section
    """
    query = request.args.get("q", "").strip()
    limit = request.args.get("limit", 10, type=int)

    if not query:
        return jsonify({"error": True, "message": "Query parameter 'q' is required"}), 400

    like = f"%{query}%"
    stops = query_db(
        """
        SELECT * FROM stations
        WHERE stop_name LIKE ?
           OR stop_id LIKE ?
           OR daytime_routes LIKE ?
        ORDER BY stop_name
        LIMIT ?
        """,
        (like, like, like, limit),
    )
    routes = query_db(
        """
        SELECT * FROM routes
        WHERE route_id LIKE ?
           OR route_short_name LIKE ?
           OR route_long_name LIKE ?
        ORDER BY route_id
        LIMIT ?
        """,
        (like, like, like, limit),
    )

    return jsonify({"query": query, "stops": stops, "routes": routes})
