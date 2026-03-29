#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Seed demo data if flag is set
if [ "$SEED_DEMO" = "true" ]; then
  python manage.py seed_demo --clear
fi

exec "$@"
