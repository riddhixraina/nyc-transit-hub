from flask import Flask
from flask_cors import CORS

from config import config_by_name


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])
    CORS(app, origins=app.config.get("CORS_ORIGINS", "*"))

    from app.database import close_db, init_db

    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()

    from app.routes.subway import subway_bp
    from app.routes.alerts import alerts_bp
    from app.routes.accessibility import accessibility_bp
    from app.routes.status import status_bp
    from app.routes.meta import meta_bp
    from app.routes.analytics import analytics_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(subway_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(accessibility_bp)
    app.register_blueprint(status_bp)
    app.register_blueprint(meta_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(chat_bp)

    if not app.config.get("TESTING"):
        from app.services.scheduler import start_scheduler
        start_scheduler(app)

    return app
