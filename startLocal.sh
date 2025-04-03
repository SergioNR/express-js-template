#!/bin/sh
set -e


# npx prisma migrate deploy -- IN dev, we DONT want to run this command

echo "Starting application"
exec npm run start