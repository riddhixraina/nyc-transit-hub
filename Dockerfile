FROM python:3.12-slim AS backend

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY config.py run.py seed_static_data.py ./
COPY app/ app/
COPY data/ data/

EXPOSE 5001

CMD ["python", "run.py"]


FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --production=false

COPY frontend/ .
RUN npm run build


FROM python:3.12-slim

WORKDIR /app

ENV FLASK_CONFIG=production

RUN pip install --no-cache-dir gunicorn

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY config.py run.py seed_static_data.py ./
COPY app/ app/
COPY data/ data/
COPY --from=frontend-build /app/frontend/dist /app/static-frontend

# Bind to $PORT in production (e.g. Render). Seed stop_edges and static GTFS on every start
# (slow cold start; ensures trip planner works without manual Shell).
EXPOSE 5001

CMD ["/bin/sh", "-c", "python seed_static_data.py && exec gunicorn --bind 0.0.0.0:$${PORT:-5001} --workers 2 --timeout 120 run:app"]
