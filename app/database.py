import os
import sqlite3

from flask import g, current_app


def get_db():
    """Return a thread-local database connection, creating one if needed."""
    if "db" not in g:
        db_path = current_app.config["DATABASE_PATH"]
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def close_db(exc=None):
    """Close the database connection at the end of a request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create all tables defined in models.py if they don't already exist."""
    from app.models import ALL_TABLES_SQL

    db = get_db()
    for sql in ALL_TABLES_SQL:
        db.execute(sql)
    db.commit()


def query_db(query, args=(), one=False):
    """Execute a read query and return results as a list of dicts (or a single dict)."""
    cur = get_db().execute(query, args)
    rows = cur.fetchall()
    cur.close()
    if one:
        return dict(rows[0]) if rows else None
    return [dict(row) for row in rows]
