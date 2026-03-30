import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    DEBUG = False
    TESTING = False
    DATABASE_PATH = os.path.join(BASE_DIR, "data", "transit.db")
    STATIC_GTFS_DIR = os.path.join(BASE_DIR, "data", "static")

    SUBWAY_FEED_BASE = (
        "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"
    )
    SUBWAY_FEEDS = {
        "123456S": f"{SUBWAY_FEED_BASE}",
        "ACE":     f"{SUBWAY_FEED_BASE}-ace",
        "BDFM":    f"{SUBWAY_FEED_BASE}-bdfm",
        "G":       f"{SUBWAY_FEED_BASE}-g",
        "JZ":      f"{SUBWAY_FEED_BASE}-jz",
        "L":       f"{SUBWAY_FEED_BASE}-l",
        "NQRW":    f"{SUBWAY_FEED_BASE}-nqrw",
        "7":       f"{SUBWAY_FEED_BASE}-7",
        "SIR":     f"{SUBWAY_FEED_BASE}-si",
    }

    ALERTS_FEED_URL = (
        "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts"
    )

    ELEVATOR_EQUIPMENT_URL = (
        "https://data.ny.gov/resource/evjd-dqpz.json"
    )
    ELEVATOR_OUTAGES_URL = (
        "https://data.ny.gov/resource/w3cp-5gnm.json"
    )

    STATIC_GTFS_ZIP_URL = (
        "http://web.mta.info/developers/data/nyct/subway/google_transit.zip"
    )
    STATION_INFO_URL = "https://data.ny.gov/resource/39hk-dx4f.json"

    POLL_SUBWAY_SECONDS = 30
    POLL_ALERTS_SECONDS = 60
    POLL_ELEVATOR_SECONDS = 300


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DATABASE_PATH = os.path.join(BASE_DIR, "data", "test_transit.db")


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": Config,
}
