#!/bin/sh
set -e

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Make migrations
echo "Making migrations..."
python manage.py makemigrations

# Apply migrations
echo "Applying migrations..."
python manage.py migrate

# Run Gunicorn with SSL
echo "Starting Gunicorn..."
gunicorn project.wsgi:application \
    --bind 0.0.0.0:8000 \
    --certfile=/project/scripts/localhost.crt \
    --keyfile=/project/scripts/localhost.key \
    --workers 3 \
    --timeout 120