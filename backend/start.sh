#!/bin/sh
set -e

npx prisma migrate deploy # for LATEST and NEXT builds

echo "Starting application"
exec npm run start