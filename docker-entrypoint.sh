#!/bin/sh
set -e
cd /app
python seed_static_data.py
# Shell expands PORT here — avoids Docker CMD $$ mangling (e.g. '1PORT' on Render)
PORT="${PORT:-5001}"
exec gunicorn --bind "0.0.0.0:${PORT}" --workers 2 --timeout 120 run:app
