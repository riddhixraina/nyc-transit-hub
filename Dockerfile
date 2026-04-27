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
# Default listen port; Render (and similar) set PORT at runtime.
ENV PORT=5001

RUN pip install --no-cache-dir gunicorn

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY config.py run.py seed_static_data.py ./
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
COPY app/ app/
COPY data/ data/
COPY --from=frontend-build /app/frontend/dist /app/static-frontend

RUN chmod +x /app/docker-entrypoint.sh

# Seed on start, then gunicorn (port from env; see docker-entrypoint.sh).
EXPOSE 5001

CMD ["/app/docker-entrypoint.sh"]
