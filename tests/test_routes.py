"""
Integration tests for /api/subway and /api/status endpoints.
"""

import json


class TestListStops:
    def test_returns_stations(self, client):
        resp = client.get("/api/subway/stops")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_filter_by_route(self, client):
        resp = client.get("/api/subway/stops?route=A")
        data = json.loads(resp.data)
        assert len(data) >= 1
        for stop in data:
            assert "A" in stop["daytime_routes"]


class TestGetStop:
    def test_existing_stop(self, client):
        resp = client.get("/api/subway/stops/A15")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data["stop_id"] == "A15"
        assert data["stop_name"] == "Times Sq - 42 St"

    def test_missing_stop(self, client):
        resp = client.get("/api/subway/stops/ZZZZZ")
        assert resp.status_code == 404


class TestArrivals:
    def test_returns_sorted_arrivals(self, client):
        resp = client.get("/api/subway/arrivals/A15")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert len(data) == 2
        assert data[0]["arrival_time"] <= data[1]["arrival_time"]

    def test_limit_param(self, client):
        resp = client.get("/api/subway/arrivals/A15?limit=1")
        data = json.loads(resp.data)
        assert len(data) == 1


class TestListRoutes:
    def test_returns_routes(self, client):
        resp = client.get("/api/subway/routes")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert len(data) >= 2
        route_ids = {r["route_id"] for r in data}
        assert "A" in route_ids
        assert "1" in route_ids


class TestGetRoute:
    def test_existing_route(self, client):
        resp = client.get("/api/subway/routes/A")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data["route"]["route_id"] == "A"
        assert isinstance(data["stops"], list)

    def test_missing_route(self, client):
        resp = client.get("/api/subway/routes/ZZZ")
        assert resp.status_code == 404


class TestServiceStatus:
    def test_returns_all_lines(self, client):
        resp = client.get("/api/status")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert isinstance(data, list)
        assert len(data) >= 2

        a_line = next(s for s in data if s["route_id"] == "A")
        assert a_line["status"] == "Delays"
        assert a_line["alert_count"] >= 1

    def test_good_service_when_no_alerts(self, client):
        resp = client.get("/api/status")
        data = json.loads(resp.data)
        line_1 = next(s for s in data if s["route_id"] == "1")
        assert line_1["status"] == "Good Service"


class TestStatusSummary:
    def test_summary_structure(self, client):
        resp = client.get("/api/status/summary")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert "total_lines" in data
        assert "breakdown" in data
        assert data["total_lines"] >= 2
