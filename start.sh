#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Wait for the postgres server to be ready
until pg_isready -h db -U postgres -d public > /dev/null 2>&1; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - running migrations"
npx prisma migrate deploy

echo "Starting application"
exec npm run start