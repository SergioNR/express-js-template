#!/bin/sh
set -e

npx prisma db push --accept-data-loss --skip-generate # for LOCAL build

echo "Starting application"
exec npm run start