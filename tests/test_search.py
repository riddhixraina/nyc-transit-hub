"""
Integration tests for subway quick-search.
"""

import json


class TestSubwaySearch:
    def test_search_finds_stop_and_route(self, client):
        resp = client.get("/api/subway/search?q=A")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data["query"] == "A"
        assert any(stop["stop_id"] == "A15" for stop in data["stops"])
        assert any(route["route_id"] == "A" for route in data["routes"])

    def test_search_requires_query(self, client):
        resp = client.get("/api/subway/search")
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert data["error"] is True
