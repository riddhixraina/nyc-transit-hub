"""
Tests for GTFS-RT protobuf parsing utilities.
"""

from google.transit import gtfs_realtime_pb2

from app.utils.gtfs_helpers import (
    extract_alerts,
    extract_trip_updates,
    parse_feed,
    timestamp_to_iso,
)


def _make_trip_update_feed() -> bytes:
    """Build a minimal GTFS-RT feed with one trip update entity."""
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.header.gtfs_realtime_version = "2.0"
    feed.header.timestamp = 1711800000

    entity = feed.entity.add()
    entity.id = "entity_1"
    tu = entity.trip_update
    tu.trip.trip_id = "trip_123"
    tu.trip.route_id = "A"

    stu = tu.stop_time_update.add()
    stu.stop_id = "A15"
    stu.arrival.time = 1711800060
    stu.arrival.delay = 30
    stu.departure.time = 1711800090

    return feed.SerializeToString()


def _make_alert_feed() -> bytes:
    """Build a minimal GTFS-RT feed with one alert entity."""
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.header.gtfs_realtime_version = "2.0"
    feed.header.timestamp = 1711800000

    entity = feed.entity.add()
    entity.id = "alert_99"
    alert = entity.alert

    period = alert.active_period.add()
    period.start = 1711800000
    period.end = 1711810000

    ie = alert.informed_entity.add()
    ie.route_id = "A"

    translation = alert.header_text.translation.add()
    translation.text = "Test alert header"
    translation.language = "en"

    desc = alert.description_text.translation.add()
    desc.text = "Detailed description"
    desc.language = "en"

    return feed.SerializeToString()


class TestTimestampConversion:
    def test_zero_returns_none(self):
        assert timestamp_to_iso(0) is None

    def test_valid_timestamp(self):
        result = timestamp_to_iso(1711800000)
        assert result is not None
        assert "2024-03-30" in result


class TestParseFeed:
    def test_parse_returns_feed_message(self):
        raw = _make_trip_update_feed()
        feed = parse_feed(raw)
        assert isinstance(feed, gtfs_realtime_pb2.FeedMessage)
        assert len(feed.entity) == 1


class TestExtractTripUpdates:
    def test_extracts_correct_structure(self):
        feed = parse_feed(_make_trip_update_feed())
        updates = extract_trip_updates(feed)
        assert len(updates) == 1

        u = updates[0]
        assert u["trip_id"] == "trip_123"
        assert u["route_id"] == "A"
        assert u["stop_id"] == "A15"
        assert u["delay_seconds"] == 30
        assert u["arrival_time"] is not None
        assert u["departure_time"] is not None

    def test_empty_feed(self):
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.header.gtfs_realtime_version = "2.0"
        updates = extract_trip_updates(feed)
        assert updates == []


class TestExtractAlerts:
    def test_extracts_correct_structure(self):
        feed = parse_feed(_make_alert_feed())
        alerts = extract_alerts(feed)
        assert len(alerts) == 1

        a = alerts[0]
        assert a["alert_id"] == "alert_99"
        assert a["header_text"] == "Test alert header"
        assert a["description_text"] == "Detailed description"
        assert "A" in a["affected_routes"]
        assert a["active_period_start"] is not None

    def test_empty_feed(self):
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.header.gtfs_realtime_version = "2.0"
        alerts = extract_alerts(feed)
        assert alerts == []
