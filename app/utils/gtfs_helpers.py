"""
Helpers for parsing GTFS-RT protobuf feeds from the MTA.
"""

from datetime import datetime, timezone

from google.transit import gtfs_realtime_pb2


def parse_feed(raw_bytes: bytes) -> gtfs_realtime_pb2.FeedMessage:
    """Deserialize raw protobuf bytes into a GTFS-RT FeedMessage."""
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(raw_bytes)
    return feed


def timestamp_to_iso(ts: int) -> str | None:
    """Convert a POSIX timestamp to an ISO-8601 UTC string, or None if zero."""
    if not ts:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def extract_trip_updates(feed: gtfs_realtime_pb2.FeedMessage) -> list[dict]:
    """
    Walk every entity in the feed and flatten stop_time_updates into dicts
    suitable for database insertion.

    Returns a list of dicts with keys:
        trip_id, route_id, stop_id, arrival_time, departure_time, delay_seconds
    """
    results = []
    for entity in feed.entity:
        if not entity.HasField("trip_update"):
            continue
        tu = entity.trip_update
        trip_id = tu.trip.trip_id
        route_id = tu.trip.route_id

        for stu in tu.stop_time_update:
            arrival_ts = stu.arrival.time if stu.HasField("arrival") else 0
            departure_ts = stu.departure.time if stu.HasField("departure") else 0
            delay = stu.arrival.delay if stu.HasField("arrival") else 0

            results.append(
                {
                    "trip_id": trip_id,
                    "route_id": route_id,
                    "stop_id": stu.stop_id,
                    "arrival_time": timestamp_to_iso(arrival_ts),
                    "departure_time": timestamp_to_iso(departure_ts),
                    "delay_seconds": delay,
                }
            )
    return results


def extract_alerts(feed: gtfs_realtime_pb2.FeedMessage) -> list[dict]:
    """
    Extract service alert entities into dicts suitable for database insertion.

    Returns a list of dicts with keys:
        alert_id, header_text, description_text, severity_level, effect,
        affected_routes, affected_stops, active_period_start, active_period_end
    """
    results = []
    for entity in feed.entity:
        if not entity.HasField("alert"):
            continue
        alert = entity.alert

        header = ""
        if alert.header_text.translation:
            header = alert.header_text.translation[0].text

        description = ""
        if alert.description_text.translation:
            description = alert.description_text.translation[0].text

        routes = set()
        stops = set()
        for ie in alert.informed_entity:
            if ie.route_id:
                routes.add(ie.route_id)
            if ie.stop_id:
                stops.add(ie.stop_id)

        period_start = None
        period_end = None
        if alert.active_period:
            period_start = timestamp_to_iso(alert.active_period[0].start)
            period_end = timestamp_to_iso(alert.active_period[0].end)

        severity = (
            gtfs_realtime_pb2.Alert.SeverityLevel.Name(alert.severity_level)
            if alert.severity_level
            else "UNKNOWN"
        )
        effect = (
            gtfs_realtime_pb2.Alert.Effect.Name(alert.effect)
            if alert.effect
            else "UNKNOWN"
        )

        results.append(
            {
                "alert_id": entity.id,
                "header_text": header,
                "description_text": description,
                "severity_level": severity,
                "effect": effect,
                "affected_routes": ",".join(sorted(routes)),
                "affected_stops": ",".join(sorted(stops)),
                "active_period_start": period_start,
                "active_period_end": period_end,
            }
        )
    return results
