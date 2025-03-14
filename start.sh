#!/bin/sh
set -e


npx prisma migrate deploy

echo "Starting application"
exec npm run start