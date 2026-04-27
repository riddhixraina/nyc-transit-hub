"""
Integration tests for accessibility and meta endpoints.
"""

import json


class TestAccessibility:
    def test_equipment_endpoint(self, client):
        resp = client.get("/api/accessibility/equipment")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert len(data) == 1
        assert data[0]["equipment_id"] == "EQ-100"

    def test_outages_endpoint(self, client):
        resp = client.get("/api/accessibility/outages")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert len(data) == 1
        assert data[0]["station_name"] == "Times Sq - 42 St"

    def test_station_accessibility_endpoint(self, client):
        resp = client.get("/api/accessibility/station/A15")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data["station"]["stop_id"] == "A15"
        assert len(data["equipment"]) == 1
        assert len(data["outages"]) == 1

    def test_station_accessibility_missing(self, client):
        resp = client.get("/api/accessibility/station/ZZZ")
        assert resp.status_code == 404
        data = json.loads(resp.data)
        assert data["error"] is True


class TestMeta:
    def test_health_endpoint(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data["status"] == "ok"
        assert "record_counts" in data
        assert data["record_counts"]["stations"] >= 2

