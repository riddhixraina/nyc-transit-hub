"""
Gemini-powered transit chat assistant.

Receives a natural-language question, gathers relevant DB context
(routes, alerts, stations, arrivals), sends it to Google Gemini,
and returns a grounded answer.
"""

import logging
import re

from flask import Blueprint, current_app, jsonify, request

from app.database import query_db

log = logging.getLogger(__name__)

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

KNOWN_ROUTES = {
    "1", "2", "3", "4", "5", "6", "7",
    "A", "B", "C", "D", "E", "F", "G",
    "J", "L", "M", "N", "Q", "R", "W", "Z",
    "S", "SIR", "FS", "GS", "H",
}

SYSTEM_PROMPT = (
    "You are a helpful NYC subway assistant. "
    "Answer the user's question based ONLY on the transit data provided below. "
    "If the data doesn't contain enough information to answer, say so honestly. "
    "Be concise and direct. When mentioning times, use a human-friendly format. "
    "If a route is suspended or has no service between certain stations, "
    "suggest alternative routes the user could take based on the station data."
)


def _extract_route_ids(text: str) -> list[str]:
    """Pull likely subway route letters/numbers from free text."""
    upper = text.upper()
    found = []
    for token in re.findall(r"\b[A-Z0-9]{1,3}\b", upper):
        if token in KNOWN_ROUTES:
            found.append(token)
    return list(dict.fromkeys(found))


def _extract_station_keywords(text: str) -> list[str]:
    """Pull multi-word station name fragments (2+ word sequences)."""
    words = re.findall(r"[A-Za-z]+(?:\s+[A-Za-z]+)*", text)
    keywords = [w for w in words if len(w) > 3 and w.upper() not in KNOWN_ROUTES]
    return keywords[:5]


def _build_context(route_ids: list[str], station_kws: list[str]) -> str:
    """Query the DB and assemble a context block for the LLM."""
    sections: list[str] = []

    if route_ids:
        statuses = []
        for rid in route_ids:
            alerts = query_db(
                "SELECT header_text, effect, active_period_start, active_period_end "
                "FROM service_alerts WHERE affected_routes LIKE ?",
                (f"%{rid}%",),
            )
            alert_count = len(alerts)
            if not alerts:
                statuses.append(f"  {rid} — Good Service (no active alerts)")
            else:
                effects = {a["effect"] for a in alerts}
                statuses.append(f"  {rid} — {alert_count} alert(s), effects: {', '.join(effects)}")
                for a in alerts[:5]:
                    statuses.append(
                        f"    • {a['header_text']} "
                        f"[{a['effect']}] "
                        f"(from {a['active_period_start'] or '?'} to {a['active_period_end'] or '?'})"
                    )
        sections.append("ROUTE STATUS & ALERTS:\n" + "\n".join(statuses))

    station_rows = []
    for kw in station_kws:
        rows = query_db(
            "SELECT stop_id, stop_name, daytime_routes, borough, ada_accessible "
            "FROM stations WHERE stop_name LIKE ? AND (parent_station = '' OR parent_station IS NULL) "
            "LIMIT 5",
            (f"%{kw}%",),
        )
        station_rows.extend(rows)

    seen_ids = set()
    unique_stations = []
    for s in station_rows:
        if s["stop_id"] not in seen_ids:
            seen_ids.add(s["stop_id"])
            unique_stations.append(s)

    if unique_stations:
        lines = []
        for s in unique_stations[:8]:
            ada = "ADA-accessible" if s["ada_accessible"] else "not ADA-accessible"
            lines.append(
                f"  {s['stop_name']} (ID: {s['stop_id']}, "
                f"routes: {s['daytime_routes']}, "
                f"borough: {s['borough']}, {ada})"
            )
        sections.append("STATIONS FOUND:\n" + "\n".join(lines))

        for s in unique_stations[:3]:
            arrivals = query_db(
                "SELECT tu.route_id, tu.arrival_time, tu.delay_seconds "
                "FROM trip_updates tu "
                "WHERE tu.stop_id = ? OR tu.stop_id LIKE ? "
                "ORDER BY tu.arrival_time ASC LIMIT 8",
                (s["stop_id"], f"{s['stop_id']}%"),
            )
            if arrivals:
                arr_lines = [f"  Upcoming at {s['stop_name']}:"]
                for a in arrivals:
                    delay = f" (delayed {a['delay_seconds']}s)" if a["delay_seconds"] else ""
                    arr_lines.append(f"    {a['route_id']} train — {a['arrival_time']}{delay}")
                sections.append("\n".join(arr_lines))

    if not sections:
        all_alerts = query_db(
            "SELECT header_text, effect, affected_routes FROM service_alerts LIMIT 15"
        )
        if all_alerts:
            lines = ["RECENT SYSTEM ALERTS:"]
            for a in all_alerts:
                lines.append(f"  [{a['affected_routes']}] {a['header_text']} ({a['effect']})")
            sections.append("\n".join(lines))

    return "\n\n".join(sections) if sections else "No specific transit data found for this query."


@chat_bp.route("", methods=["POST"])
def chat():
    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()

    if not message:
        return jsonify({"error": True, "message": "Message is required"}), 400

    api_key = current_app.config.get("GEMINI_API_KEY", "")
    if not api_key:
        return jsonify({"error": True, "message": "Gemini API key is not configured"}), 503

    route_ids = _extract_route_ids(message)
    station_kws = _extract_station_keywords(message)
    context = _build_context(route_ids, station_kws)

    full_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"--- TRANSIT DATA ---\n{context}\n--- END DATA ---\n\n"
        f"User question: {message}"
    )

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(full_prompt)
        reply = response.text
    except Exception as exc:
        log.exception("Gemini API call failed")
        return jsonify({"error": True, "message": f"AI service error: {exc}"}), 502

    sources = []
    if route_ids:
        sources.append(f"Routes checked: {', '.join(route_ids)}")
    if station_kws:
        sources.append(f"Station search: {', '.join(station_kws)}")

    return jsonify({"reply": reply, "sources": sources})
