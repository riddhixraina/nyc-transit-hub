"""
Shared pytest fixtures for the NYC Transit Hub test suite.
"""

import os
import tempfile

import pytest

from app import create_app
from app.database import get_db, init_db


@pytest.fixture()
def app():
    """Create a test Flask application with a temporary SQLite database."""
    db_fd, db_path = tempfile.mkstemp(suffix=".db")

    test_app = create_app("testing")
    test_app.config["DATABASE_PATH"] = db_path

    with test_app.app_context():
        init_db()
        _seed_test_data()

    yield test_app

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture()
def client(app):
    """A Flask test client bound to the test app."""
    return app.test_client()


def _seed_test_data():
    """Insert minimal reference data for route and station tests."""
    db = get_db()

    db.execute(
        """
        INSERT INTO routes (route_id, route_short_name, route_long_name,
                            route_color, route_text_color)
        VALUES ('A', 'A', '8 Avenue Express', '2850AD', 'FFFFFF')
        """
    )
    db.execute(
        """
        INSERT INTO routes (route_id, route_short_name, route_long_name,
                            route_color, route_text_color)
        VALUES ('1', '1', 'Broadway - 7 Avenue Local', 'EE352E', 'FFFFFF')
        """
    )

    db.execute(
        """
        INSERT INTO stations (stop_id, stop_name, stop_lat, stop_lon,
                              parent_station, ada_accessible, ada_notes,
                              borough, daytime_routes)
        VALUES ('A15', 'Times Sq - 42 St', 40.7559, -73.9870,
                '', 1, '', 'M', 'A C E')
        """
    )
    db.execute(
        """
        INSERT INTO stations (stop_id, stop_name, stop_lat, stop_lon,
                              parent_station, ada_accessible, ada_notes,
                              borough, daytime_routes)
        VALUES ('101', 'Van Cortlandt Park - 242 St', 40.8892, -73.8985,
                '', 1, '', 'Bx', '1')
        """
    )

    db.execute(
        """
        INSERT INTO trip_updates (trip_id, route_id, stop_id,
                                  arrival_time, departure_time,
                                  delay_seconds, fetched_at)
        VALUES ('trip_001', 'A', 'A15',
                '2026-03-30T12:05:00+00:00', '2026-03-30T12:05:30+00:00',
                0, '2026-03-30T12:00:00+00:00')
        """
    )
    db.execute(
        """
        INSERT INTO trip_updates (trip_id, route_id, stop_id,
                                  arrival_time, departure_time,
                                  delay_seconds, fetched_at)
        VALUES ('trip_002', 'A', 'A15',
                '2026-03-30T12:10:00+00:00', '2026-03-30T12:10:30+00:00',
                120, '2026-03-30T12:00:00+00:00')
        """
    )

    db.execute(
        """
        INSERT INTO service_alerts (alert_id, header_text, description_text,
                                    severity_level, effect, affected_routes,
                                    affected_stops, active_period_start,
                                    active_period_end, fetched_at)
        VALUES ('alert_001', 'A train delays', 'Signal problems near 59 St',
                'WARNING', 'SIGNIFICANT_DELAYS', 'A',
                'A15', '2026-03-30T10:00:00+00:00',
                '2026-03-30T14:00:00+00:00', '2026-03-30T12:00:00+00:00')
        """
    )

    db.commit()
