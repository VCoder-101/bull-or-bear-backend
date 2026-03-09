#!/bin/sh
set -e

echo "==> Waiting for PostgreSQL..."
python << 'PYEOF'
import time, os, sys
import psycopg2

url = os.environ.get('DATABASE_URL', '')
for i in range(30):
    try:
        conn = psycopg2.connect(url)
        conn.close()
        print("PostgreSQL is ready!")
        sys.exit(0)
    except Exception as e:
        print(f"Attempt {i+1}/30: not ready ({e}), retrying in 2s...")
        time.sleep(2)

print("ERROR: PostgreSQL not available after 60s")
sys.exit(1)
PYEOF

# Миграции и статика только для django-сервиса, не для celery
case "$1" in
  celery*)
    echo "==> Skipping migrations for Celery worker..."
    ;;
  *)
    echo "==> Running migrations..."
    python manage.py migrate --noinput

    echo "==> Collecting static files..."
    python manage.py collectstatic --noinput
    ;;
esac

exec "$@"
