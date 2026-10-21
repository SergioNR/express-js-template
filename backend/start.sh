#!/bin/sh
set -e

npx prisma migrate deploy # for LATEST and NEXT builds

echo "Starting application"
#* exec node directly (not `npm run start`): with tini as PID 1 the signal
#* reaches node itself, so SIGTERM triggers gracefulShutdown in app.js.
#* Keep the flags in sync with the `start` script in package.json
exec node --import tsx ./server/app.js
