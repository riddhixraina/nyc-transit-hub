"""
Integration tests for the /api/alerts endpoints.
"""

import json


class TestListAlerts:
    def test_returns_all_alerts(self, client):
        resp = client.get("/api/alerts")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_filter_by_route(self, client):
        resp = client.get("/api/alerts?route=A")
        data = json.loads(resp.data)
        assert len(data) >= 1
        for alert in data:
            assert "A" in alert["affected_routes"]

    def test_filter_by_nonexistent_route(self, client):
        resp = client.get("/api/alerts?route=ZZZ")
        data = json.loads(resp.data)
        assert data == []

    def test_filter_by_severity(self, client):
        resp = client.get("/api/alerts?severity=WARNING")
        data = json.loads(resp.data)
        for alert in data:
            assert alert["severity_level"] == "WARNING"


class TestGetAlert:
    def test_existing_alert(self, client):
        resp = client.get("/api/alerts/alert_001")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data["alert_id"] == "alert_001"
        assert data["header_text"] == "A train delays"

    def test_missing_alert(self, client):
        resp = client.get("/api/alerts/nonexistent")
        assert resp.status_code == 404


class TestAlertsForRoute:
    def test_returns_alerts(self, client):
        resp = client.get("/api/alerts/route/A")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert len(data) >= 1

    def test_empty_for_unaffected_route(self, client):
        resp = client.get("/api/alerts/route/7")
        data = json.loads(resp.data)
        assert data == []
